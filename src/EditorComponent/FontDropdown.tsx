import { Editor } from "@tiptap/react";
import { useState, useEffect, useRef, FC } from "react";
import { invoke } from "@tauri-apps/api/core"; 
import { useDispatch, useSelector } from "react-redux";
import "./FontDropdown.css";
import { setFontState } from "../ProjectWindow/ProjectSlice";
import { RootState } from "../../store";

export interface FontDropdownProps {
  editor: Editor | null;
};

interface FontSizeDropdownProps {
    editor: Editor | null;
    value: string;
    onChange: (size: string) => void;
}

const FontSizeDropdown: FC<FontSizeDropdownProps> = ({ editor, value, onChange }) => {
    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
    const currentSize = parseInt(value, 10) || 12;

    return (
        <div className="fontsize-dropdown">
            <select value={currentSize} onChange={(e) => {
                const newSize = e.target.value;
                onChange(`${newSize}pt`); // Notify parent
                if (editor) {
                    editor.chain().focus().setFontSize(`${newSize}pt`).run();
                }
            }}>
                {fontSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                ))}
            </select>
        </div>
    );
}

const systemFontsPromise = invoke<string[]>("get_system_fonts");
const FontDropdown: FC<FontDropdownProps> = ({ editor }) => {
    // Specify the type for fontOptions
    const selectedFontState = useSelector((state: RootState) => state.project.selectedFont);
    const [fontOptions, setFontOptions] = useState<string[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedFont, setSelectedFont] = useState("");
    const fontdropdownRef = useRef<HTMLDivElement>(null);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        fontFamily: '',
        fontSize: '12pt',
    });
    const dispatch = useDispatch();

    // Fetch the system fonts on mount
    useEffect(() => {
        const loadFonts = async () => {
            try {
                const fonts = await systemFontsPromise;
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
        if (!editor) return;

        const updateFontDropdown = () => {
            setActiveFormats({
                bold: editor.isActive('bold'),
                fontFamily: editor.getAttributes('textStyle').fontFamily,
                fontSize: editor.getAttributes('textStyle').fontSize,
            });
        };

        // Run it once on mount to get initial state
        updateFontDropdown();

        // Subscribe to changes
        editor.on('transaction', updateFontDropdown);

        // Cleanup listener on unmount
        return () => {
            editor.off('transaction', updateFontDropdown);
        };
    }, [editor]); // Re-run if the editor instance itself changes

    useEffect(() => {
        setSelectedFont(activeFormats.fontFamily || ""); // Update the selected font in the dropdown based on editor state
    }, [activeFormats]);


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
            <FontSizeDropdown editor={editor} value={activeFormats.fontSize || "12pt"} onChange={(size) => {
                if (editor) {
                    editor.chain().focus().setFontSize(size).run();
                }
            }} />
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