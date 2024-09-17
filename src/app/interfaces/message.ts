export interface Reaction {
    count: number;
    users: string[];
}


export interface Message {
    id: string;
    avatar: string;
    name: string;
    time: string;
    message: string;
    createdAt: any;
    reactions?: { [key: string]: Reaction }; // Map<string, Reaction>
    padNumber: number | string;
    btnReactions: string[],
    imageUrl: string;
}


export const EMPTY_MESSAGE: Message = {
    id: '',
    avatar: '',
    name: '',
    time: '',
    message: '',
    createdAt: null, // Da der Typ `any` ist, setzen wir es auf `null` oder einen passenden Standardwert
    reactions: {}, // Optionales Feld, kann leer sein
    padNumber: '', // Standardmäßig auf leere Zeichenfolge oder Zahl setzen
    btnReactions: [], // Leeres Array, wenn keine Reaktionen vorhanden sind
    imageUrl: '' // Leerer String, wenn kein Bild vorhanden ist
};


