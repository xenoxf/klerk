import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { DailyCredits } from './entities/daily-credits.entity';

// Configuración de créditos
export const CREDIT_CONFIG = {
  DAILY_CREDITS: 30,

  // Costos base por acción
  BASE_COSTS: {
    EXAM_GENERATION: 3,
    NOTE_GENERATION: 2,
    FLASHCARD_GENERATION: 2,
    CHAT_MESSAGE: 1,
  },

  // Multiplicadores para cálculo dinámico
  MULTIPLIERS: {
    EXAM_PER_QUESTION: 0.5, // +0.5 créditos por pregunta
    EXAM_DIFFICULTY: {
      easy: 1.0,
      medium: 1.3,
      hard: 1.7,
    },
    NOTE_DETAIL: {
      breve: 1.0,
      medio: 1.4,
      detallado: 1.9,
    },
    FLASHCARD_PER_CARD: 0.4, // +0.4 créditos por tarjeta
    TOPIC_LENGTH_THRESHOLD: 100, // Si el topic supera esto, +1 crédito extra
  },
};

export function calculateExamCost(
  numberOfQuestions: number,
  difficulty: string,
  topic: string,
): number {
  const base = CREDIT_CONFIG.BASE_COSTS.EXAM_GENERATION;
  const questionCost =
    numberOfQuestions * CREDIT_CONFIG.MULTIPLIERS.EXAM_PER_QUESTION;
  const difficultyMult =
    CREDIT_CONFIG.MULTIPLIERS.EXAM_DIFFICULTY[difficulty] || 1.3;
  const topicExtra =
    topic.length > CREDIT_CONFIG.MULTIPLIERS.TOPIC_LENGTH_THRESHOLD ? 1 : 0;
  return Math.ceil((base + questionCost) * difficultyMult + topicExtra);
}

export function calculateNoteCost(
  levelOfDetail: string,
  topic: string,
): number {
  const base = CREDIT_CONFIG.BASE_COSTS.NOTE_GENERATION;
  const detailMult =
    CREDIT_CONFIG.MULTIPLIERS.NOTE_DETAIL[levelOfDetail] || 1.4;
  const topicExtra =
    topic.length > CREDIT_CONFIG.MULTIPLIERS.TOPIC_LENGTH_THRESHOLD ? 1 : 0;
  return Math.ceil(base * detailMult + topicExtra);
}

export function calculateFlashcardCost(
  numberOfCards: number,
  topic: string,
): number {
  const base = CREDIT_CONFIG.BASE_COSTS.FLASHCARD_GENERATION;
  const cardCost = numberOfCards * CREDIT_CONFIG.MULTIPLIERS.FLASHCARD_PER_CARD;
  const topicExtra =
    topic.length > CREDIT_CONFIG.MULTIPLIERS.TOPIC_LENGTH_THRESHOLD ? 1 : 0;
  return Math.ceil(base + cardCost + topicExtra);
}

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
    action: keyof typeof CREDIT_CONFIG.BASE_COSTS,
    dynamicCost?: number,
  ): Promise<{
    hasCredits: boolean;
    remaining: number;
    cost: number;
    dailyCredits: DailyCredits;
  }> {
    const dailyCredits = await this.getOrCreateDailyCredits(userId);
    const cost = dynamicCost || CREDIT_CONFIG.BASE_COSTS[action];

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
    action: keyof typeof CREDIT_CONFIG.BASE_COSTS,
    dynamicCost?: number,
  ): Promise<{
    remaining: number;
    total: number;
    used: number;
  }> {
    const dailyCredits = await this.getOrCreateDailyCredits(userId);
    const cost = dynamicCost || CREDIT_CONFIG.BASE_COSTS[action];

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
    costs: typeof CREDIT_CONFIG.BASE_COSTS;
    multipliers: typeof CREDIT_CONFIG.MULTIPLIERS;
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
      costs: CREDIT_CONFIG.BASE_COSTS,
      multipliers: CREDIT_CONFIG.MULTIPLIERS,
    };
  }

  /**
   * Limpia registros antiguos (más de 7 días)
   */
  async cleanupOldRecords(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await this.dailyCreditsRepo.delete({
      date: LessThan(sevenDaysAgo.toISOString().split('T')[0]),
    });

    this.logger.log('Cleaned up old credit records');
  }
}
