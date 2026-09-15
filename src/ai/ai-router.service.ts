import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAiConfig } from './entities/user-ai-config.entity';
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

  // Siempre modo ahorro: modelos baratos (verificados contra la API)
  private readonly CHEAP_MODEL: Record<string, string> = {
    groq: 'openai/gpt-oss-20b',
    gemini: 'gemini-2.5-flash-lite',
  };

  constructor(
    private readonly groqProvider: GroqProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly configService: ConfigService,
    @InjectRepository(UserAiConfig)
    private readonly configRepo: Repository<UserAiConfig>,
  ) {}

  getProvider(providerId?: string): AiProvider {
    if (providerId === 'gemini') return this.geminiProvider;
    return this.groqProvider;
  }

  /**
   * Provider efectivo de un usuario según su Centro IA (Mi IA).
   * 'auto' o sin config → groq (ahorro por defecto).
   */
  async resolveProviderId(userId?: number): Promise<'groq' | 'gemini'> {
    if (userId) {
      try {
        const cfg = await this.configRepo.findOne({
          where: { userId },
          select: ['provider'],
        });
        if (cfg?.provider === 'gemini') return 'gemini';
      } catch (e) {
        this.logger.warn(`No se pudo leer UserAiConfig: ${e}`);
      }
    }
    return this.configService.get<string>('AI_DEFAULT_PROVIDER') === 'gemini'
      ? 'gemini'
      : 'groq';
  }

  /** Modelo + provider efectivos para chat (siempre ahorro). */
  async resolveChatModel(
    userId?: number,
  ): Promise<{ provider: string; model: string }> {
    const provider = await this.resolveProviderId(userId);
    return { provider, model: this.CHEAP_MODEL[provider] };
  }

  private async providerFor(
    providerId?: string,
    userId?: number,
  ): Promise<AiProvider> {
    if (providerId === 'groq' || providerId === 'gemini') {
      return this.getProvider(providerId);
    }
    return this.getProvider(await this.resolveProviderId(userId));
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
    userId?: number,
  ): Promise<ChatResponse> {
    return (await this.providerFor(providerId, userId)).chat(msg, history);
  }

  async *chatStream(
    msg: string,
    history?: Content[],
    providerId?: string,
    userId?: number,
  ): AsyncGenerator<ChatStreamChunk> {
    yield* (await this.providerFor(providerId, userId)).chatStream(
      msg,
      history,
    );
  }

  async chatWithFile(
    msg: string,
    fileBase64: string,
    mimeType: string,
    history?: Content[],
    providerId?: string,
    userId?: number,
  ): Promise<ChatResponse> {
    const provider = await this.providerFor(providerId, userId);
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
    userId?: number,
  ): AsyncGenerator<ChatStreamChunk> {
    const provider = await this.providerFor(providerId, userId);
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
    userId?: number,
  ): Promise<ExamResponse> {
    return (await this.providerFor(providerId, userId)).generateExam(
      topic,
      num,
      diff,
    );
  }

  async generateIcfesExam(
    topic: string,
    num: number,
    diff: string,
    providerId?: string,
    userId?: number,
  ): Promise<ExamResponse> {
    return (await this.providerFor(providerId, userId)).generateIcfesExam(
      topic,
      num,
      diff,
    );
  }

  async generateNote(
    topic: string,
    num: number,
    detail: string,
    providerId?: string,
    userId?: number,
  ): Promise<NoteResponse> {
    return (await this.providerFor(providerId, userId)).generateNote(
      topic,
      num,
      detail,
    );
  }

  async generateFlashcards(
    topic: string,
    num: number,
    providerId?: string,
    userId?: number,
  ): Promise<CardResponse> {
    return (await this.providerFor(providerId, userId)).generateFlashcards(
      topic,
      num,
    );
  }

  async generateTitle(
    msg: string,
    providerId?: string,
    userId?: number,
  ): Promise<string> {
    return (await this.providerFor(providerId, userId)).generateTitle(msg);
  }
}
