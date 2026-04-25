import { FC } from "react";
import { Project } from "./types";
interface ProjectWindowProps {
    project: Project
};

const ProjectWindow:FC<ProjectWindowProps> = ({ project }) => {
    
    const projectWindowStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#b1ffff",
    };

    return (
        <div className="project-window" style={projectWindowStyle}>
            <h2>Project Window - {project.name}</h2>
            <div className="item-list">
                {project.items.map((item, index) => {
                    return (
                    <div className="project-item" key={index}>
                        <div className="icon-container">
                            {item.documentType === "file"? (
                                <img className="project-item-icon file" src="./file.svg" />
                            ) : (
                                <img className="project-item-icon folder" src="./folder.svg" />
                            )}
                        </div>
                        <span className="project-item-name">{item.name}</span>
                    </div>)
                })}
            </div>
        </div>
    );
};

export default ProjectWindow;