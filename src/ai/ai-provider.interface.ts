// Tipos propios del módulo AI — sin imports circulares a groq/gemini.
export type ProviderId = 'groq' | 'gemini' | 'auto';
export type AiMode = 'ahorro' | 'equilibrado' | 'calidad';

export interface Content {
  role: string;
  parts: Array<{ text?: string }>;
}

export interface AiExamOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface AiExamQuestion {
  question: string;
  explanation: string;
  contextId?: string;
  contextContent?: string;
  options: AiExamOption[];
}

export interface AiMetadata {
  title: string;
  description: string;
  area?: string;
  tema?: string;
}

export interface ExamResponse {
  questions: AiExamQuestion[];
  metadata: AiMetadata;
}

export interface NoteItem {
  title: string;
  content: string;
  topic?: string;
}

export interface NoteResponse {
  notes: NoteItem[];
  metadata: AiMetadata;
}

export interface CardItem {
  front: string;
  back: string;
  hint?: string;
}

export interface CardResponse {
  cards: CardItem[];
  metadata: AiMetadata;
}

export interface ChatResponse {
  response: string;
  model: string;
  provider: string;
}

export interface ChatStreamChunk {
  content: string;
  model: string;
  provider: string;
}

export interface FileInput {
  fileBase64: string;
  mimeType: string;
}

export interface AiProvider {
  readonly providerId: string;
  readonly modelName: string;
  supportsVision(): boolean;
  chat(msg: string, history?: Content[]): Promise<ChatResponse>;
  chatStream(msg: string, history?: Content[]): AsyncGenerator<ChatStreamChunk>;
  chatWithFile(msg: string, fileBase64: string, mimeType: string, history?: Content[]): Promise<ChatResponse>;
  chatWithFileStream(msg: string, files: FileInput[], history?: Content[]): AsyncGenerator<ChatStreamChunk>;
  generateExam(topic: string, num: number, diff: string): Promise<ExamResponse>;
  generateIcfesExam(topic: string, num: number, diff: string): Promise<ExamResponse>;
  generateNote(topic: string, num: number, detail: string): Promise<NoteResponse>;
  generateFlashcards(topic: string, num: number): Promise<CardResponse>;
  generateTitle(msg: string): Promise<string>;
}
