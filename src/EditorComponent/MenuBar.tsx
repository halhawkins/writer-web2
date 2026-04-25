import { Editor, useEditorState } from '@tiptap/react';
import { menuBarStateSelector } from './menuBarState';
import { load } from "@tauri-apps/plugin-store";
import './EditorComponent.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { FC, useRef, useState } from 'react';
import { setCurrentProject, setDisplayMode, setShowEditor } from '../ProjectWindow/ProjectSlice';
import "./MenuBar.css"
import PageFormatDlg, { ParagraphSpacingDlg } from './PageFormatDlg';
import { BubbleMenu } from '@tiptap/react/menus';
import { setShowSettings } from '../AppMenu/AppMenuSlice';
import FontDropdown from './FontDropdown';

async function getPath() {
  const appSettings = await load("writers-app-store.json");
  const path = await appSettings.get<string | null>("projectPath");
  return path;
}

interface TableMenuProps {
  editor: Editor;
}
interface MenuBarProps {
  editor: Editor;
  toggleEditor: (show: boolean) => void;
}

export const TableMenu: FC<TableMenuProps> = ({ editor }) => {
  return (
    <BubbleMenu
      key="table"
      editor={editor}
      shouldShow={({ editor }) => {
        // Show only when the selection is inside a table
        return editor.isActive('table');
      }}
    >
      <div className="bubble-menu">
        <button onClick={() => editor.chain().focus().addRowAfter().run()}>
          <img src="/insert-row.svg" alt="Insert Row" />
        </button>

        <button onClick={() => editor.chain().focus().splitCell().run()}>
          <img src="/table-cells-split.svg" alt="Split cells" />
        </button>

        <button onClick={() => editor.chain().focus().mergeCells().run()}>
          <img src="/table-cells-merge.svg" alt="Merge cells" />
        </button>

        <button onClick={() => editor.chain().focus().deleteRow().run()}>
          <img src="/delete-row.svg" alt="Delete Row" />
        </button>
      </div>
    </BubbleMenu>
  );
};
export const MenuBar:FC<MenuBarProps> = ({ editor, toggleEditor }: MenuBarProps) => {
  const [headerDropdown, setHeaderDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showParagraphSpacing, setShowParagraphSpacing] = useState(false);
  const [leftMargin, setLeftMargin] = useState("1in");
  const [rightMargin, setRightMargin] = useState("1in");
  const [topMargin, setTopMargin] = useState("1in");
  const [bottomMargin, setBottomMargin] = useState("1in");
  const [showPageSettings, setShowPageSettings] = useState(false);
  const documentstate = useSelector((state: RootState) => state.project);
  const project = useSelector((state: RootState) => state.project.currentProject);
  // const appState = useSelector((state: RootState) => state
  const dispatch = useDispatch();
  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  })
  
  const toSnakeCase = (str: string) => {
      const parts = str
          .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
      return parts ? parts.map(x => x).join('_') : '';
  };


  if (!editor || !editorState) {
    return null
  }

  const handleHeaderDropdownClick = () => {
    if (!headerDropdown) {
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setHeaderDropdown(false);
          window.removeEventListener("keydown", handleHeaderDropdownClick);
        }
      });
    } else {
      window.removeEventListener("keydown", handleHeaderDropdownClick);
    }
    setHeaderDropdown(!headerDropdown);
  }

  const setDocumentMargins = () => {
    // console.log("Setting margins:");
    setShowPageSettings(!showPageSettings);
  }
  
  const setParagraphSpacing = () => {
    console.log("Setting paragraph spacing:");
    setShowParagraphSpacing(!showParagraphSpacing);
  }

  return (
    <>
      <div className="control-group">
        <div className="button-group">
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(event) => {
            const file = event.target.files ? event.target.files[0] : null;
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                const base64String = reader.result as string;

                editor.chain().focus().setImage({ src: base64String}).run();
              };
              reader.readAsDataURL(file);
            }
          }} />

          <button
            title="Back to project" 
            onClick={() => {
            dispatch(setShowEditor(false))
            console.log("🥹🥹Current project in MenuBar:", project);
            dispatch(setDisplayMode("documents"));
            dispatch(setCurrentProject(project))
            }}>
            <img src="/arrow-big-left.svg" alt="Back to project" title='Back to project'/>
          </button>
        
          {/* Save Document */}
          <button
            title='Save Document'
            onClick={() => {
              (async () => {
                try {
                  const contents = JSON.stringify(editor.getJSON());
                  console.log("[Save] Document JSON:", contents);
                  const path = await getPath();
                  if (!path) {
                    console.error("[Save] Project path is null or undefined.");
                    alert("Project path is not set. Please select a project folder.");
                    return;
                  }
                  const docName = toSnakeCase(documentstate.currentDocument?.name || "Untitled");
                  if (!docName) {
                    console.error("[Save] Document name is missing.");
                    alert("Document name is missing.");
                    return;
                  }
                  const projectFolder = toSnakeCase(documentstate.currentProject ? documentstate.currentProject?.name : "");
                  const filePath = `${path}/${projectFolder}/${docName}.ztx`;
                  const content = editor.getJSON();

                  console.log(`[Save] Writing to file: ${filePath}`,documentstate);
                  await writeTextFile(filePath, JSON.stringify(content));
                  console.log("[Save] File written successfully.");
                  alert("File saved successfully.");
                } catch (error) {
                  console.error("[Save] Error saving file:", error);
                  alert(`Error saving file: ${error}`);
                }
              })();
            }}
          >
            <img src="/save.svg" alt='save' />
          </button>

          {/* Document settings */}
          <button title="Document settings"><img src="/file-cog.svg" alt='settings' onClick={()=>{dispatch(setShowSettings(true))}}/></button> 
          <FontDropdown editor={editor} />
          {/* Headings dropdown */}
          <div className="special-dropdown">
            <div className='special-dropdown-placeholder' onClick={handleHeaderDropdownClick}><div>Heading</div><img src="/chevron-down.svg" /></div>
            {headerDropdown  && (
            <div className="special-dropdown-list">
              <div 
                onClick={() => {setHeaderDropdown(false);editor.chain().focus().toggleHeading({ level: 1 }).run()}} 
                className={editorState.isHeading1 ? 'select-option is-active' : 'select-option'}>
                <h1>Heading 1</h1>
              </div>
              <div 
                onClick={() => {setHeaderDropdown(false);editor.chain().focus().toggleHeading({ level: 2 }).run()}} 
                className={editorState.isHeading2 ? 'select-option is-active' : 'select-option'}>
                <h2>Heading 2</h2>
              </div>
              <div 
                onClick={() => {setHeaderDropdown(false);editor.chain().focus().toggleHeading({ level: 3 }).run()}} 
                className={editorState.isHeading3 ? 'select-option is-active' : 'select-option'}>
                <h3>Heading 3</h3>
              </div>
              <div 
                onClick={() => {setHeaderDropdown(false);editor.chain().focus().toggleHeading({ level: 4 }).run()}} 
                className={editorState.isHeading4 ? 'select-option is-active' : 'select-option'}>
                <h4>Heading 4</h4>
              </div>
              <div 
                onClick={() => {setHeaderDropdown(false);editor.chain().focus().toggleHeading({ level: 5 }).run()}} 
                className={editorState.isHeading5 ? 'select-option is-active' : 'select-option'}>
                <h5>Heading 5</h5>
              </div>
              <div 
                onClick={() => {setHeaderDropdown(false);editor.chain().focus().toggleHeading({ level: 6 }).run()}} 
                className={editorState.isHeading6 ? 'select-option is-active' : 'select-option'}>
                <h6>Heading 6</h6>
              </div>
            </div>
            )} 
           </div>

          {/* Image */}
          <button
            title="Insert image"
            onClick={() => inputRef.current?.click()}
            className={editorState.isHeading1 ? 'is-active' : ''}
          >
            <img src="/image.svg" alt="Image" />
          </button>

           {/* Bullet list */}
          <button
            title="Insert bulleted list"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editorState.isBulletList ? 'is-active' : ''}
          >
            <img src="/list.svg" alt="Bullet list" />
          </button>

          {/* Numbered list */}
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editorState.isOrderedList ? 'is-active' : ''}
            title="Insert numbered list"
          >
            <img src="/list-ordered.svg" alt="Numbered list" />
          </button>

          {/* Code block */}
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editorState.isCodeBlock ? 'is-active' : ''}
            title="Insert code block"
          >
            <img src="/code.svg" alt="Code" />
          </button>

          {/* Blockquote */}
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editorState.isBlockquote ? 'is-active' : ''}
            title="Insert block quote"
          >
            <img src="/text-quote.svg" alt="Blockquote" />
          </button>

          {/* Horizontal rule */}
          <button title="Insert horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <span style={{margin: "5px"}}>HR</span>
          </button>

          {/* Undo */}
          <button title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo}>
            <img src="/undo.svg" alt="Undo" />
          </button>

          {/* Redo */}
          <button title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo}>
            <img src="/redo.svg" alt="Redo" />
          </button>

          <button
            onClick={() => {editor.chain().focus().insertPageBreak().run()}}
            title="Insert page break"
          >
            <img src="/page-break.svg" alt="Page Break" />
          </button>

          {/* margins */}
          <button title="Set margins" onClick={() => setDocumentMargins()}>
            <img src="/frame.svg" alt="Margins" />
          </button>

          {/* Table */}
          <button title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <img src="/table-2.svg" alt="Table" />
          </button>

          {/* Annotation */}
          <button
            title="Add annotation"
            onClick={() => (editor.chain().focus().setAnnotation({id: Math.random().toString(36).substring(2,9)})).run()}
            className={editorState.isCodeBlock ? 'is-active' : ''}>
            <img src="/annotate.svg" alt="Annotation" />
          </button>

          {/* Bold */}
          <button
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editorState.canBold}
            className={editorState.isBold ? 'is-active' : ''}
          >
            <img src="/bold.svg" alt="Bold" />
          </button>

          {/* Italic */}
          <button
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editorState.canItalic}
            className={editorState.isItalic ? 'is-active' : ''}
          >
            <img src="/italic.svg" alt="Italic" />
          </button>

          {/* Strikethrough */}
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editorState.canStrike}
            className={editorState.isStrike ? 'is-active' : ''}
            title="Strikethrough"
          >
            <img src="/strikethrough.svg" alt="Strike" />
          </button>

          {/* Underline */}
          <button
            title="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <img src="/underline.svg" alt="Underline" />
          </button>


          <button
            title="Insert paragraph"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editorState.isParagraph ? 'is-active' : ''}
          >
            <img src="/pilcrow.svg" alt="Paragraph" />
          </button>
          </div>
          <div className='button-group'>
            {/* Text alignment */}
          <button title="Align left" onClick={() => (editor.chain().focus() as any).setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}><img src='/text-align-start.svg'></img></button>
          <button title="Align center" onClick={() => (editor.chain().focus() as any).setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}><img src='/text-align-center.svg'></img></button>
          <button title="Aling right" onClick={() => (editor.chain().focus() as any).setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}><img src='/text-align-end.svg'></img></button>
          <button title="Full justification" onClick={() => (editor.chain().focus() as any).setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}><img src='/text-align-justify.svg'></img></button>
          {/* https://github.com/evanfuture/tiptaptop-extension-indent */ }
          <button onClick={() => (editor.chain().focus().indent().run())} title="Increase indent"><img src="/list-indent-increase.svg" alt="Increase indent" /></button>
          <button onClick={() => (editor.chain().focus().outdent().run())} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Decrease indent"><img src="/list-indent-decrease.svg" alt="Decrease indent" /></button>
          <button onClick={() => setParagraphSpacing()} title="Paragraph spacing">
            <img src="/paragraph-spacing.svg" alt="Paragraph spacing" />
           </button>
          {/* Paragraph spacing */}
            {/* <img src="/paragraph-space.svg" alt="Paragraph Spacing" /> */}
          {/* </button> */}
        </div>
      </div>
      {/* { showPageSettings && <PageFormatDlg closeDialog={setShowPageSettings} />} */}
              { showPageSettings && <PageFormatDlg closeDialog={() => setShowPageSettings(false)} editor={editor}/>}
              { showParagraphSpacing && <ParagraphSpacingDlg closeDialog={() => setShowParagraphSpacing(false)} editor={editor} />} 
    </>
  )
}

export default MenuBar;