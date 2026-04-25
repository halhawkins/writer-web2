import { useEffect, useRef, useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";
import { homeDir } from "@tauri-apps/api/path";
import ProjectExplorer from "./ProjectWindow/ProjectExplorer";
import { setDisplayMode, setProjectPath, setShowEditor } from "./ProjectWindow/ProjectSlice";
import { RootState } from "../store";
import { useDispatch, useSelector } from "react-redux";
import EditorComponent from "./EditorComponent/EditorComponent";
import AppMenu from "./AppMenu/AppMenu";
import { insertMenuItem, setSelectedMenu, setShowCharacterEditor, setShowSettings as setShowSettingsState } from "./AppMenu/AppMenuSlice";
import SettingsPanel from "./SettingsPanel/SettingsPanel";
import CharacterEditor from "./Characters/CharacterEditor";

const initializeStore = async () => {
  const store = await load("writers-app-store.json");
  const projectPath = store.get("projectPath");
  return projectPath;
}
function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [projectPath, setProjectPathState] = useState<string>("");
  const [showProjects, setShowProjects] = useState(true);
  const showCharacterEditor = useSelector((state: RootState) => state.appMenu.showCharacterEditor);
  const pathSelected = useRef(false);
  const settingsState = useSelector((state: RootState) => state.appMenu.showSettings);
  const projectPathState = useSelector((state: RootState) => state.project.projectPath);
  const documentContent = useSelector((state: RootState) => state.project.currentDocumentContent);
  const showEditor = useSelector((state: RootState) => state.project.showEditor);
  const menuState = useSelector((state: RootState) => state.appMenu);
  const dispatch = useDispatch();

  const menuItems = [
    {
        id: "project-menu",
        label: "Projects",
        icon: "/boxes.svg",
    },
    {
        id: "extension-menu",
        label: "Extensions",
        icon: "/blocks.svg",
    },
    {
        id: "settings-menu",
        label: "Settings",
        icon: "/settings.svg",
    },
    {
        id: "help-menu",
        label: "Help",
        icon: "/help.svg",
    }
  ]

  const loadProjectPath = async () => {
      const appSettings = await load("writers-app-store.json");
      const path = await appSettings.get<string | null>("projectPath");
      setProjectPath(path);
      setProjectPathState(path || "");
      if (path) {
        setProjectPath(path);
        return path;
      } else {
        const result = await open({
          title: "Open Project",
          directory: true,
          multiple: false,
          defaultPath: await homeDir(),
        });
        if (typeof result === "string") {
          setProjectPath(result);
          
          await appSettings.set("projectPath", result);
        }
      }
  }

  useEffect(() => {
    if (pathSelected.current) return;
    pathSelected.current = true;
    loadProjectPath();
    menuItems.forEach((item) => {
      dispatch(insertMenuItem({parentId:"_root", menuItem: item}));
    });
    dispatch(setSelectedMenu("projects"));
  }, []);

  useEffect(() => {
    dispatch(setDisplayMode("projects"));
  })

  useEffect(() => {
    switch (menuState.selectedMenuId) {
      case "projects":
        dispatch(setDisplayMode("projects"));
        break;
      case "extensions":
        dispatch(setDisplayMode("extensions"));
        break;
      case "settings":
        dispatch(setDisplayMode("settings"));
        setShowSettings(true);
        break;
      case "help":
      default:
        break;
    }
  }, [menuState])

  useEffect(() => {
    if (showSettings) {
      setShowSettingsState(true);
    } else {
      setShowSettingsState(false);
    }
  }, [settingsState])

  const showContent = () => {
    // return documentContent if needed for debugging;
    return;
  }
  return (<>
    <main className="container" onClick={showContent} data-menu={menuState.selectedMenuId}>
      <AppMenu />
      {(menuState.selectedMenuId === 'projects') && !showEditor && !showCharacterEditor && <ProjectExplorer projectPath={projectPath}/>}
      {(menuState.selectedMenuId === 'projects') && showEditor && !showCharacterEditor &&<div className="editor"><EditorComponent toggleEditor={setShowEditor}/></div>}
      {settingsState && <SettingsPanel />}
      {showCharacterEditor && <CharacterEditor character={null} onClose={() => dispatch(setShowCharacterEditor(true))} />}
    </main>
    </>
  );
}

export default App;
