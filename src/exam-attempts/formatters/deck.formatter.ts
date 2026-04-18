import { Exam } from '../../exams/entities/exam.entity';
import { ExamAttempt } from '../entities/exam-attempt.entity';

/**
 * Formatter para Exams - similiar al usado en ExamsService
 */
export class ExamDeckFormatter {
  /**
   * Formatea un exam o array de exams de la misma manera que ExamsService lo hace
   */
  static formatExam(
    exam: Exam,
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
  ): any {
    const base = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      area: exam.area,
      tema: exam.tema,
      difficulty: exam.difficulty,
      type: exam.type,
      totalQuestions: exam.totalQuestions,
      code: exam.code,
      createdAt: exam.createdAt,
      creatorName: exam.user?.name || 'Anónimo',
      canDelete: userId ? exam.userId === userId : false,
      likesCount: 0, // Se puede pasar como parámetro si es necesario
      userLiked: false, // Se puede pasar como parámetro si es necesario
    };

    if (
      includeQuestionsAndOptions &&
      exam.questions &&
      exam.questions.length > 0
    ) {
      return {
        ...base,
        questions: exam.questions.map((q) => ({
          id: q.id,
          question: q.question,
          explanation: q.explanation || '',
          contextId: q.contextId,
          contextContent: q.contextContent,
          options:
            q.options && q.options.length > 0
              ? q.options.map((opt) => ({
                  id: opt.id,
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  feedback: opt.feedback || '',
                }))
              : [],
        })),
      };
    }

    return { ...base, questions: [] };
  }

  static formatExams(
    exams: Exam[],
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
  ): any[] {
    return exams.map((exam) =>
      this.formatExam(exam, userId, includeQuestionsAndOptions),
    );
  }
}
