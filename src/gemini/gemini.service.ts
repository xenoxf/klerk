import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  SchemaType,
  Content,
  GenerationConfig,
  ResponseSchema,
  Part,
} from '@google/generative-ai';
import { AI_PROMPTS } from './AI_PROMPTS';

const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
] as const;

type ModelName = (typeof MODELS)[number];

export interface AiMetadata {
  title: string;
  description: string;
  area?: string;
  tema?: string;
}

export interface ExamResponse {
  questions: Array<{
    question: string;
    explanation: string;
    contextId?: string;
    contextContent?: string;
    options: Array<{
      text: string;
      isCorrect: boolean;
      feedback: string;
    }>;
  }>;
  metadata: AiMetadata;
}

export interface NoteResponse {
  notes: Array<{
    title: string;
    content: string;
    topic?: string;
  }>;
  metadata: AiMetadata;
}

export interface CardResponse {
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
  }>;
  metadata: AiMetadata;
}

/**
 * El extractor ahora es mínimo. Solo encuentra los límites del objeto.
 * NO limpia ni modifica el contenido interno (Markdown manda).
 */
class JsonExtractor {

  static extract(raw: string): string {
    if (!raw) return '';
    let text = raw.trim();
    text = text.replace(/```json\s*/gi, '').replace(/```/g, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }
    return text;
  }
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKeys: string[];
  private currentKeyIndex = 0;

  constructor() {
    this.apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
    ].filter((key): key is string => !!key && key !== 'undefined');

