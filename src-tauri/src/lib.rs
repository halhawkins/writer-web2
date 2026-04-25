// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde_json::json;
use rtf_parser_tt::{RtfDocument, Painter};
use rtf_parser_tt::paragraph::Alignment;

// helper crates used for image data conversion
use base64;
use base64::Engine;
use hex;


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Convert an RTF document string into a Quill.js delta payload.
///
/// This originally started life as a two‑step RTF→HTML→delta conversion,
/// but the current implementation parses the RTF directly so that we can
/// carry extra painter properties (font size, colour, etc.) and also spot
/// non‑text objects like embedded pictures.
///
/// The function now handles:
/// * inline attributes: **bold**, *italic*, underline, strike, superscript,
///   subscript, small‑caps
/// * font family, size and colour
/// * heading levels (inferred from font size) and paragraph alignment
///   are emitted on the newline ops, just as Quill expects
/// * very simple image support – the RTF is scanned for `\pict` blocks and
///   the binary data is converted to a `data:` URI which becomes an
///   `insert: { image: ... }` operation
///
/// The delta is a JSON object containing an `ops` array that can be handed
/// directly to Quill’s `setContents`.
#[tauri::command]
fn rtf_to_quill_delta(rtf: &str) -> Result<serde_json::Value, String> {
    // parse the RTF directly so we can access painter properties like size/color
    let doc = RtfDocument::try_from(rtf)
        .map_err(|e| format!("rtf parse failed: {}", e))?;

    /// attributes that apply to *inline runs* of text (bold/italic/etc)
    fn inline_attrs_from_painter(
        p: &Painter,
        doc: &RtfDocument,
    ) -> serde_json::Map<String, serde_json::Value> {
        let mut attrs = serde_json::Map::new();
        if p.bold {
            attrs.insert("bold".to_string(), serde_json::Value::Bool(true));
        }
        if p.italic {
            attrs.insert("italic".to_string(), serde_json::Value::Bool(true));
        }
        if p.underline {
            attrs.insert("underline".to_string(), serde_json::Value::Bool(true));
        }
        if p.strike {
            attrs.insert("strike".to_string(), serde_json::Value::Bool(true));
        }
        if p.superscript {
            attrs.insert("script".to_string(), serde_json::Value::String("super".into()));
        }
        if p.subscript {
            attrs.insert("script".to_string(), serde_json::Value::String("sub".into()));
        }
        if p.smallcaps {
            attrs.insert("smallcaps".to_string(), serde_json::Value::Bool(true));
        }
        // font size is stored in half‑points; convert to points for Quill
        if p.font_size != Painter::default().font_size {
            let pts = p.font_size as f32 / 2.0;
            attrs.insert("size".to_string(), serde_json::Value::String(format!("{:.1}pt", pts)));
        }
        if p.color_ref != Painter::default().color_ref {
            if let Some(color) = doc.header.color_table.get(&p.color_ref) {
                let hex = format!("#{:02X}{:02X}{:02X}", color.red, color.green, color.blue);
                attrs.insert("color".to_string(), serde_json::Value::String(hex));
            }
        }
        if p.font_ref != Painter::default().font_ref {
            if let Some(font) = doc.header.font_table.get(&p.font_ref) {
                attrs.insert("font".to_string(), serde_json::Value::String(font.name.clone()));
            }
        }
        attrs
    }

    /// attributes that should accompany a paragraph break
    fn para_attrs(
        p: &Painter,
        paragraph: &Alignment,
    ) -> serde_json::Map<String, serde_json::Value> {
        let mut attrs = serde_json::Map::new();
        // simplistic heading detection based on font size; RTF doesn't mark
        // headers explicitly in the `Painter`, so we infer using common sizes.
        let pts = p.font_size as f32 / 2.0;
        let header_level = if pts >= 32.0 {
            1
        } else if pts >= 24.0 {
            2
        } else if pts >= 18.0 {
            3
        } else if pts >= 14.0 {
            4
        } else if pts >= 12.0 {
            5
        } else if pts >= 10.0 {
            6
        } else {
            0
        };
        if header_level > 0 {
            attrs.insert("header".to_string(), serde_json::Value::Number(header_level.into()));
        }
        match paragraph {
            Alignment::Center => {
                attrs.insert("align".to_string(), serde_json::Value::String("center".into()));
            }
            Alignment::RightAligned => {
                attrs.insert("align".to_string(), serde_json::Value::String("right".into()));
            }
            Alignment::Justify => {
                attrs.insert("align".to_string(), serde_json::Value::String("justify".into()));
            }
            _ => {}
        }
        attrs
    }

    /// scan the raw RTF for `\pict` sections and attempt to build data URLs
fn extract_images(rtf: &str) -> Vec<String> {
        let mut urls = Vec::new();
        let mut pos = 0;
        let len = rtf.len();

        // Helper: skip past all RTF control words and whitespace, then collect
        // the hex-encoded image bytes up to the closing `}`.
        // RTF control words look like `\keyword` or `\keywordN`; we must skip
        // ALL of them before the actual hex data begins, otherwise the word
        // text leaks into `hexstr` and corrupts `hex::decode`.
        fn collect_hex(rtf: &str, mut p: usize) -> (String, usize) {
            let len = rtf.len();
            let mut hexstr = String::new();
            let bytes = rtf.as_bytes();

            // Skip leading whitespace and RTF control words until we reach
            // a character that is a valid hex digit (the image data proper).
            loop {
                // consume whitespace
                while p < len && bytes[p].is_ascii_whitespace() {
                    p += 1;
                }
                if p >= len {
                    break;
                }
                // if next char is a backslash this is another control word –
                // skip to the end of the token (space, `{`, `}`, or EOF)
                if bytes[p] == b'\\' {
                    p += 1; // skip backslash
                    while p < len
                        && !bytes[p].is_ascii_whitespace()
                        && bytes[p] != b'{'
                        && bytes[p] != b'}'
                    {
                        p += 1;
                    }
                    continue;
                }
                // any other non-hex, non-brace character before the data
                // (shouldn't happen in well-formed RTF, but be defensive)
                if bytes[p] != b'}' && !(bytes[p] as char).is_ascii_hexdigit() {
                    p += 1;
                    continue;
                }
                break;
            }

            // Now collect hex digits (skipping embedded whitespace) until `}`
            while p < len {
                let c = bytes[p] as char;
                if c == '}' {
                    p += 1; // consume the closing brace
                    break;
                }
                if c.is_ascii_hexdigit() {
                    hexstr.push(c);
                }
                // silently skip whitespace and any stray non-hex chars inside
                // the data block (some RTF writers insert line-breaks mid-data)
                p += 1;
            }
            (hexstr, p)
        }

        while pos < len {
            // Search for picture or object data
            if let Some(idx) = rtf[pos..].find("\\pict") {
                pos += idx + 5;
                // collect_hex now handles skipping all control words itself
                
                // 2. Handling the two returned values
                let (hex_string, new_pos) = collect_hex(rtf, pos);
                pos = new_pos; // Update the main loop's position

                if let Ok(bytes) = hex::decode(&hex_string) {
                    let mime = if bytes.starts_with(&[0x89, b'P', b'N', b'G']) {
                        "image/png"
                    } else if bytes.starts_with(&[0xFF, 0xD8]) {
                        "image/jpeg"
                    } else {
                        "application/octet-stream"
                    };
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                    urls.push(format!("data:{};base64,{}", mime, b64));
                }
                continue;
            }

            if let Some(idx) = rtf[pos..].find("\\objdata") {
                pos += idx + 8;
                // collect_hex now handles skipping all control words itself

                // 2. Handling the two returned values here as well
                let (hex_string, new_pos) = collect_hex(rtf, pos);
                pos = new_pos;

                if let Ok(bytes) = hex::decode(&hex_string) {
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                    urls.push(format!("data:application/octet-stream;base64,{}", b64));
                }
                continue;
            }
            pos += 1;
        }
        urls
    }

    fn push_text(
        ops: &mut Vec<serde_json::Value>,
        text: &str,
        attrs: &serde_json::Map<String, serde_json::Value>,
    ) {
        if text.is_empty() {
            return;
        }
        if attrs.is_empty() {
            ops.push(json!({ "insert": text }));
        } else {
            ops.push(json!({ "insert": text, "attributes": serde_json::Value::Object(attrs.clone()) }));
        }
    }

    // debug output: show parsed blocks so we can see painter attributes
    // eprintln!("rtf_to_quill_delta: {} style blocks", doc.body.len());
    // for (i, block) in doc.body.iter().enumerate() {
    //     eprintln!(" block[{}] text={:?} painter={:?}", i, block.text, block.painter);
    // }

    let mut ops: Vec<serde_json::Value> = Vec::new();

    // pre‑scan the raw rtf text for embedded pictures (either pict groups or
    // object data) so we can emit them in roughly the same order as they
    // appear.  We'll append any leftovers after the last block.
    let mut image_urls = extract_images(rtf);
    // eprintln!("extracted {} image urls", image_urls.len());
    for (i, url) in image_urls.iter().enumerate() {
        let preview = &url[..url.find(",").unwrap_or(40).min(url.len())];
        // eprintln!(" image[{}]: ({} bytes, starts with: '{}...')", i, url.len(), preview);
    }

    for block in &doc.body {
        let text = &block.text;
        if text.is_empty() {
            continue;
        }

        let inline_attrs = inline_attrs_from_painter(&block.painter, &doc);
        let para_attrs_map = para_attrs(&block.painter, &block.paragraph.alignment);

        let mut inserted_image_in_block = false;
        // Buffer for accumulating a run of plain text before we flush it as
        // a single op.  This avoids creating one JSON object per character,
        // which was the root cause of the hang on large embedded images.
        let mut text_buf = String::new();

        // Flush whatever is sitting in text_buf as a text op, then clear it.
        macro_rules! flush_text {
            () => {
                if !text_buf.is_empty() {
                    push_text(&mut ops, &text_buf, &inline_attrs);
                    text_buf.clear();
                }
            };
        }

        let mut chars = text.chars().peekable();

        while let Some(ch) = chars.next() {
            // 1. Handle Newlines (Apply paragraph attributes here)
            if ch == '\n' || ch == '\r' {
                flush_text!();
                if para_attrs_map.is_empty() {
                    ops.push(json!({ "insert": "\n" }));
                } else {
                    ops.push(json!({ 
                        "insert": "\n", 
                        "attributes": serde_json::Value::Object(para_attrs_map.clone()) 
                    }));
                }
                continue;
            }

            // 2. Handle Image Placeholders (U+FFFC object-replacement character)
            if ch == '\u{FFFC}' {
                flush_text!();
                // Use remove(0) so images come out in document order, not reversed.
                if !image_urls.is_empty() {
                    let url = image_urls.remove(0);
                    ops.push(json!({ "insert": { "image": url } }));
                    inserted_image_in_block = true;
                }
                continue;
            }

            // 3. Skip raw image hex data that the RTF parser has left in the
            //    text block verbatim.  A run of hex digits longer than 1 000
            //    characters is almost certainly image data, not real content.
            //    We consume the whole run without building ops for it.
            if ch.is_ascii_hexdigit() && text.len() > 1000 {
                flush_text!();
                if !inserted_image_in_block && !image_urls.is_empty() {
                    let url = image_urls.remove(0);
                    ops.push(json!({ "insert": { "image": url } }));
                    inserted_image_in_block = true;
                }
                // Drain all remaining hex/whitespace characters in this block
                // so we do not iterate through millions of digits one by one.
                while let Some(&next_ch) = chars.peek() {
                    if next_ch.is_ascii_hexdigit() || next_ch.is_ascii_whitespace() {
                        chars.next();
                    } else {
                        break;
                    }
                }
                continue;
            }

            // 4. Accumulate regular text into the buffer
            text_buf.push(ch);
        }

        // Flush any remaining buffered text at the end of the block
        flush_text!();

        // 5. Cleanup: Header Inference for blocks without explicit newlines
        if !text.ends_with('\n') && !text.ends_with('\r') {
            if let Some(header_val) = para_attrs_map.get("header") {
                let mut attrs = serde_json::Map::new();
                attrs.insert("header".to_string(), header_val.clone());
                if let Some(align_val) = para_attrs_map.get("align") {
                    attrs.insert("align".to_string(), align_val.clone());
                }
                ops.push(json!({ "insert": "\n", "attributes": serde_json::Value::Object(attrs) }));
            }
        }
    }

// end of inserted code
    // ensure document ends with a newline so Quill sees the final paragraph
    if let Some(last) = ops.last() {
        if last.get("insert") != Some(&serde_json::Value::String("\n".to_string())) {
            // we push a trailing newline with the same paragraph attributes as the
            // last style block, if we have one.
            if let Some(last_blk) = doc.body.last() {
                let trailing_attrs = para_attrs(&last_blk.painter, &last_blk.paragraph.alignment);
                if trailing_attrs.is_empty() {
                    ops.push(json!({ "insert": "\n" }));
                } else {
                    ops.push(json!({ "insert": "\n", "attributes": serde_json::Value::Object(trailing_attrs) }));
                }
            } else {
                ops.push(json!({ "insert": "\n" }));
            }
        }
    }

    let result = json!({ "ops": ops });
    // eprintln!("rtf_to_quill_delta result: {}", result);
    Ok(result)
}

