import { createSlice } from "@reduxjs/toolkit";
import { AppMenuItem } from "./types";
import { Character } from "../types";

interface AppMenuState {
    isOpen: boolean;
    menuItems: Array<AppMenuItem>;
    selectedMenuId: string | null;
    showSettings: boolean;
    showCharacterEditor: boolean;
    selectedCharacter: Character | null;
};

const initialState: AppMenuState = {
    isOpen: false,
    menuItems: [
        {
            id: "_root",
            label: "",
            submenu: [
            ],
        }
    ],
    selectedMenuId: "projects",
    showSettings: false,
    showCharacterEditor: false,
    selectedCharacter: null,
};

export const appMenuSlice = createSlice({
    name: "appMenu",
    initialState,
    reducers: {
        toggleMenu: (state) => {
            state.isOpen =!state.isOpen;
        },
        setMenuItems: (state, action) => {
            state.menuItems = action.payload;
        },
        setSelectedMenu: (state, action) => {
            state.selectedMenuId = action.payload;
        },
        insertMenuItem: (state, action) => {
            const { parentId, menuItem } = action.payload;
            if (parentId) {
                const parentItem = state.menuItems.find(item => item.id === parentId);
                if (parentItem) {
                    parentItem.submenu?.push(menuItem);
                }
                else {
                    console.error("Parent menu item not found", parentId);
                }
                state.menuItems = [...state.menuItems];
                return;
            } else {
                state.menuItems.push(menuItem);
                // state.selectedMenu = menuItem.id;
                return;
            }
        },
        setShowSettings: (state, action) => {
            state.showSettings = action.payload;
        },
        setShowCharacterEditor: (state, action) => {
            state.showCharacterEditor = action.payload;
            state.showSettings = false;
        },
        setSelectedCharacter: (state, action) => {
            state.selectedCharacter = action.payload;
        },
        updateSelectedCharacter: (state, action) => {
            if (state.selectedCharacter && state.selectedCharacter.id === action.payload.id) {
                state.selectedCharacter = action.payload;
            }
        },
    },
});

export const { toggleMenu, setMenuItems, setSelectedMenu, insertMenuItem, setShowSettings, setShowCharacterEditor, setSelectedCharacter, updateSelectedCharacter } = appMenuSlice.actions;

export default appMenuSlice.reducer;