    if (this.apiKeys.length === 0) throw new Error('No API Keys');
    this.genAI = new GoogleGenerativeAI(this.apiKeys[0]);
  }

  private rotateKey(): void {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      this.genAI = new GoogleGenerativeAI(this.apiKeys[this.currentKeyIndex]);
    }
  }

  private getModel(
    name: ModelName = MODELS[0],
    schema?: ResponseSchema,
  ): GenerativeModel {
    const config: {
      model: ModelName;
      generationConfig?: GenerationConfig;
    } = { model: name };

    if (schema) {
      config.generationConfig = {
        responseMimeType: 'application/json',
        responseSchema: schema,
      };
      return this.genAI.getGenerativeModel({
        generationConfig: config.generationConfig,
        model: config.model,
      });

    }

    return this.genAI.getGenerativeModel({
      model: config.model,
    })
  }

  private async generateWithSchema(
    prompt: string,
    schema: ResponseSchema,
  ): Promise<string> {
    for (const modelName of MODELS) {
      let keysTried = 0;
      while (keysTried < this.apiKeys.length) {
        try {
          const model = this.getModel(modelName, schema);
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) return text.trim();
          throw new Error('Empty');
        } catch (error: unknown) {
          const err = error as { status?: number; code?: number | string };
          const code = err.status || err.code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          this.logger.warn(
            `Model ${modelName} error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          break;
        }
      }
    }
    throw new Error('All models failed');
  }

  // ==================== SCHEMAS ====================

  private EXAM_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      questions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            question: { type: SchemaType.STRING },
            explanation: { type: SchemaType.STRING },
            contextId: { type: SchemaType.STRING },
            contextContent: { type: SchemaType.STRING },
            options: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  text: { type: SchemaType.STRING },
                  isCorrect: { type: SchemaType.BOOLEAN },
                  feedback: { type: SchemaType.STRING },
                },
                required: ['text', 'isCorrect'],
              },
            },
          },
          required: ['question', 'explanation', 'options'],
        },
      },
      metadata: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          area: { type: SchemaType.STRING },
          tema: { type: SchemaType.STRING },
        },
        required: ['title'],
      },
    },
    required: ['questions', 'metadata'],
  };

  private NOTE_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      notes: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            content: { type: SchemaType.STRING },
            topic: { type: SchemaType.STRING },
          },
          required: ['title', 'content'],
        },
      },
      metadata: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          area: { type: SchemaType.STRING },
          tema: { type: SchemaType.STRING },
        },
        required: ['title'],
      },
    },
    required: ['notes', 'metadata'],
  };

  private CARD_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      cards: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            front: { type: SchemaType.STRING },
            back: { type: SchemaType.STRING },
            hint: { type: SchemaType.STRING },
          },
          required: ['front', 'back'],
        },
      },
      metadata: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          area: { type: SchemaType.STRING },
          tema: { type: SchemaType.STRING },
        },
        required: ['title'],
      },
    },
    required: ['cards', 'metadata'],
  };

  // ==================== FEATURES ====================

  async generateExam(
    topic: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateExam(num, diff)}\n\nTema: ${topic}`,
      this.EXAM_SCHEMA,
    );
    this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateIcfesExam(
    topic: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateIcfesExam(num, diff)}\n\nTema: ${topic}`,
      this.EXAM_SCHEMA,
    );
    this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateNote(
    topic: string,
    num: number,
    detail: string,
  ): Promise<NoteResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateNote(num, detail)}\n\nTema: ${topic}`,
      this.NOTE_SCHEMA,
    );
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateFlashcards(topic: string, num: number): Promise<CardResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateFlashcards(num)}\n\nTema: ${topic}`,
      this.CARD_SCHEMA,
    ); this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateEducationalChatResponse(
    msg: string,
    ctx?: string,
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text).join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: history?.length || 0,
    });
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${msg}`;

    const result = await this.getModel(MODELS[0]).generateContent(prompt);
    return { response: result.response.text().trim() };
  }

  async * generateEducationalChatResponseStream(
    msg: string,
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text).join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: history?.length || 0,
    });
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${msg}`;

    const result = await this.getModel(MODELS[0]).generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async generateChatTitleFromMessage(msg: string): Promise<string> {
    const result = await this.getModel(MODELS[0]).generateContent(
      AI_PROMPTS.CHAT_TITLE_SYSTEM_PROMPT + '\n\n' + msg.substring(0, 100),
    );
    return result.response
      .text()
      .trim()
      .replace(/^["']|["']$/g, '');
  }

  // ==================== MULTIMODAL METHODS ====================

  private buildFilePart(fileBase64: string, mimeType: string): Part {
    return {
      inlineData: {
        data: fileBase64,
        mimeType,
      },
    };
  }

  async generateExamFromFile(
    fileBase64: string,
    mimeType: string,
    reference: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const textPrompt = `${AI_PROMPTS.generateExam(num, diff)}\n\nEl usuario ha subido un archivo como referencia. También dice: "${reference || 'genera preguntas sobre este archivo'}". Analiza el archivo y genera preguntas basadas en su contenido.`;
    const filePart = this.buildFilePart(fileBase64, mimeType);

    const result = await this.getModel(MODELS[0], this.EXAM_SCHEMA).generateContent([textPrompt, filePart]);
    const text = result.response.text();
    if (!text) throw new Error('Empty response from Gemini');
    return JSON.parse(JsonExtractor.extract(text));
  }

  async generateIcfesExamFromFile(
    fileBase64: string,
    mimeType: string,
    reference: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const textPrompt = `${AI_PROMPTS.generateIcfesExam(num, diff)}\n\nEl usuario ha subido un archivo como referencia. También dice: "${reference || 'genera preguntas sobre este archivo'}". Analiza el archivo y genera preguntas basadas en su contenido.`;
    const filePart = this.buildFilePart(fileBase64, mimeType);

    const result = await this.getModel(MODELS[0], this.EXAM_SCHEMA).generateContent([textPrompt, filePart]);
    const text = result.response.text();
    if (!text) throw new Error('Empty response from Gemini');
    return JSON.parse(JsonExtractor.extract(text));
  }

  async generateFlashcardsFromFile(
    fileBase64: string,
    mimeType: string,
    reference: string,
    num: number,
  ): Promise<CardResponse> {
    const textPrompt = `${AI_PROMPTS.generateFlashcards(num)}\n\nEl usuario ha subido un archivo como referencia. También dice: "${reference || 'genera flashcards sobre este archivo'}". Analiza el archivo y genera flashcards basadas en su contenido.`;
    const filePart = this.buildFilePart(fileBase64, mimeType);

    const result = await this.getModel(MODELS[0], this.CARD_SCHEMA).generateContent([textPrompt, filePart]);
    const text = result.response.text();
    if (!text) throw new Error('Empty response from Gemini');
    return JSON.parse(JsonExtractor.extract(text));
  }

  async generateEducationalChatResponseWithFile(
    msg: string,
    fileBase64: string,
    mimeType: string,
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text).join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: history?.length || 0,
    });

    const userMsg = `El usuario ha subido un archivo y dice: "${msg || 'Analiza este archivo'}". Analiza el archivo y responde basándote en su contenido.`;
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${userMsg}`;
    const filePart = this.buildFilePart(fileBase64, mimeType);

    const result = await this.getModel(MODELS[0]).generateContent([prompt, filePart]);
    return { response: result.response.text().trim() };
  }

  async * generateEducationalChatResponseStreamWithFile(
    msg: string,
    fileBase64: string,
    mimeType: string,
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text).join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: history?.length || 0,
    });

    const userMsg = `El usuario ha subido un archivo y dice: "${msg || 'Analiza este archivo'}". Analiza el archivo y responde basándote en su contenido.`;
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${userMsg}`;
    const filePart = this.buildFilePart(fileBase64, mimeType);

    const result = await this.getModel(MODELS[0]).generateContentStream([prompt, filePart]);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
}
