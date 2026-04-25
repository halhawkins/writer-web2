import { FC } from "react";
import "./AppMenu.css";
import { AppMenuItem } from "./types";
import { Sidebar, Menu, MenuItem, Submenu, Logo } from "react-mui-sidebar";
import "./AppMenu.css";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { setSelectedMenu, setShowSettings } from "./AppMenuSlice";

interface MenuEntryProps {
    id: string; 
    label: string;
    icon: string;
    submenu?: MenuEntry[];
    action?: () => void;
}

const MenuEntry: FC<MenuEntryProps> = ({ id, label, icon, submenu, action }) => {
    
    return (
        <div className="app-menu-item" onClick={action}>
            <div className="menu-icon-container"><img src={icon} /></div>
            {submenu && (
                <div className="app-submenu">
                    {submenu.map((menuItem, i) => (
                        <MenuEntry key={i} id={menuItem.id} label={menuItem.label} icon={menuItem.icon || ''} action={menuItem.action} />
                    ))}
                </div>
            )}
            <div className="menu-item-text">{label}</div>
        </div>
    );
}

const AppMenu:FC = () => {
    // const menuState = useSelector((state: RootState) => state.appMenu);
    // const dispatch = useDispatch();
    // const menuItems = useSelector((state: RootState) => state.appMenu.menuItems[0]?.submenu || []);

    // const handleMenuClick = (item: AppMenuItem) => {
    //     switch (item.id) {
    //         case "project-menu":
    //             dispatch(setSelectedMenu("projects"));
    //             break;
    //         case "extension-menu":
    //             dispatch(setSelectedMenu("extensions"));
    //             break;
    //         case "settings-menu":
    //             dispatch(setShowSettings(true))
    //         case "settings-menu":
    //             dispatch(setSelectedMenu(menuState));
    //             break;
    //         case "help-menu":
    //             dispatch(setSelectedMenu("help"));
    //             break;
    //         default:
    //             break;
    //     }
    // };
    const menuState = useSelector((state: RootState) => state.appMenu);
    const dispatch = useDispatch();
    const menuItems = useSelector((state: RootState) => state.appMenu.menuItems[0]?.submenu || []);

    const handleMenuClick = (item: AppMenuItem) => {
        switch (item.id) {
            case "project-menu":
                dispatch(setSelectedMenu("projects"));
                break;
            case "extension-menu":
                dispatch(setSelectedMenu("extensions"));
                break;
            case "settings-menu":
                dispatch(setShowSettings(true));
                // We don't change the selected menu, just show settings.
                break;
            case "help-menu":
                dispatch(setSelectedMenu("help"));
                break;
            default:
                break;
        }
    };

    return (
    <div className="app-menu">
        <div className="app-menu-bar">
            <span className="logo-menu-bar">
                <img src="/logoipsum-414.svg" alt="logo" />
            </span>
            {menuState.menuItems[0]?.submenu?.map((menuI, i) => {
                return (
                    <MenuEntry key={i} id={menuI.id} label={menuI.label} icon={menuI.icon || ''} action={() => handleMenuClick(menuI)} />
                )}
            )}
        </div>
    </div>
    );
}

export default AppMenu;