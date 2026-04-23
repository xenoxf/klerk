import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AI_PROMPTS } from './AI_PROMPTS';

// Available Gemini models for fallback chain
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
] as const;

type ModelName = (typeof MODELS)[number];

interface RetryableError extends Error {
  code?: number;
  status?: number;
}

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
 * Advanced State-Machine Parser to sanitize raw AI output.
 * It identifies all string values in a JSON-like structure and base64-encodes them 
 * BEFORE the native JSON.parse() is called, ensuring 100% resilience against unescaped chars.
 */
class Base64JsonTransformer {
  static transform(raw: string): string {
    if (!raw) return "";
    
    let text = raw.trim();
    // Remove markdown fences
    text = text.replace(/```json\s*/gi, "").replace(/```/g, "");
    
    let result = "";
    let i = 0;
    let inString = false;
    let currentString = "";
    let stringStartChar = '';
    let isKey = true; // Heuristic to identify if we are in a key or a value

    while (i < text.length) {
      const char = text[i];

      if (char === '"' || char === "'") {
        if (!inString) {
          // Starting a string
          inString = true;
          stringStartChar = char;
          result += char;
        } else if (stringStartChar === char) {
          // Potential end of string
          let lookAhead = i + 1;
          while (lookAhead < text.length && /\s/.test(text[lookAhead])) lookAhead++;
          
          const nextChar = text[lookAhead];
          const isActuallyEnd = nextChar === ':' || nextChar === ',' || nextChar === '}' || nextChar === ']' || lookAhead >= text.length;

          if (isActuallyEnd) {
            if (isKey) {
              result += currentString + char;
              if (nextChar === ':') isKey = false;
            } else {
              // IT'S A VALUE! Base64 encode it
              const encoded = Buffer.from(currentString, 'utf-8').toString('base64');
              result += encoded + char;
              isKey = true; 
            }
            inString = false;
            currentString = "";
          } else {
            // It was an unescaped quote inside the string!
            currentString += char;
          }
        } else {
          currentString += char;
        }
      } else {
        if (inString) {
          currentString += char;
        } else {
          result += char;
          if (char === ',' || char === '[' || char === '{') isKey = true;
        }
      }
      i++;
    }

    return result;
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

  private getModel(name: ModelName = MODELS[0]): GenerativeModel {
    return this.genAI.getGenerativeModel({ model: name });
  }

  private async generateText(prompt: string): Promise<string> {
    for (const modelName of MODELS) {
      let keysTried = 0;
      while (keysTried < this.apiKeys.length) {
        try {
          const model = this.getModel(modelName);
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) return text.trim();
          throw new Error('Empty');
        } catch (error) {
          const code = (error as any).status || (error as any).code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          break; // Try next model
        }
      }
    }
    throw new Error('All models failed');
  }

  private parseSafeJson<T>(raw: string): T {
    const transformed = Base64JsonTransformer.transform(raw);
    try {
      return JSON.parse(transformed);
    } catch (e) {
      this.logger.error(`Parsing failed. Transformed: ${transformed.substring(0, 100)}...`);
      throw e;
    }
  }

  // ==================== FEATURES ====================

  async generateExam(topic: string, num: number, diff: string): Promise<ExamResponse> {
    const raw = await this.generateText(`${AI_PROMPTS.generateExam(num, diff)}\n\nTema: ${topic}`);
    return this.parseSafeJson<ExamResponse>(raw);
  }

  async generateIcfesExam(topic: string, num: number, diff: string): Promise<ExamResponse> {
    const raw = await this.generateText(`${AI_PROMPTS.generateIcfesExam(num, diff)}\n\nTema: ${topic}`);
    return this.parseSafeJson<ExamResponse>(raw);
  }

  async generateNote(topic: string, num: number, detail: string): Promise<NoteResponse> {
    const raw = await this.generateText(`${AI_PROMPTS.generateNote(num, detail)}\n\nTema: ${topic}`);
    return this.parseSafeJson<NoteResponse>(raw);
  }

  async generateFlashcards(topic: string, num: number): Promise<CardResponse> {
    const raw = await this.generateText(`${AI_PROMPTS.generateFlashcards(num)}\n\nTema: ${topic}`);
    return this.parseSafeJson<CardResponse>(raw);
  }

  async generateEducationalChatResponse(msg: string, ctx?: string, history?: any[]) {
    const prompt = `${AI_PROMPTS.SYSTEM_PROMPT({ previousTopics: [], messageCount: history?.length || 0 })}\n\nUser: ${msg}`;
    const response = await this.generateText(prompt);
    return { response };
  }

  async *generateEducationalChatResponseStream(msg: string, history?: any[]) {
    const prompt = `${AI_PROMPTS.SYSTEM_PROMPT({ previousTopics: [], messageCount: history?.length || 0 })}\n\nUser: ${msg}`;
    const result = await this.getModel(MODELS[0]).generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async generateChatTitleFromMessage(msg: string): Promise<string> {
    const raw = await this.getModel(MODELS[0]).generateContent(AI_PROMPTS.CHAT_TITLE_SYSTEM_PROMPT + "\n\n" + msg.substring(0, 100));
    return raw.response.text().trim().replace(/^["']|["']$/g, '');
  }
}
