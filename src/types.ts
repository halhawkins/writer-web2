export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'textarea';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select/multiselect
  order: number;
}

export interface CharacterTemplate {
  id: string;
  name: string; // "D&D 5e Character" or "Urban Fantasy Protagonist"
  fields: CustomField[];
}

export interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  templateId: string;
  data: Record<string, any>; // { name: "Aragorn", race: "Human", alignment: "Lawful Good" }
  createdAt: Date;
  updatedAt: Date;
}
