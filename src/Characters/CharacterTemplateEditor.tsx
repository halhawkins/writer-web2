import { FC, useState } from "react";
import { CustomField, CharacterTemplate } from "../types";
import { v4 as uuidv4 } from 'uuid';

interface CharacterTemplateEditorProps {
    onSaveTemplate: (template: CharacterTemplate) => void;
    onCancel: () => void;
}

const CharacterTemplateEditor: FC<CharacterTemplateEditorProps> = ({ onSaveTemplate, onCancel }) => {
    const [templateName, setTemplateName] = useState("");
    const [fields, setFields] = useState<CustomField[]>([
        { id: uuidv4(), name: 'name', label: 'Name', type: 'text', required: true, order: 0 },
        { id: uuidv4(), name: 'age', label: 'Age', type: 'number', required: false, order: 1 },
        { id: uuidv4(), name: 'description', label: 'Description', type: 'textarea', required: false, order: 2 },
        // Note: 'image' type is not in CustomField, using 'text' for URL
        { id: uuidv4(), name: 'image', label: 'Image URL', type: 'text', required: false, order: 3 },
    ]);

    const addField = () => {
        const newField: CustomField = {
            id: uuidv4(),
            name: '',
            label: '',
            type: 'text',
            required: false,
            order: fields.length,
        };
        setFields([...fields, newField]);
    };

    const handleFieldChange = (id: string, updatedField: Partial<CustomField>) => {
        setFields(fields.map(field => field.id === id ? { ...field, ...updatedField } : field));
    };

    const removeField = (id: string) => {
        setFields(fields.filter(field => field.id !== id));
    };

    const handleSave = () => {
        if (!templateName.trim()) {
            alert("Please provide a name for the template.");
            return;
        }
        const newTemplate: CharacterTemplate = {
            id: uuidv4(),
            name: templateName,
            fields: fields,
        };
        onSaveTemplate(newTemplate);
    };

    return (
        <div className="character-template-editor">``
            <h3>Create Character Template</h3>
            <div className="form-group">
                <label>Template Name</label>
                <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., D&D 5e Character Sheet"
                />
            </div>

            <h4>Fields</h4>
            {fields.map((field, index) => (
                <div key={field.id} className="field-editor-item">
                    <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleFieldChange(field.id, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        placeholder="Field Label (e.g., 'Character Name')"
                    />
                    <select value={field.type} onChange={(e) => handleFieldChange(field.id, { type: e.target.value as CustomField['type'] })}>
                        <option value="text">Text</option>
                        <option value="textarea">Text Area</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Checkbox</option>
                        <option value="select">Select</option>
                        <option value="multiselect">Multi-select</option>
                    </select>
                    <button onClick={() => removeField(field.id)}>Remove</button>
                </div>
            ))}

            <button onClick={addField}>Add Field</button>

            <div className="dialog-actions">
                <button onClick={handleSave}>Save Template</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default CharacterTemplateEditor;