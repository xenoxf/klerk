import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider,
  CardResponse,
  ChatResponse,
  ChatStreamChunk,
  Content,
  ExamResponse,
  FileInput,
  NoteResponse,
  ProviderId,
} from './ai-provider.interface';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';

export type TaskTier = 'CHEAP' | 'BALANCED' | 'QUALITY';

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);

  // Siempre modo ahorro: modelos baratos
  private readonly CHEAP_MODEL: Record<string, string> = {
    groq: 'llama-3.1-8b-instant',
    gemini: 'gemini-2.5-flash-lite',
  };

  constructor(
    private readonly groqProvider: GroqProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly configService: ConfigService,
  ) {}

  getProvider(providerId?: string): AiProvider {
    if (providerId === 'gemini') return this.geminiProvider;
    return this.groqProvider;
  }

  getModelForTask(_tier: TaskTier): string {
    // Siempre modo ahorro: usar modelo más barato
    return this.CHEAP_MODEL.groq;
  }

  classifyTask(_input: {
    kind: 'chat' | 'title' | 'agent-router' | 'agent-synth';
    promptLength?: number;
    hasFiles?: boolean;
    difficulty?: string;
    numQuestions?: number;
  }): { tier: TaskTier; provider: ProviderId } {
    // Siempre modo ahorro → todo es CHEAP, provider groq por defecto
    return { tier: 'CHEAP', provider: 'groq' };
  }

  async chat(
    msg: string,
    history?: Content[],
    providerId?: string,
  ): Promise<ChatResponse> {
    return this.getProvider(providerId).chat(msg, history);
  }

  async *chatStream(
    msg: string,
    history?: Content[],
    providerId?: string,
  ): AsyncGenerator<ChatStreamChunk> {
    yield* this.getProvider(providerId).chatStream(msg, history);
  }

  async chatWithFile(
    msg: string,
    fileBase64: string,
    mimeType: string,
    history?: Content[],
    providerId?: string,
  ): Promise<ChatResponse> {
    const provider = this.getProvider(providerId);
    if (!provider.supportsVision()) {
      throw new BadRequestException('Este provider no soporta archivos');
    }
    return provider.chatWithFile(msg, fileBase64, mimeType, history);
  }

  async *chatWithFileStream(
    msg: string,
    files: FileInput[],
    history?: Content[],
    providerId?: string,
  ): AsyncGenerator<ChatStreamChunk> {
    const provider = this.getProvider(providerId);
    if (!provider.supportsVision()) {
      throw new BadRequestException('Este provider no soporta archivos');
    }
    yield* provider.chatWithFileStream(msg, files, history);
  }

  async generateExam(
    topic: string,
    num: number,
    diff: string,
    providerId?: string,
  ): Promise<ExamResponse> {
    return this.getProvider(providerId).generateExam(topic, num, diff);
  }

  async generateIcfesExam(
    topic: string,
    num: number,
    diff: string,
    providerId?: string,
  ): Promise<ExamResponse> {
    return this.getProvider(providerId).generateIcfesExam(topic, num, diff);
  }

  async generateNote(
    topic: string,
    num: number,
    detail: string,
    providerId?: string,
  ): Promise<NoteResponse> {
    return this.getProvider(providerId).generateNote(topic, num, detail);
  }

  async generateFlashcards(
    topic: string,
    num: number,
    providerId?: string,
  ): Promise<CardResponse> {
    return this.getProvider(providerId).generateFlashcards(topic, num);
  }

  async generateTitle(msg: string, providerId?: string): Promise<string> {
    return this.getProvider(providerId).generateTitle(msg);
  }
}
