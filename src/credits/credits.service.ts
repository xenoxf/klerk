import {
  Injectable,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { DailyCredits } from './entities/daily-credits.entity';

// Configuración de créditos
export const CREDIT_CONFIG = {
  // Créditos diarios por usuario
  DAILY_CREDITS: 100,

  // Costo en créditos por acción
  COSTS: {
    EXAM_GENERATION: 5, // Generar un examen cuesta 5 créditos
    NOTE_GENERATION: 4, // Generar notas cuesta 4 créditos
    FLASHCARD_GENERATION: 3, // Generar flashcards cuesta 3 créditos
    CHAT_MESSAGE: 1, // Cada mensaje de chat cuesta 1 crédito
  },
};

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    @InjectRepository(DailyCredits)
    private dailyCreditsRepo: Repository<DailyCredits>,
  ) {}

  /**
   * Obtiene o crea el registro de créditos diario para un usuario
   */
  async getOrCreateDailyCredits(userId: number): Promise<DailyCredits> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let credits = await this.dailyCreditsRepo.findOne({
      where: { userId, date: today },
    });

    if (!credits) {
      credits = this.dailyCreditsRepo.create({
        userId,
        date: today,
        totalCredits: CREDIT_CONFIG.DAILY_CREDITS,
        usedCredits: 0,
        remainingCredits: CREDIT_CONFIG.DAILY_CREDITS,
        examGenerations: 0,
        noteGenerations: 0,
        flashcardGenerations: 0,
        chatMessages: 0,
      });
      credits = await this.dailyCreditsRepo.save(credits);
    }

    return credits;
  }

  /**
   * Verifica si el usuario tiene créditos suficientes para una acción
   */
  async checkCredits(
    userId: number,
    action: keyof typeof CREDIT_CONFIG.COSTS,
  ): Promise<{
    hasCredits: boolean;
    remaining: number;
    cost: number;
    dailyCredits: DailyCredits;
  }> {
    const dailyCredits = await this.getOrCreateDailyCredits(userId);
    const cost = CREDIT_CONFIG.COSTS[action];

    return {
      hasCredits: dailyCredits.remainingCredits >= cost,
      remaining: dailyCredits.remainingCredits,
      cost,
      dailyCredits,
    };
  }

  /**
   * Consume créditos para una acción
   * Lanza ForbiddenException si no hay créditos suficientes
   */
  async consumeCredits(
    userId: number,
    action: keyof typeof CREDIT_CONFIG.COSTS,
  ): Promise<{
    remaining: number;
    total: number;
    used: number;
  }> {
    const dailyCredits = await this.getOrCreateDailyCredits(userId);
    const cost = CREDIT_CONFIG.COSTS[action];

    // Verificar si hay créditos suficientes
    if (dailyCredits.remainingCredits < cost) {
      throw new ForbiddenException({
        message: 'Créditos diarios agotados',
        details: `No tienes suficientes créditos para esta acción. Necesitas ${cost} créditos, pero solo te quedan ${dailyCredits.remainingCredits}. Los créditos se renuevan cada día.`,
        errorCode: 'INSUFFICIENT_CREDITS',
        remaining: dailyCredits.remainingCredits,
        required: cost,
        resetsAt: new Date(new Date().setDate(new Date().getDate() + 1))
          .toISOString()
          .split('T')[0],
      });
    }

    // Actualizar créditos
    dailyCredits.usedCredits += cost;
    dailyCredits.remainingCredits -= cost;

    // Actualizar contador según el tipo de acción
    switch (action) {
      case 'EXAM_GENERATION':
        dailyCredits.examGenerations += 1;
        break;
      case 'NOTE_GENERATION':
        dailyCredits.noteGenerations += 1;
        break;
      case 'FLASHCARD_GENERATION':
        dailyCredits.flashcardGenerations += 1;
        break;
      case 'CHAT_MESSAGE':
        dailyCredits.chatMessages += 1;
        break;
    }

    const updated = await this.dailyCreditsRepo.save(dailyCredits);

    this.logger.debug(
      `User ${userId} consumed ${cost} credits for ${action}. Remaining: ${updated.remainingCredits}/${updated.totalCredits}`,
    );

    return {
      remaining: updated.remainingCredits,
      total: updated.totalCredits,
      used: updated.usedCredits,
    };
  }

  /**
   * Obtiene el estado actual de créditos de un usuario
   */
  async getCreditsStatus(userId: number): Promise<{
    remaining: number;
    total: number;
    used: number;
    percentageUsed: number;
    breakdown: {
      examGenerations: number;
      noteGenerations: number;
      flashcardGenerations: number;
      chatMessages: number;
    };
    costs: typeof CREDIT_CONFIG.COSTS;
  }> {
    const dailyCredits = await this.getOrCreateDailyCredits(userId);

    return {
      remaining: dailyCredits.remainingCredits,
      total: dailyCredits.totalCredits,
      used: dailyCredits.usedCredits,
      percentageUsed: Math.round(
        (dailyCredits.usedCredits / dailyCredits.totalCredits) * 100,
      ),
      breakdown: {
        examGenerations: dailyCredits.examGenerations,
        noteGenerations: dailyCredits.noteGenerations,
        flashcardGenerations: dailyCredits.flashcardGenerations,
        chatMessages: dailyCredits.chatMessages,
      },
      costs: CREDIT_CONFIG.COSTS,
    };
  }

  /**
   * Limpia registros antiguos (más de 7 días)
   */
  async cleanupOldRecords(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await this.dailyCreditsRepo.delete({
      createdAt: MoreThanOrEqual(sevenDaysAgo),
    });

    this.logger.log('Cleaned up old credit records');
  }
}
