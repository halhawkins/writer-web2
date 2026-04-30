import { FC, useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../AppContext";
import { DirEntry, readDir, readTextFile, writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./ProjectWindow.css";
import { Project, WorkDocument } from "./types";
import { useDispatch, useSelector } from "react-redux";
import { addNewDocument, setCurrentDocument, setCurrentDocumentContent, setCurrentProject, setDisplayMode, setShowEditor } from "./ProjectSlice";
import { RootState } from "../../store";
import NewProjectItem from "./NewProjectItem";
import { setSelectedCharacter, setShowCharacterEditor } from "../AppMenu/AppMenuSlice";

const appWindow = getCurrentWindow();
export interface ProjectExplorerProps {
    projectPath: string | null;
}
const AlertBox: FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
                onClose();
            }
            // prevent default behavior for clicks inside the box
            if (event.target instanceof HTMLButtonElement) {
                event.preventDefault();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);
    return (
        <div className="dialog-backdrop" onClick={onClose} onKeyDown={(e)=>{e.key==='Escape' ? onClose() : null}} tabIndex={0}>
            <div ref={boxRef} className="dialog-box" onClick={(e) => e.stopPropagation()} onKeyDown={(e)=>{e.key==='Escape' ? onClose() : null}}>
                <p>{message}</p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};
const ProjectExplorer:FC<ProjectExplorerProps> = ({ projectPath }) => {

    const [projectItems, setProjectItems] = useState<Project[]>([]);
    const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
    const [showNewDocumentDialog, setShowNewDocumentDialog] = useState(false);
    const [newDocumentName, setNewDocumentName] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const projectNameInputRef = useRef<HTMLInputElement>(null);
    const documentNameInputRef = useRef<HTMLInputElement>(null);
    const [projectMode, setProjectMode] = useState<boolean>(false); // true for view inside project, false for project list view
    const displayMode = useSelector((state: RootState) => state.project.displayMode);
    const projectState = useSelector((state: RootState) => state.project);
    const selectedProject = useRef<Project | null>(null); 
    const dirtyDocument = useSelector((state: RootState) => state.project.currentDocumentDirty);
    const dispatch = useDispatch();

    const projectWindowStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffffff",
    };

    const appSettings = useContext(AppContext);

    const loadProjectItems = async () => {
        dispatch(setDisplayMode("documents"));
        if (!projectPath) {
            setProjectItems([]);
            return;
        }

        // we don't currently display the raw directory entries, but keep around
        // for potential future use
        const items: DirEntry[] = await readDir(projectPath);

        // read .prj files and parse JSON into Project objects
        const projects: Project[] = [];
        for (const item of items) {
            if (item.name.endsWith(".prj")) {
                try {
                    const text = await readTextFile(`${projectPath}/${item.name}`);
                    const proj: Project = JSON.parse(text, (key, value) => {
                        // convert ISO date strings to Date objects
                        if (key === "date") {
                            return value;
                        }
                        return value;
                    });
                    projects.push(proj);
                } catch (e) {
                    console.error("Failed to read project file", item.name, e);
                }
            }
        }
        setProjectItems(projects);
    }

    const openEditorJsonString = async (editorJSONString: string) => { // set editor with current document
        try {
            if (editorJSONString) {
                if (JSON.parse(editorJSONString).type === "doc") {
                dispatch(setCurrentDocumentContent(editorJSONString));
                } else if (JSON.parse(editorJSONString).type === "character") {
                    dispatch(setCurrentDocument(JSON.parse(editorJSONString)));
                }
            } else {
                return "";
            }
        } catch (e) {
            console.error("Error opening document in editor.", e);
        }
    };

    const loadDocumentContent = async (docPath: string) => {
        try {
            const content = await readTextFile(docPath);
            return content;
        } catch (e) {
            console.error("Failed to read document", docPath, e);
            return "";
        }
    }

    useEffect(() => {
        setProjectItems([]);
        loadProjectItems();
    }, [projectPath]);

    const handleNewProject = () => {
        // Implement logic to create a new project
        setShowNewProjectDialog(true);
        console.log("New project created");
    }

    const toSnakeCase = (str: string) => {
        const parts = str
            .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
        return parts ? parts.map(x => x).join('_') : '';
    };

    useEffect(() => {
        selectedProject.current = projectState.currentProject;
        if (selectedProject.current) {
            setProjectMode(true);
        }
        dispatch(setDisplayMode("documents"));
    }, []);

    useEffect(() => {
        if (displayMode === "documents") {
            dispatch(setDisplayMode('projects'));
        }
    }, [displayMode])

    const saveProject = async (projectToSave: Project | null) => {
        if (!projectToSave) {
            console.error("No project to save");
            return;
        }
        // Implement logic to save the current project
        try {
            const text = JSON.stringify(projectToSave, null, 2);
            await writeTextFile(`${projectPath}/${toSnakeCase(projectToSave.name ?? "")}.prj`, text);
            console.log("Project saved");
        } catch (e) {
            console.error("Failed to save project", e);
        }
    }

    const handleNewDocument = async () => {
        setShowNewDocumentDialog(true);
    }

    const submetNewDocument = async () => {
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
                // await ensureDir(folder);
                const docPath = `${folderPath}/${toSnakeCase(docName)}.zeb`;
                const blankDoc = JSON.stringify({
                    "type": "doc",
                    "content": []
                }, null, 2);
                await writeTextFile(docPath, blankDoc);
                const doc: WorkDocument = {
                    name: docName,
                    documentType: "Rich Text",
                    date: new Date().toISOString(),
                    author: "HH",
                    fileName: `${toSnakeCase(docName)}.zeb`,
                    width: "8.5in",
                    height: "11in",
                }
                dispatch(addNewDocument(doc));
                if (projectState.currentProject) {
                    const updatedProject = {
                        ...projectState.currentProject,
                        items: [...projectState.currentProject.items, doc]
                    };
                    await saveProject(updatedProject);
                }
                // refresh list so newly created document appears
                await loadProjectItems();
            }
        }
        setShowNewDocumentDialog(false);
    }

    const submitNewProject = async () => {
        const newProjectName = projectNameInputRef.current?.value;
        if (!newProjectName) {
            setShowAlert(true);
            return;
        }
        const snake = toSnakeCase(newProjectName);
        const projectFolder = `${projectPath}/${snake}`;

        const newProject: Project = {
            name: newProjectName,
            projectPath: projectFolder,
            items: []
        };

        try {
            // create a directory for the project files
            await mkdir(projectFolder, { recursive: true });
            // serialize project and write a .prj file alongside other projects
            const json = JSON.stringify(newProject, (_key, value) => {
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            });
            await writeTextFile(`${projectPath}/${snake}.prj`, json);
            console.log("New project saved", newProject);
            // refresh list so newly created project appears
            await loadProjectItems();
        } catch (e) {
            console.error("Failed to create new project", e);
            setShowAlert(true);
        } finally {
            setShowNewProjectDialog(false);
        }
    }

    const getIcon = (docType: string) => {
        switch (docType) {
            case "Rich Text":
                return "/file-text.svg";
            case "Text":
                return "/file-text.svg";
            case "character":
                return "/square-user.svg";
            case "Setting":
                return "building-2.svg";
            default:
                return "/file-text.svg";
        }
    }

    const handleDocumentClick = async (doc: WorkDocument) => {
        const updateTitleBar = async (title: string) => {
            try {
                await appWindow.setTitle(dirtyDocument ? `${title}*` : title);
            } catch (e) {
                console.error("Failed to set window title", e);
            }
        }
        const ext = doc.fileName?.substring(doc.fileName.length - 4);
        if (ext === ".ztx" || ext === ".zeb" || ext === ".zch" || ext === ".zst") { // rich text, text, character, setting
            if (selectedProject.current) {
                const folder = projectPath + "/" + toSnakeCase(selectedProject.current.name);
                const docPath = `${folder}/${doc.fileName}`;
                const txt = await loadDocumentContent(docPath);
                await openEditorJsonString(txt);
                if (JSON.parse(txt).type === "character") {
                    const character = JSON.parse(txt);
                    await updateTitleBar(`${character.name}${dirtyDocument ? "*" : ""} - Character Editor`);
                    dispatch(setSelectedCharacter(character))
                    dispatch(setShowCharacterEditor(true));
                } else if (JSON.parse(txt).type === "doc") {
                    await updateTitleBar(`${doc.name}${dirtyDocument ? "*" : ""} - Document Editor`);
                    dispatch(setShowEditor(true));
                    dispatch(setCurrentDocument(doc));
                }
            }
        } else {
            console.log("Unsupported document type");
        }
    }

    const handleProjectClick = (proj: Project) => {
        dispatch(setDisplayMode("documents"));
        selectedProject.current = proj;
        dispatch(setCurrentProject(proj));
        setProjectMode(true);
    }

    return (
        <div className="project-window" style={projectWindowStyle}>
            displayMode={displayMode}<br/>
            project={selectedProject.current && selectedProject.current.name}<br/>
            <h2>Project Window - {projectPath && projectPath}</h2>
            <div className="item-list">
                {(!projectMode && projectItems) ? (
                <div className="project-item" onClick={handleNewProject} >
                    <div className="icon-container">
                        <img className="project-item-icon folder" src="./plus.svg" />
                    </div>
                    <span className="project-item-name">New Project</span>
                </div>) : (
                    <div className="project-item" onClick={handleNewDocument}>
                        <div className="icon-container">
                            <img className="project-item-icon folder" src="./plus.svg" />
                        </div>
                        <span className="project-item-name">New Document</span>
                    </div>
                )}
                {!projectMode && projectItems && projectItems.map((proj, index) => (
                    <div className="project-item" key={index} onClick={() => handleProjectClick(proj)}>
                        <div className="icon-container">
                            <img className="project-item-icon folder" src="./library-big.svg" />
                        </div>
                        <span className="project-item-name">{proj.name}</span>
                    </div>
                ))}
                {projectMode && selectedProject.current && selectedProject.current.items && selectedProject.current.items.map((item, index) => (
                    <div className="project-item" key={index} onClick={() => handleDocumentClick(item)}>
                        <div className="icon-container">
                            {item.documentType === "file"? (
                                <img className="project-item-icon file" src="./folder.svg" />
                            ) : (
                                <img className="project-item-icon folder" src={getIcon(item.documentType)} />
                            )}
                        </div>
                        <span className="project-item-name">{item.name}</span>
                    </div>
                ))}
            </div>
            {showNewProjectDialog && (
                <div className="dialog-backdrop">
                    <div className="dialog-box">
                        <button className="close-button" onClick={()=>setShowNewProjectDialog(false)}>x</button>
                        <h3>New Project</h3>
                        {/* Add form fields for new project details */}
                        <input ref={projectNameInputRef} type="text" placeholder="Project Name" />
                        <button onClick={submitNewProject}>Create</button>
                    </div>
                </div>
            )}
            {showNewDocumentDialog && (
                <NewProjectItem setShowNewDocumentDialog={setShowNewDocumentDialog} projectPath={projectPath} refreshProjects={loadProjectItems}/>
            )}
            {showAlert && (
                <AlertBox message="Please enter a project name" onClose={() => setShowAlert(false)} />
            )}
        </div>
    );
}

export default ProjectExplorer;