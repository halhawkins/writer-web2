export interface AppMenuItem {
    id: string;
    label: string;
    icon?: string;
    submenu?: AppMenuItem[];
}