import { FC, useRef, useEffect } from "react";
import "./ProjectWindow.css";
import { DirEntry, readDir, readTextFile, writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { Project, WorkDocument } from "./types";
import { addNewDocument, setDisplayMode } from "./ProjectSlice";
import { setSelectedCharacter, setShowCharacterEditor } from "../AppMenu/AppMenuSlice";

export interface NewProjectItemProps {
    setShowNewDocumentDialog: (show: boolean) => void;
    projectPath: string | null;
    refreshProjects: () => void;
}

const NewProjectItem:FC<NewProjectItemProps> = ({setShowNewDocumentDialog, projectPath, refreshProjects}) => {
    const documentNameInputRef = useRef<HTMLInputElement>(null);
    const projectState = useSelector((state: RootState) => state.project);
    const dispatch = useDispatch();

    const toSnakeCase = (str: string) => {
        const parts = str
            .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
        return parts ? parts.map(x => x).join('_') : '';
    };

    const saveProject = async (projectToSave: Project | null) => {
        if (!projectToSave) {
            console.error("No project to save");
            return;
        }
        console.log('projectPath = ', projectPath, projectToSave);
        // Implement logic to save the current project
        try {
            const text = JSON.stringify(projectToSave, null, 2);
            await writeTextFile(`${projectPath}/${toSnakeCase(projectToSave.name ?? "")}.prj`, text);
            console.log("Project saved");
        } catch (e) {
            console.error("Failed to save project", e);
        }
    }
    
    const submitNewDocument = async (docType:string) => {
        let blankDoc;
        var doc;
        console.log('projectPath = ', projectPath, projectState);
        if (documentNameInputRef.current === null) {
            console.error("Invalid document name input");
            return;
        } else {
            const docName = documentNameInputRef.current.value.trim();
            if (docName.length === 0) {
                console.log("Invalid document name");
                return;
            } else {
                const folderPath = `${projectPath}/${toSnakeCase(projectState.currentProject?.name ?? "")}`;
                let docPath = `${folderPath}/${toSnakeCase(docName)}`;
                // await ensureDir(folder);
                switch (docType) {
                     case "text":
                        docPath = `${folderPath}/${toSnakeCase(docName)}.ztx`;
                            blankDoc = JSON.stringify({
                                "type": "doc",
                                "content": []
                            }, null, 2);
                        doc = {
                            name: docName,
                            documentType: "Rich Text",
                            date: new Date().toISOString(),
                            author: "HH",
                            fileName: `${toSnakeCase(docName)}.ztx`,
                            width: "8.5in",
                            height: "11in",
                        }
                        break;
                    case "character":
                        docPath = `${folderPath}/${toSnakeCase(docName)}.zch`;
                            blankDoc = JSON.stringify({
                                "type": "character",  
                                "name": docName, 
                                "content": []
                            }, null, 2);
                        doc = {
                            name: docName,
                            documentType: "character",
                            date: new Date().toISOString(),
                            author: "HH",
                            fileName: `${toSnakeCase(docName)}.zch`,
                            width: "8.5in",
                            height: "11in",
                        }
                        dispatch(setSelectedCharacter(blankDoc));
                        dispatch(setShowCharacterEditor(true));
                        break;
                    case "setting":
                        docPath = `${folderPath}/${toSnakeCase(docName)}.zst`;
                            blankDoc = JSON.stringify({
                                "type": "setting",  
                                "content": []
                            }, null, 2);
                        doc = {
                            name: docName,
                            documentType: "setting",
                            date: new Date().toISOString(),
                            author: "HH",
                            fileName: `${toSnakeCase(docName)}.zst`,
                            width: "8.5in",
                            height: "11in",
                        }
                        break;
                    default:
                        console.error("Invalid document type");
                        return;
                }
                await writeTextFile(docPath, blankDoc);
                dispatch(addNewDocument(doc));
                console.log("New document created", projectState,doc);
                if (projectState.currentProject) {
                    const updatedProject = {
                        ...projectState.currentProject,
                        items: [...projectState.currentProject.items, doc]
                    };
                    await saveProject(updatedProject);
                }
                // refresh list so newly created document appears
                await refreshProjects();
            }
        }
        setShowNewDocumentDialog(false);
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowNewDocumentDialog(false);3
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setShowNewDocumentDialog]);


    return (
        <div className="dialog-backdrop">
            <div className="dialog-box">
                <div><button className="close-button" onClick={()=>setShowNewDocumentDialog(false)}>x</button></div>
                <h3>New Document</h3>
                {/* Add form fields for new document details */}
                <div className="doctypes-buttons">
                    <button className="type-button" title="New Text Document"><img src="file-plus-corner.svg" onClick={() => submitNewDocument("text")} /></button>
                    <button className="type-button" title="New Character Profile"><img src="user-plus.svg" onClick={() => submitNewDocument("character")} /></button>
                    <button className="type-button" title="New Setting"><img src="building-2.svg" onClick={() => submitNewDocument("setting")} /></button>
                </div>
                <input ref={documentNameInputRef} type="text" placeholder="Document Name" />
                <button onClick={()=>setShowNewDocumentDialog(false)}>Cancel</button>
            </div>
        </div>
    );
}

export default NewProjectItem;