use font_kit::source::SystemSource;

#[tauri::command]
fn get_system_fonts() -> Vec<String> {
    let mut fonts = match SystemSource::new().all_families() {
        Ok(families) => families,
        Err(_) => vec![
            "Arial".to_string(), 
            "Courier New".to_string(), 
            "Times New Roman".to_string()
        ], // Safe fallback just in case
    };
    
    // Sort alphabetically and remove duplicates
    fonts.sort();
    fonts.dedup();
    
    fonts
}

#[cfg(test)]
mod rust_tests {
    use super::*;

    #[test]
    fn simple_rtf_to_delta_plain() {
        // this rtf contains bold and italic; expect ops with attributes
        let rtf = "{\\rtf1\\ansi\\deff0 {\\b Bold} and {\\i italic}}";
        let delta = rtf_to_quill_delta(rtf).expect("conversion should succeed");
        let expected = serde_json::json!({
            "ops": [
                { "insert": "Bold", "attributes": { "bold": true } },
                { "insert": " and " },
                { "insert": "italic", "attributes": { "italic": true } },
                { "insert": "\n" }
            ]
        });
        assert_eq!(delta, expected);
    }

    #[test]
    fn rtf_preserves_size_and_color() {
        // size in rtf is specified with \fsNN where NN is half-points
        // color table: red=255\green0\blue0
        let rtf = "{\\rtf1\\ansi\\deff0 {\\colortbl;\\red255\\green0\\blue0;}\\fs48\\cf1 Red big}";
        let delta = rtf_to_quill_delta(rtf).expect("conversion should succeed");
        // font size 48 half-points -> 24pt, color #FF0000; 24pt is treated as
        // a level‑2 heading, so the newline carries `header: 2`.
        let expected = serde_json::json!({
            "ops": [
                { "insert": "Red big", "attributes": { "size": "24.0pt", "color": "#FF0000" } },
                { "insert": "\n", "attributes": { "header": 2 } }
            ]
        });
        assert_eq!(delta, expected);
    }

