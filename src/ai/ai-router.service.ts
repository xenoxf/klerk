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

  // Modelos baratos por defecto (verificados contra la API).
  // El modelo efectivo real lo decide cada provider (env > default).

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

  /** Proveedores con keys reales configuradas. */
  getAvailableProviders(): Array<'groq' | 'gemini'> {
    return (['groq', 'gemini'] as const).filter((id) =>
      this.getProvider(id).isAvailable(),
    );
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
    const provider = await this.providerFor(undefined, userId);
    return { provider: provider.providerId, model: provider.modelName };
  }

  /**
   * Orden de intento: preferido del usuario primero, el otro después.
   * Solo incluye proveedores con keys reales.
   */
  private async orderedProviders(
    providerId?: string,
    userId?: number,
  ): Promise<AiProvider[]> {
    let first: 'groq' | 'gemini';
    if (providerId === 'groq' || providerId === 'gemini') {
      first = providerId;
    } else {
      first = await this.resolveProviderId(userId);
    }
    const second = first === 'groq' ? 'gemini' : 'groq';
    const ordered = [this.getProvider(first), this.getProvider(second)];
    const usable = ordered.filter((p) => p.isAvailable());
    if (usable.length === 0) {
      throw new Error(
        'Ningún proveedor de IA disponible: configura GROQ_API_KEY o GEMINI_API_KEY en el .env',
      );
    }
    if (usable[0] !== ordered[0]) {
      this.logger.warn(
        `${ordered[0].providerId} sin keys o caído en preferencia: usando ${usable[0].providerId}`,
      );
    }
    return usable;
  }

  private async providerFor(
    providerId?: string,
    userId?: number,
  ): Promise<AiProvider> {
    return (await this.orderedProviders(providerId, userId))[0];
  }

  /** Ejecuta con fallback automático al otro proveedor si el primero falla. */
  private async withFallback<T>(
    op: (p: AiProvider) => Promise<T>,
    providerId?: string,
    userId?: number,
  ): Promise<T> {
    const candidates = await this.orderedProviders(providerId, userId);
    let lastError: unknown = null;
    for (const p of candidates) {
      try {
        return await op(p);
      } catch (e) {
        lastError = e;
        this.logger.warn(
          `${p.providerId} falló, intentando siguiente proveedor: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
    throw lastError;
  }

  /**
   * Stream con fallback: si el preferido falla ANTES de emitir nada,
   * se reintenta con el otro desde cero. Si ya emitió, se propaga.
   */
  private async *streamWithFallback(
    op: (p: AiProvider) => AsyncGenerator<ChatStreamChunk>,
    providerId?: string,
    userId?: number,
  ): AsyncGenerator<ChatStreamChunk> {
    const candidates = await this.orderedProviders(providerId, userId);
    let lastError: unknown = null;
    for (const p of candidates) {
      let yielded = false;
      try {
        for await (const c of op(p)) {
          yielded = true;
          yield c;
        }
        return;
      } catch (e) {
        lastError = e;
        if (yielded) throw e;
        this.logger.warn(
          `${p.providerId} falló en stream, intentando siguiente: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
    throw lastError;
  }

  getModelForTask(_tier: TaskTier): string {
    // Siempre modo ahorro: modelo barato del provider por defecto
    return this.groqProvider.modelName;
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
    return this.withFallback(
      (p) => p.chat(msg, history),
      providerId,
      userId,
    );
  }

  async *chatStream(
    msg: string,
    history?: Content[],
    providerId?: string,
    userId?: number,
  ): AsyncGenerator<ChatStreamChunk> {
    yield* this.streamWithFallback(
      (p) => p.chatStream(msg, history),
      providerId,
      userId,
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
    return this.withFallback(async (p) => {
      if (!p.supportsVision()) {
        throw new BadRequestException('Este provider no soporta archivos');
      }
      return p.chatWithFile(msg, fileBase64, mimeType, history);
    }, providerId, userId);
  }

  async *chatWithFileStream(
    msg: string,
    files: FileInput[],
    history?: Content[],
    providerId?: string,
    userId?: number,
  ): AsyncGenerator<ChatStreamChunk> {
    const op = async function* (
      p: AiProvider,
    ): AsyncGenerator<ChatStreamChunk> {
      if (!p.supportsVision()) {
        throw new BadRequestException('Este provider no soporta archivos');
      }
      yield* p.chatWithFileStream(msg, files, history);
    };
    yield* this.streamWithFallback(op, providerId, userId);
  }

  async generateExam(
    topic: string,
    num: number,
    diff: string,
    providerId?: string,
    userId?: number,
  ): Promise<ExamResponse> {
    return this.withFallback(
      (p) => p.generateExam(topic, num, diff),
      providerId,
      userId,
    );
  }

  async generateIcfesExam(
    topic: string,
    num: number,
    diff: string,
    providerId?: string,
    userId?: number,
  ): Promise<ExamResponse> {
    return this.withFallback(
      (p) => p.generateIcfesExam(topic, num, diff),
      providerId,
      userId,
    );
  }

  async generateNote(
    topic: string,
    num: number,
    detail: string,
    providerId?: string,
    userId?: number,
  ): Promise<NoteResponse> {
    return this.withFallback(
      (p) => p.generateNote(topic, num, detail),
      providerId,
      userId,
    );
  }

  async generateFlashcards(
    topic: string,
    num: number,
    providerId?: string,
    userId?: number,
  ): Promise<CardResponse> {
    return this.withFallback(
      (p) => p.generateFlashcards(topic, num),
      providerId,
      userId,
    );
  }

  async generateTitle(
    msg: string,
    providerId?: string,
    userId?: number,
  ): Promise<string> {
    return this.withFallback((p) => p.generateTitle(msg), providerId, userId);
  }
}
