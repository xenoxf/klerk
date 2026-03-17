export interface CardResponse {
    cards: FlashCardResponse[];
    metadata: Metadata;
}

export interface FlashCardResponse {
    front: string;
    back: string;
    hint: string;
    difficulty: string;
}

export interface Metadata {
    title: string;
    description: string;
    area: string;
    tema: string;
}