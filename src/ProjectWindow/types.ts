export interface WorkDocument {
    name: string;
    documentType: string;
    date: string;
    author?: string;
    description?: string;
    fileName?: string;
    width: string;
    height: string;
    marginLeft?: string;
    marginTop?: string;
    marginBottom?: string;
    marginRight?: string;
};

export interface Project {
    name: string;
    items: WorkDocument[];
    description?: string;
    projectPath: string;
};
