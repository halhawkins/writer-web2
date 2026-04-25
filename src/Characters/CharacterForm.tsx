import { FC, useState } from "react";
import { Character, CharacterTemplate, CustomField } from "../types";

export interface CharacterFormProps {
  template: CharacterTemplate;
  initialData?: Partial<Character['data']>;
  onSave: (character: Character) => void;
}

const CharacterForm:FC<CharacterFormProps> = ({ template, initialData, onSave }) => {
    // Implement character form UI and form validation here
    // Use the `initialData` to populate the form fields and `onSave` to handle form submission
    const [formData, setFormData] = useState<Record<string, any>>({});

    const sortedFields = [...template.fields].sort((a, b) => a.order - b.order);

    const renderField = (field: CustomField) => {
        // Render the appropriate form field based on the field type and value
        // Example:
        // if (field.type === "text") {
        //     return <input type="text" value={formData[field.name]} onChange={handleInputChange(field.name)} />;
        // } else if (field.type === "number") {
        //     return <input type="number" value={formData[field.name]} onChange={handleInputChange(field.name)} />;
        // }
        //...

        switch (field.type) {
            case "text":
                return (
                    <input 
                        type="text"
                        placeholder={field.label}  
                        value={formData[field.id || '']} 
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} 
                    />
                );
            case "select":
                return (
                    <select
                        value={formData[field.id || '']}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    >
                        <option value=""> -- Select {field.label} -- </option>
                        {field.options?.map((opt) =>(
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )
            case "number":
                return (
                    <input
                        type="number"
                        placeholder={field.label}
                        value={formData[field.id || '']}
                        onChange={(e) => setFormData({...formData, [field.id]: e.target.value })}
                        />
                );
            // Add more field types as needed
            default:
                return null;
        }
    }

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            onSave({
                id: crypto.randomUUID(),
                templateId: template.id,
                data: formData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            }}>
            {sortedFields.map((field) => (
                <div key={field.id} className="form-group">
                    <label>{field.label}</label>
                    {renderField(field)}
                </div>
            ))}
            <button type="submit">Create Character</button>
        </form>
    )
}

export default CharacterForm;