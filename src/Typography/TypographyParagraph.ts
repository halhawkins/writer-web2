import { Paragraph } from '@tiptap/extension-paragraph';

const TypographyParagraph = Paragraph.extend({
    addAttributes() {
        return {
            // Line Height
            lineHeight: {
                default: null,
                parseHTML: element => element.style.lineHeight,
                renderHTML: attributes => {
                if (!attributes.lineHeight) return {}
                return { style: `line-height: ${attributes.lineHeight}` }
                },
            },
            // Letter Spacing (Kerning)
            letterSpacing: {
                default: null,
                parseHTML: element => element.style.letterSpacing,
                renderHTML: attributes => {
                if (!attributes.letterSpacing) return {}
                return { style: `letter-spacing: ${attributes.letterSpacing}` }
                },
            },
            // Paragraph Spacing (Margin Bottom)
            paragraphSpacing: {
                default: null,
                parseHTML: element => element.style.marginBottom,
                renderHTML: attributes => {
                if (!attributes.paragraphSpacing) return {}
                return { style: `margin-bottom: ${attributes.paragraphSpacing}` }
                },
            },
        }
    }
})

export { TypographyParagraph }