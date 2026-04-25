import { Editor } from "@tiptap/react";
import { useState, useEffect, useRef, FC } from "react";
import { invoke } from "@tauri-apps/api/core"; 
import { useDispatch } from "react-redux";
import "./FontDropdown.css";
import { setFontState } from "../ProjectWindow/ProjectSlice";

export interface FontDropdownProps {
  editor: Editor | null;
};

const FontSizeDropdown: FC<FontDropdownProps> = ({ editor }) => {
    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    const [selectedFontSize, setSelectedFontSize] = useState(12);
    return (
        <div className="font-size-dropdown">
            <select value={selectedFontSize} onChange={(e) => {
                setSelectedFontSize(parseInt(e.target.value));
                if (editor) {
                    editor.chain().focus().setFontSize(`${selectedFontSize.toString()}pt`).run();
                }
            }}>
                {fontSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                ))}
            </select>
        </div>
    );
}

const FontDropdown: FC<FontDropdownProps> = ({ editor }) => {
    // Specify the type for fontOptions
    const [fontOptions, setFontOptions] = useState<string[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedFont, setSelectedFont] = useState("");
    const fontdropdownRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();

    // Fetch the system fonts on mount
    useEffect(() => {
        const loadFonts = async () => {
            try {
                const fonts = await invoke<string[]>("get_system_fonts");
                setFontOptions(fonts);
                
                // Optionally set a default font if one isn't set yet
                if (fonts.length > 0) {
                    setSelectedFont("Arial"); 
                }
            } catch (error) {
                console.error("Failed to load system fonts:", error);
            }
        };

        loadFonts();
    }, []);

    useEffect(() => {
        if (editor && selectedFont) {
             // Just an example check: ensure your editor has the TextStyle and FontFamily extensions loaded
             editor.chain().focus().setFontFamily(selectedFont).run();
        }
    }, [editor, selectedFont]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setDropdownOpen(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (fontdropdownRef.current && !fontdropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [dropdownOpen]);

    
    return (
        <div className="font-dropdown" ref={fontdropdownRef}>
            <div className="label">Font:</div>
            <div className="font-dropdown-container2">
                <div className="selected-font" style={{ fontFamily: selectedFont }}>{selectedFont || "Select Font"}</div>
                <div className="dropdown-arrow" onClick={() => setDropdownOpen(!dropdownOpen)}><img src="/chevron-down.svg" /></div>
            </div>
            <FontSizeDropdown editor={editor} />
            { dropdownOpen && (
                <div className="dropdown-content">
                    {fontOptions.map((font: string) => (
                        <div 
                            key={font}
                            className={'dropdown-item ' + (selectedFont === font ? "selected" : "")}
                            style={{ fontFamily: font }} // Render the item in its own font!
                            onClick={() => {
                                setSelectedFont(font);
                                setDropdownOpen(false); // Close dropdown on selection
                                if (editor) {
                                    editor.chain().focus().setFontFamily(font).run();
                                    dispatch(setFontState(font)); // Update the selected font in the Redux store
                                }}}>
                            {font}
                        </div>
                    ))}
                </div>)
            }
        </div>
    );
}

export default FontDropdown;