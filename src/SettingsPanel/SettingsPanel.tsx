import { FC, useEffect, useState, type ReactNode } from "react";
import "./SettingsPanel.css";
import { useDispatch } from "react-redux";
import { setShowSettings } from "../AppMenu/AppMenuSlice";

const SettingsPanel:FC = () => {
    const [selectedElementType, setSelectedElementType] = useState("heading1");
    const [sampleElement, setSampleElement] = useState<ReactNode>(null);
    const dispatch = useDispatch();

    useEffect(() => {
        
    });

    useEffect(() => {
        if (selectedElementType === "heading1") {
            setSampleElement(<h1>Sample Heading 1</h1>);
        }
    },[]);

    return (
        <div className="full-window-container">
            <div className="setting-panel-container">
                <button className="close-button" onClick={() => {dispatch(setShowSettings(false))}}>x</button>
                <div className="settings-panel">
                    <div className="settings-row">
                        <select className="setting-option" style={{fontSize: "1.25rem"}}>
                            <option value="heading1">Heading 1</option>
                            <option value="heading2">Heading 2</option>
                            <option value="heading3">Heading 3</option>
                            <option value="heading4">Heading 4</option>
                            <option value="heading5">Heading 5</option>
                            <option value="heading6">Heading 6</option>
                            <option value="paragraph">Paragraph</option>
                            <option value="list">List</option>
                            <option value="code">Code</option>
                            <option value="blockquote">Blockquote</option>
                            <option value="image">Image</option>
                            <option value="table">Table</option>
                        </select>
                    </div>
                    <div className="settings-row">
                        <label className="settings-label">Font</label>
                        <div>                    
                            <select className="setting-option" style={{padding: "4px 12px"}}>
                                <option value="Merryweather">Merryweather</option>
                                <option value="Tahoe">Tahoe</option>
                                <option value="Ariel">Ariel</option>
                                <option value="Roboto">Roboto</option>
                            </select>
                        </div>
                    </div>
                    <div className="settings-row">
                        <label className="settings-label">Font Size</label>
                        <div><input type="number" min="1" max="100" value="50" /></div>
                        <div>
                            <select className="setting-option">
                                <option value="px">px</option>
                                <option value="pt">pt</option>
                                <option value="mm">mm</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>
                    <div className="settings-row">
                        <label className="settings-label">Line Height</label>
                        <div><input type="number" min="1" max="100" value="50" /></div>
                        <div>
                            <select className="setting-option">
                                <option value="px">px</option>
                                <option value="pt">pt</option>
                                <option value="mm">mm</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>
                    <hr style={{ width: "90%"}}/>
                    <div className="settings-row">
                        <label className="settings-label">Space before Paragraph</label>
                        <div><input type="number" min="1" max="100" value="50" /></div>
                        <div>
                            <select className="setting-option">
                                <option value="px">px</option>
                                <option value="pt">pt</option>
                                <option value="mm">mm</option>
                                <option value="in">in</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="preview-container">
                    <div className="preceding-text">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis rerum amet excepturi nihil maxime explicabo possimus fugit accusantium qui deserunt magnam, dignissimos, ratione, officia hic quasi cum beatae blanditiis eligendi.
                    </div>
                    <div className="selected-element"></div>
                    <div className="following-text">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo laboriosam perspiciatis, temporibus repudiandae, ratione nemo consectetur ea deleniti debitis, voluptate beatae rerum ullam aut facilis quidem architecto veritatis nulla doloremque!
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;