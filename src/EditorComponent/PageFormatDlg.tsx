import { FC, use, useEffect, useRef, useState } from "react";
import "./EditorComponent.css";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { PAGE_SIZES } from "tiptap-pagination-plus";
import { setDocumentWidth } from "../ProjectWindow/ProjectSlice";

interface PageFormatProps {
    closeDialog: () => void;
    editor: any;
}
const PageFormatDlg:FC<PageFormatProps> = ({closeDialog, editor}) => {
    const project = useSelector((state: RootState) => state.project.currentProject);
    const dispatch = useDispatch();
    const pageSizeSelectRef = useRef<HTMLSelectElement>(null);

    const pageSizeOptions = [
        { label: 'A4', value: PAGE_SIZES.A4 },
        { label: 'A3', value: PAGE_SIZES.A3 },
        { label: 'A5', value: PAGE_SIZES.A5 },
        { label: 'Letter', value: PAGE_SIZES.LETTER },
        { label: 'Legal', value: PAGE_SIZES.LEGAL },
        { label: 'Tabloid', value: PAGE_SIZES.TABLOID },
    ]

    const setPageSize = (event: React.ChangeEvent<HTMLSelectElement>) => {
        console.log("select = ", JSON.parse(event.target.value))
        editor.chain().focus().updatePageWidth(JSON.parse(event.target.value).pageWidth).run();
        dispatch(setDocumentWidth(JSON.parse(event.target.value).pageWidth));
     }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeDialog();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeDialog]);

    return (
        <div className="page-backdrop" onClick={closeDialog}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
                <h2>Page Format</h2>
                <label>
                    Select Page Format:
                    <select ref={pageSizeSelectRef} onChange={setPageSize}>
                        {pageSizeOptions.map(option => (
                            <option key={option.label} value={JSON.stringify(option.value)}>{option.label}</option>
                        ))}
                    </select>
                </label>
                <hr/>
                <div className="margins">Margins</div>
                <div className="margins">
                    <div className="margin-row">
                        <div className="margin-column"><label>Top:</label><input type="number" value={210} disabled /></div>
                        <div className="margin-column"><label>Left:</label><input type="number" value={210} disabled /></div>
                    </div>
                    <div className="margin-row">
                        <div className="margin-column"><label>Bottom:</label><input type="number" value={210} disabled /></div>
                        <div className="margin-column"><label>Right:</label><input type="number" value={210} disabled /></div>
                    </div>
                </div>
                <button onClick={closeDialog}>Apply</button>
            </div>
        </div>
    );
}

interface ParagraphSpacingProps {
    closeDialog: () => void;
    editor: any;
};

export const ParagraphSpacingDlg:FC<ParagraphSpacingProps> = ({ closeDialog, editor }) => {
    const spacingInputRef = useRef<HTMLInputElement>(null);
    const [spacingInputVal, setSpacingInputVal] = useState("0");

    const beforeSpacingInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("before spacing value = ", event.target.value)
        const newValue = parseFloat(event.target.value);
        setSpacingInputVal(`${newValue}`);
        setParagraphSpacing(`${newValue}`);
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeDialog();
            }
        };
        spacingInputRef.current?.focus();
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeDialog]);

    const setParagraphSpacing = (value: string) => {
        editor.chain().focus().setLineHeight(value).run();
    };

    return (
        <div className="page-backdrop" onClick={closeDialog}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
                <h2>Paragraph Spacing</h2>
                <label>
                    Line Height:
                    <input ref={spacingInputRef} type="number" step={0.1} value={spacingInputVal} onChange={beforeSpacingInputChange} />
                </label>
                <hr/>
                <button onClick={() => setParagraphSpacing(spacingInputVal)}>Apply</button>
            </div>
        </div>
    );
}

export default PageFormatDlg;