import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamAttempt } from './entities/exam-attempt.entity';

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
    additionalData?: {
      examTema?: string;
      examArea?: string;
      examDifficulty?: string;
      score?: number;
      timeSpent?: number;
    },
  ): Promise<ExamAttempt> {
    const incorrectAnswers = totalQuestions - correctAnswers;
    const attempt = this.attemptsRepo.create({
      userId,
      examId,
      correctAnswers,
      totalQuestions,
      examTitle,
      incorrectAnswers,
      ...additionalData,
    });
    return this.attemptsRepo.save(attempt);
  }

  async getUserAttempts(
    userId: number,
    limit: number = 50,
  ): Promise<ExamAttempt[]> {
    return this.attemptsRepo.find({
      where: { userId },
      order: { attemptedAt: 'DESC' },
      take: limit,
    });
  }

  async getUserStats(userId: number): Promise<{
    totalAttempts: number;
    avgCorrect: number;
    bestScore: number;
    totalQuestions: number;
    avgPercentage: number;
    totalCorrect: number;
    totalIncorrect: number;
    avgTimeSpent: number;
    attemptsByDifficulty: Record<string, { count: number; avgScore: number }>;
    recentPerformance: { date: string; score: number }[];
  }> {
    const attempts = await this.getUserAttempts(userId, 1000);
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        avgCorrect: 0,
        bestScore: 0,
        totalQuestions: 0,
        avgPercentage: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        avgTimeSpent: 0,
        attemptsByDifficulty: {},
        recentPerformance: [],
      };
    }

    const totalCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
    const totalQuestions = attempts.reduce(
      (sum, a) => sum + a.totalQuestions,
      0,
    );
    const totalIncorrect = attempts.reduce(
      (sum, a) => sum + (a.incorrectAnswers || 0),
      0,
    );
    const bestScore = Math.max(...attempts.map((a) => a.correctAnswers));

    const avgCorrect = totalCorrect / attempts.length;
    const avgPercentage =
      totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    const timeSpentAttempts = attempts.filter(
      (a) => a.timeSpent !== null && a.timeSpent !== undefined,
    );
    const totalTimeSpent = timeSpentAttempts.reduce(
      (sum, a) => sum + (a.timeSpent || 0),
      0,
    );
    const avgTimeSpent =
      timeSpentAttempts.length > 0
        ? totalTimeSpent / timeSpentAttempts.length
        : 0;

    // Stats by difficulty
    const attemptsByDifficulty: Record<
      string,
      { count: number; totalScore: number }
    > = {};
    attempts.forEach((a) => {
      const difficulty = a.examDifficulty || 'unknown';
      if (!attemptsByDifficulty[difficulty]) {
        attemptsByDifficulty[difficulty] = { count: 0, totalScore: 0 };
      }
      attemptsByDifficulty[difficulty].count += 1;
      attemptsByDifficulty[difficulty].totalScore += a.score || 0;
    });

    const attemptsByDifficultyAvg: Record<
      string,
      { count: number; avgScore: number }
    > = {};
    Object.entries(attemptsByDifficulty).forEach(([diff, data]) => {
      attemptsByDifficultyAvg[diff] = {
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      };
    });

    // Recent performance (last 10 attempts)
    const recentPerformance = attempts
      .slice(0, 10)
      .map((a) => ({
        date: a.attemptedAt.toISOString(),
        score:
          a.score || Math.round((a.correctAnswers / a.totalQuestions) * 100),
      }))
      .reverse();

    return {
      totalAttempts: attempts.length,
      avgCorrect,
      bestScore,
      totalQuestions,
      avgPercentage,
      totalCorrect,
      totalIncorrect,
      avgTimeSpent,
      attemptsByDifficulty: attemptsByDifficultyAvg,
      recentPerformance,
    };
  }
}
