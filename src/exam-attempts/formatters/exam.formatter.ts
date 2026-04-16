import { Exam } from '../../exams/entities/exam.entity';
import { ExamAttempt } from '../entities/exam-attempt.entity';

/**
 * Formatter para convertir ExamAttempt a un deck formateado
 * Incluye información del exam relacionado
 */
export class ExamAttemptFormatter {
  static formatAttempt(attempt: ExamAttempt): any {
    return {
      id: attempt.id,
      examId: attempt.examId,
      userId: attempt.userId,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      examTitle: attempt.examTitle,
      attemptedAt: attempt.attemptedAt,
      percentage: attempt.totalQuestions > 0 
        ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
        : 0,
      userAnswers: attempt.userAnswers || null,
      // Información del exam
      examCode: attempt.exam?.code || 'N/A',
      examArea: attempt.exam?.area || 'General',
      examTema: attempt.exam?.tema || 'Varios',
      examDifficulty: attempt.exam?.difficulty || 'medium',
      examCreatorName: attempt.exam?.user?.name || 'Anónimo',
      examDescription: attempt.exam?.description || '',
      examType: attempt.exam?.type || 'quiz',
    };
  }

  static formatAttempts(attempts: ExamAttempt[]): any[] {
    return attempts.map((attempt) => this.formatAttempt(attempt));
  }
}
