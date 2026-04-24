import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { StatsAttemptsTypes } from './types/exam-attempts.type';
import { ExamAttemptFormatter } from './formatters/exam.formatter';
import { ExamDeckFormatter } from './formatters/deck.formatter';

@Injectable()
export class ExamAttemptsService {
  constructor(
    @InjectRepository(ExamAttempt)
    private attemptsRepo: Repository<ExamAttempt>,
  ) {}

  async recordAttempt(
    userId: number,
    examId: number,
    correctAnswers: number,
    totalQuestions: number,
    examTitle: string,
    userAnswers?: any,
  ): Promise<ExamAttempt> {
    const attempt = this.attemptsRepo.create({
      userId,
      examId,
      correctAnswers,
      totalQuestions,
      examTitle,
      userAnswers,
    });
    return this.attemptsRepo.save(attempt);
  }

  async getUserAttempts(userId: number, limit: number = 50): Promise<any[]> {
    const attempts: ExamAttempt[] = await this.attemptsRepo.find({
      where: { userId },
      relations: ['exam', 'exam.user'],
      order: { attemptedAt: 'DESC' },
      take: limit,
    });

    return ExamAttemptFormatter.formatAttempts(attempts);
  }

  async deckFormater(examAttempt: ExamAttempt | ExamAttempt[]) {
    if (Array.isArray(examAttempt)) {
      return ExamAttemptFormatter.formatAttempts(examAttempt);
    }
    return ExamAttemptFormatter.formatAttempt(examAttempt);
  }

  async getUserAttemptsDeck(userId: number) {
    const attempts = await this.getUserAttempts(userId);
    return attempts;
  }

  async getUserStats(userId: number): Promise<StatsAttemptsTypes> {
    const attempts = await this.getUserAttempts(userId, 1000);
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        avgCorrect: 0,
        bestScore: 0,
        totalQuestions: 0,
      };
    }

    const totalCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
    const totalQuestions = attempts.reduce(
      (sum, a) => sum + a.totalQuestions,
      0,
    );
    const bestScore = Math.max(...attempts.map((a) => a.correctAnswers));

    return {
      totalAttempts: attempts.length,
      avgCorrect: totalCorrect / attempts.length,
      bestScore,
      totalQuestions,
    };
  }
}
