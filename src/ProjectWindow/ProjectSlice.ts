import { createSlice } from "@reduxjs/toolkit";
import { Project, WorkDocument } from "./types";

interface ProjectState {
    currentProject: Project | null;
    currentDocument: WorkDocument | null;
    currentDocumentContent: string;
    projectPath: string | null;
    showEditor: boolean;
    displayMode: string;
    currentDocumentSize: { width: number; height: number };
    selectedFont?: string;
};

const initialState: ProjectState = {
    currentProject: null,
    currentDocument: null,
    currentDocumentContent: "",
    projectPath: null,
    showEditor: false,
    displayMode: "projects", // or "documents"
    currentDocumentSize: { width: 794, height: 1123 }, // Initialize to 0 for now, will be calculated on demand
    selectedFont: undefined,
};

export const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        setCurrentProject: (state, action) => {
            state.currentProject = action.payload;
        },
        setCurrentDocument: (state, action) => {
            state.currentDocument = action.payload;
        },
        setCurrentDocumentContent: (state, action) => {
            state.currentDocumentContent = action.payload;
        },
        setProjectPath: (state, action) => {
            state.projectPath = action.payload;
        },
        setShowEditor: (state, action) => {
            state.showEditor = action.payload;
        },
        setDisplayMode: (state, action) => {
            state.displayMode = action.payload;
        },
        addNewDocument: (state, action) => {
            if (state.currentProject) {
                state.currentProject.items.push(action.payload);
            }
        },
        setDocumentWidth: (state, action) => {
            state.currentDocumentSize.width = action.payload;
        },
        setDocumentHeight: (state, action) => {
            state.currentDocumentSize.height = action.payload;
        },
        setFontState: (state, action) => {
            state.selectedFont = action.payload;
        },
        // Add other reducers as needed
    },
})

export const { setCurrentProject, 
    setCurrentDocument, 
    setCurrentDocumentContent, 
    setProjectPath, 
    setShowEditor, 
    setDisplayMode, 
    addNewDocument,
    setDocumentWidth,
    setDocumentHeight,
    setFontState } = projectSlice.actions;
export default projectSlice.reducer;