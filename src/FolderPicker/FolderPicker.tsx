import { homeDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { FC, useState } from "react";
import "./FolderPicker.css";
import { mkdir } from "@tauri-apps/plugin-fs";

const FolderPicker: FC = () => {
    const [selectedPath, setSelectedPath] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [status, setStatus] = useState<string>("");

    const handleBrowse = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                defaultPath: await homeDir(),
            });

            if (selected) {
                setSelectedPath(selected);
                setStatus(`Selected: ${selected}`);
            }
        } catch (err) {
            setStatus(`Error picking folder: ${err}`);
        }
    };

    const handleCreateFolder = async () => {
      try {
        await mkdir(`${selectedPath}/${newFolderName}`, {recursive: true });
      }
      catch (error) {
        console.error("Error creating directory:", error);
      }
    }


    return (
        <div className="dlg-screen-container">
        <div className="dlg-box" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Directory Manager</h3>
        
        <div style={{ marginBottom: '10px' }}>
            <button onClick={handleBrowse}>Browse Location</button>
            <p><strong>Target:</strong> {selectedPath || 'None selected'}</p>
        </div>

        <div style={{ marginBottom: '10px' }}>
            <input 
            type="text" 
            placeholder="New folder name" 
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button onClick={handleCreateFolder} disabled={!selectedPath}>
            Create Folder
            </button>
        </div>

        {status && <p style={{ fontSize: '0.9em', color: '#555' }}>{status}</p>}
        </div>
        </div>
    );
}

export default FolderPicker;