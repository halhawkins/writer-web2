import { FC, useRef } from "react";
import "../ProjectWindow/ProjectWindow.css";
import { Character } from "../types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { updateSelectedCharacter } from "../AppMenu/AppMenuSlice";

interface CharacterEditorProps {
    character: Character | null;
    onClose: () => void;
}

const CharacterEditor: FC<CharacterEditorProps> = ({ character, onClose }) => {
    const selectedCharacter = useSelector((state: RootState) => state.appMenu.selectedCharacter);
    const characterScratch: Character = {
        id: selectedCharacter?.id || '',
        name: selectedCharacter?.name || '',
        imageUrl: selectedCharacter?.imageUrl || '',
        data: selectedCharacter?.data || {},
        templateId: selectedCharacter?.templateId || '',
        createdAt: selectedCharacter?.createdAt || new Date(),
        updatedAt: selectedCharacter?.updatedAt || new Date(),
    };
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const loadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && selectedCharacter) {
            const imageUrl = URL.createObjectURL(file);
            const updatedCharacter: Character = {
                ...selectedCharacter,
                imageUrl: imageUrl,
            };
            dispatch(updateSelectedCharacter(updatedCharacter));
        }
    }
    
    return (
        <div className="character-editor-container">
            <img src="/arrow-left-to-line.svg" alt="character image" />
            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={loadFile}/>
            <div className="character-editor">
                {selectedCharacter?.imageUrl ? (
                    <img src={selectedCharacter.imageUrl} alt={selectedCharacter.name} onClick={handleImageClick} />
                ) : (
                    <div className="image-placeholder" onClick={handleImageClick}>Select image</div>
                )}
                <input type="text" placeholder="Name" value={selectedCharacter?.name} />
                <h3>Edit Character</h3>
                    {/* Character editing form will go here */}
                    <button onClick={() => onClose()}>Save</button>
            </div>
        </div>
    );
}

export default CharacterEditor;