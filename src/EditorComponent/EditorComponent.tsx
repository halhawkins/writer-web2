import { FC, useEffect, useRef, useState } from "react";
import "./EditorComponent.css";
import { EditorContent, useEditor} from "@tiptap/react";
import { FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { FontFamily } from "@tiptap/extension-font-family";
import ResizeImage from "tiptap-extension-resize-image";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { MenuBar, TableMenu } from "./MenuBar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import Ruler from "../Ruler/Ruler";
import { Annotation } from "../Annotations/Annotations";
import { Indent } from "../Typography/indent";
import { LineHeight, TextStyle, FontSize } from "@tiptap/extension-text-style";
import { PaginationPlusWithBreaks } from "../Typography/Paginationpluswithbreaks";
import "./PaginationPlusWithPageBreaks.css";
import { setDocumentDirty } from "../ProjectWindow/ProjectSlice";

interface EditorProps {
  toggleEditor: (show: boolean) => void;
}
// interface AnnotationData {
//   id: string;
//   text: string;
// }
const EditorComponent:FC<EditorProps> = ({toggleEditor}) => {
    const documentState = useSelector((state: RootState) => state.project.currentDocumentContent);
    const documentWidthState = useSelector((state: RootState) => state.project.currentDocumentSize.width);
    const documentHeightState = useSelector((state: RootState) => state.project.currentDocumentSize.height);
    const doc = useSelector((state: RootState) => state.project.currentDocument);
    const selectedFontState = useSelector((state: RootState) => state.project.selectedFont);
    const [leftMargin, setLeftMargin] = useState<string>("1in");
    const [rightMargin, setRightMargin] = useState<string>("1in");
    const [topMargin, setTopMargin] = useState<string>("1in");
    const [bottomMargin, setBottomMargin] = useState<string>("1in");
    // const [isCtrlDown, setIsCtrlDown] = useState(false);
    const isCtrlDown = useRef(false);
    // const [zoomLevel, setZoomLevel] = useState(1.5);
    const editorWrapperRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();
    const editor = useEditor({
    autofocus: "end",
    extensions: [
      StarterKit,
      FontFamily,
      FontSize,
      TextStyle,
      Annotation.configure({
        HTMLAttributes: {
          class: 'annotation-block',
        },
      }),
      LineHeight.configure({
        types: ['textStyle'],
      }),
      Indent.configure({
        types: ['paragraph'],
        minLevel: 0,
        maxLevel: 8,
      }), 
      PaginationPlusWithBreaks.configure({
        pageHeight: documentHeightState || 1122,
        pageWidth: documentWidthState || 816,
        pageGap: 20,
        pageGapBorderSize: 1,
        pageGapBorderColor: "#e5e5e5",
        pageBreakBackground: "#F7F7F8",
        footerRight: "",
        footerLeft: "Page {page}",
        headerLeft: "",
        headerRight: "",
        marginTop: 30,
        marginBottom: 50,
        contentMarginTop: 30,
        contentMarginBottom: 30,
      }),
      // Table,
      TableKit.configure({
        table: { 
          resizable: true,
        },
      }),
      Image.configure({
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: true,
        },
        inline: false,
      }),
      ResizeImage,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image', 'table'],
      }),
    ], 
    onUpdate: ({ editor }) => {
      // const json = editor.getJSON();
      dispatch(setDocumentDirty(true));
      // console.log("Editor content updated:", json);
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          // 1. Prevent the default browser focus-switching
          event.preventDefault();

          // 2. Insert 4 spaces (or a \t character)
          // You can customize this string to be 2 spaces or a real tab
          view.dispatch(view.state.tr.insertText("    "));

          return true; // Confirm we handled the event
        }
        return false;
      },
    },
  });

  // TipTap spell check: https://www.npmjs.com/package/@farscrl/tiptap-extension-spellchecker?ref=pkgstats.com
  // TipTap pagination: https://tiptapplus.com/pagination-plus/
  // annotations: https://github.com/luccalb/tiptap-annotation-magic?tab=readme-ov-file
  // Discussion on setting title bar: https://gemini.google.com/share/ffef6af41d31 
  const switchEditor = (show: boolean) => {
    toggleEditor(show);
  }

  useEffect(() => {
      if (editor) {
          const content = JSON.parse(documentState);
          editor.commands.setContent(content);
          // setDataFetched(true);
          editor.commands.focus();
      }
  }, [documentState]);

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      if (!isCtrlDown.current) return;

      e.preventDefault();

      // setZoomLevel(z => {
      //   const next = Math.max(0.25, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1)));
      //   console.log('Zoom level:', next);
      //   return next;
      // });
    }

    document.body.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.body.removeEventListener('wheel', handleWheel);
  }, []/*[isCtrlDown]*/);

  useEffect(() => {
    doc?.marginTop!== undefined? setTopMargin(doc.marginTop) : setTopMargin("30px");
    doc?.marginBottom!== undefined? setBottomMargin(doc.marginBottom) : setBottomMargin("50px");
    doc?.marginLeft!== undefined? setLeftMargin(doc.marginLeft) : setLeftMargin("70px");
    doc?.marginRight!== undefined? setRightMargin(doc.marginRight) : setRightMargin("70px");
  }, [doc]);

  return (
    <div className="work-area" style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden" 
    }}>
      <MenuBar editor={editor} toggleEditor={switchEditor} />
      
      {/* The main scrollable viewport */}
      <div className="editor-window" style={{
        flex: 1,
        overflow: "auto",
        backgroundColor: "darkgray",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", 
        // background: "green"
      }}>
        
        {/* Scaling Wrapper: Handles the zoom and centering */}
        <div
          ref={editorWrapperRef}
          className="editor-scale-wrapper"
          style={{
            transform: `scale(${1})`,
            transformOrigin: "top center",
            width: documentWidthState+70,
            display: "flex",
            flexDirection: "column",
            marginTop: "20px", 
            boxSizing: "border-box",
            flexShrink: 0, // Prevent the wrapper from collapsing
          }}
          onKeyDown={(e) => {
            // if (e.key === 'Control') setIsCtrlDown(true);
            if (e.key === 'Control') isCtrlDown.current = true;
          }}
          onKeyUp={(e) => {
            // if (e.key === 'Control') setIsCtrlDown(false);
            if (e.key === 'Control') isCtrlDown.current = false;
          }}
          tabIndex={0} // Ensure it can receive focus for key events
        >
          <div 
            className="vertical-divider"
            style={{
              left: `${leftMargin}in`
            }}></div>
          <div 
            className="horizontal-divider"
            style={{
              top: `${topMargin}in`
            }}></div>
          <div 
            className="vertical-divider"
            style={{
              right: `${rightMargin}in`
              }}></div>
          <div
            className="horizontal-divider"
            style={{
              bottom: `${bottomMargin}in`
            }}></div>
          <Ruler />

          <div className="editor-container tiptap" style={{
            // width: documentWidthState, 
            backgroundColor: "white",
            minHeight: documentHeightState, 
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            boxSizing: 'border-box', 

          }}
          ref={editorRef}>
            <EditorContent editor={editor} />
            <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
            <TableMenu editor={editor} ></TableMenu>
          </div>
        </div>
      </div>
    </div>
  ) 
}

export default EditorComponent;
