import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { TokenUsage } from './entities/token-usage.entity';

// Límites diarios de tokens por usuario
export const DAILY_LIMITS = {
  GENERATION_TOKENS: 50000, // ~100 generaciones de contenido
  CHAT_TOKENS: 100000, // ~500 mensajes de chat
  TOTAL_TOKENS: 150000, // Límite total diario
  GENERATION_REQUESTS: 100, // Máx generaciones por día
  CHAT_REQUESTS: 500, // Máx mensajes de chat por día
  TOTAL_REQUESTS: 600, // Máx peticiones totales por día
};

@Injectable()
export class TokenUsageService {
  private readonly logger = new Logger(TokenUsageService.name);

  constructor(
    @InjectRepository(TokenUsage)
    private tokenUsageRepo: Repository<TokenUsage>,
  ) {}

  /**
   * Obtiene o crea el registro de uso diario para un usuario
   */
  async getOrCreateDailyUsage(userId: number): Promise<TokenUsage> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let usage = await this.tokenUsageRepo.findOne({
      where: { userId, date: today },
    });

    if (!usage) {
      usage = this.tokenUsageRepo.create({
        userId,
        date: today,
        generationTokens: 0,
        chatTokens: 0,
        totalTokens: 0,
        generationRequests: 0,
        chatRequests: 0,
        totalRequests: 0,
      });
      usage = await this.tokenUsageRepo.save(usage);
    }

    return usage;
  }

  /**
   * Registra el uso de tokens para una petición de generación
   */
  async recordGenerationUsage(
    userId: number,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
  ): Promise<void> {
    const dailyUsage = await this.getOrCreateDailyUsage(userId);

    // Verificar límites antes de registrar
    this.checkLimits(dailyUsage, {
      type: 'generation',
      tokens: usage.totalTokens,
    });

    dailyUsage.generationTokens += usage.totalTokens;
    dailyUsage.totalTokens += usage.totalTokens;
    dailyUsage.generationRequests += 1;
    dailyUsage.totalRequests += 1;

    await this.tokenUsageRepo.save(dailyUsage);

    this.logger.debug(
      `User ${userId} generation usage: ${dailyUsage.totalTokens}/${DAILY_LIMITS.TOTAL_TOKENS} tokens today`,
    );
  }

  /**
   * Registra el uso de tokens para una petición de chat
   */
  async recordChatUsage(
    userId: number,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
  ): Promise<void> {
    const dailyUsage = await this.getOrCreateDailyUsage(userId);

    // Verificar límites antes de registrar
    this.checkLimits(dailyUsage, {
      type: 'chat',
      tokens: usage.totalTokens,
    });

    dailyUsage.chatTokens += usage.totalTokens;
    dailyUsage.totalTokens += usage.totalTokens;
    dailyUsage.chatRequests += 1;
    dailyUsage.totalRequests += 1;

    await this.tokenUsageRepo.save(dailyUsage);

    this.logger.debug(
      `User ${userId} chat usage: ${dailyUsage.totalTokens}/${DAILY_LIMITS.TOTAL_TOKENS} tokens today`,
    );
  }

  /**
   * Verifica si el usuario ha excedido sus límites diarios
   */
  checkLimits(
    dailyUsage: TokenUsage,
    request: { type: 'generation' | 'chat'; tokens: number },
  ): void {
    const limits = DAILY_LIMITS;

    // Verificar límite total de tokens
    if (dailyUsage.totalTokens + request.tokens > limits.TOTAL_TOKENS) {
      throw new BadRequestException({
        message: 'Límite diario de IA alcanzado',
        details:
          'Has alcanzado el límite diario de uso de IA. Por favor, espera hasta mañana para continuar usando estas funciones.',
        errorCode: 'DAILY_LIMIT_EXCEEDED',
        currentUsage: {
          totalTokens: dailyUsage.totalTokens,
          generationTokens: dailyUsage.generationTokens,
          chatTokens: dailyUsage.chatTokens,
        },
        limits: {
          totalTokens: limits.TOTAL_TOKENS,
          generationTokens: limits.GENERATION_TOKENS,
          chatTokens: limits.CHAT_TOKENS,
        },
      });
    }

    // Verificar límite específico de generación
    if (request.type === 'generation') {
      if (dailyUsage.generationRequests >= limits.GENERATION_REQUESTS) {
        throw new BadRequestException({
          message: 'Límite de generaciones diarias alcanzado',
          details:
            'Has alcanzado el límite de generaciones de contenido por hoy. Puedes seguir usando el chat.',
          errorCode: 'GENERATION_LIMIT_EXCEEDED',
        });
      }
      if (
        dailyUsage.generationTokens + request.tokens >
        limits.GENERATION_TOKENS
      ) {
        throw new BadRequestException({
          message: 'Límite de tokens de generación alcanzado',
          details:
            'Has alcanzado el límite de tokens para generación de contenido por hoy.',
          errorCode: 'GENERATION_TOKEN_LIMIT_EXCEEDED',
        });
      }
    }

    // Verificar límite específico de chat
    if (request.type === 'chat') {
      if (dailyUsage.chatRequests >= limits.CHAT_REQUESTS) {
        throw new BadRequestException({
          message: 'Límite de chat diario alcanzado',
          details:
            'Has alcanzado el límite de mensajes de chat por hoy. Puedes seguir generando contenido.',
          errorCode: 'CHAT_LIMIT_EXCEEDED',
        });
      }
      if (dailyUsage.chatTokens + request.tokens > limits.CHAT_TOKENS) {
        throw new BadRequestException({
          message: 'Límite de tokens de chat alcanzado',
          details: 'Has alcanzado el límite de tokens para chat por hoy.',
          errorCode: 'CHAT_TOKEN_LIMIT_EXCEEDED',
        });
      }
    }
  }

  /**
   * Obtiene estadísticas de uso para un usuario
   */
  async getUserUsageStats(userId: number): Promise<{
    today: {
      totalTokens: number;
      generationTokens: number;
      chatTokens: number;
      totalRequests: number;
      percentageUsed: number;
    };
    limits: typeof DAILY_LIMITS;
  }> {
    const dailyUsage = await this.getOrCreateDailyUsage(userId);
    const limits = DAILY_LIMITS;

    return {
      today: {
        totalTokens: dailyUsage.totalTokens,
        generationTokens: dailyUsage.generationTokens,
        chatTokens: dailyUsage.chatTokens,
        totalRequests: dailyUsage.totalRequests,
        percentageUsed: Math.round(
          (dailyUsage.totalTokens / limits.TOTAL_TOKENS) * 100,
        ),
      },
      limits,
    };
  }

  /**
   * Limpia registros antiguos (más de 30 días)
   */
  async cleanupOldRecords(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.tokenUsageRepo.delete({
      createdAt: MoreThanOrEqual(thirtyDaysAgo),
    });

    this.logger.log('Cleaned up old token usage records');
  }
}