    #[test]
    fn header_size_becomes_header_attr() {
        // really big font should be recognized as a header
        let rtf = "{\\rtf1\\ansi\\deff0 \\fs144 Heading text}"; // 72pt
        let delta = rtf_to_quill_delta(rtf).expect("conversion should succeed");
        let expected = serde_json::json!({
            "ops": [
                // since we inferred a header from the size we also report the
                // font-size on the text itself
                { "insert": "Heading text", "attributes": { "size": "72.0pt" } },
                { "insert": "\n", "attributes": { "header": 1 } }
            ]
        });
        assert_eq!(delta, expected);
    }
    #[test]
    fn real_doc_heading_and_paragraphs() {
        // mimics the user's sample: name repeated, a large 'Lorem' heading,
        // then two lines of Gilbert & Sullivan text in smaller size.
        let rtf = "{\\rtf1\\ansi\\deff0 ".to_string()
            + "{\\colortbl ;\\red15\\green71\\blue97;}"
            + "Harold HawkinsHarold Hawkins "
            + "{\\fs80\\cf1 Lorem}"
            + "{\\fs48 I am the very model of a modern major general. \\par I've information animal vegetable and mineral\\par.}"
            + "}";
        let delta = rtf_to_quill_delta(&rtf).expect("conversion should succeed");
        // Expect Lorem to be the top‑level header (40pt → header 1) and the
        // subsequent block (24pt) to also end with a header 2 newline under the
        // current heuristic.  The two Gilbert & Sullivan lines are combined in
        // a single op by the parser.
        let expected = serde_json::json!({
            "ops": [
                { "insert": "Harold HawkinsHarold Hawkins " },
                { "insert": "Lorem", "attributes": { "color": "#0F4761", "size": "40.0pt" } },
                { "insert": "\n", "attributes": { "header": 1 } },
                { "insert": "I am the very model of a modern major general. I've information animal vegetable and mineral", "attributes": { "size": "24.0pt" } },
                { "insert": "\n", "attributes": { "header": 2 } }
            ]
        });
        assert_eq!(delta, expected);
    }
    #[test]
    fn picture_should_be_converted_to_image_op() {
        // a 1x1 png embedded in the RTF.  the parser represents it as the
        // object‑replacement character (U+FFFC) or may simply drop it from the
        // body entirely. this test is mostly diagnostic so we can see what the
        // parser gives us.
        let rtf = "{\\rtf1\\ansi{\\pict\\pngblip\\picw1\\pich1 "
            // simplified, we don't care about real image bytes here, just the
            // fact that the control words exist; the extractor will produce an
            // empty data URI if decoding fails.
            .to_string()
            + "89504E470D0A1A0A0000000D4948445200000001000000010806000000"
            + "1F15C4890000000A4944415408D763FA0F00010100FD02C33A0000000049454E44AE426082}}";
        let doc = RtfDocument::try_from(&rtf as &str).unwrap();
        // eprintln!("parsed body: {:?}", doc.body);
        let delta = rtf_to_quill_delta(&rtf).expect("conversion should succeed");
        // eprintln!("delta: {}", delta);
        let ops = delta["ops"].as_array().unwrap();
        assert!(ops.iter().any(|op| {
            op.get("insert")
                .and_then(|i| i.get("image"))
                .is_some()
        }), "no image op found");
    }
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, rtf_to_quill_delta])
        .invoke_handler(tauri::generate_handler![get_system_fonts])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
