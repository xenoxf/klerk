import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { QuickQuiz } from './entities/quick-quiz.entity';
import { QuickQuizQuestion } from './entities/quick-quiz-question.entity';
import { QuickQuizOption } from './entities/quick-quiz-option.entity';
import { GenerateQuickQuizDto } from './dto/generate-quick-quiz.dto';
import { GeminiService } from '../gemini/gemini.service';
import { CreditsService } from '../credits/credits.service';
import { LikesService } from '../likes/likes.service';
import { UpdateQuickQuizDto } from './dto/update-quick-quiz.dto';
import {
  shuffleArray,
  isPublicAccess,
  normalizeAccess,
} from '../common/utils/shared.utils';

const QUICK_QUIZ_CREDIT_COST = 2;

@Injectable()
export class QuickQuizzesService {
  constructor(
    @InjectRepository(QuickQuiz) private quickQuizRepo: Repository<QuickQuiz>,
    @InjectRepository(QuickQuizQuestion)
    private questionRepo: Repository<QuickQuizQuestion>,
    @InjectRepository(QuickQuizOption)
    private optionRepo: Repository<QuickQuizOption>,
    private readonly geminiService: GeminiService,
    private readonly creditsService: CreditsService,
    private readonly likesService: LikesService,
  ) {}

  // ==================== GENERATE QUICK QUIZ FROM TOPIC ====================

  async generateQuickQuiz(input: GenerateQuickQuizDto, userId: number) {
    await this.creditsService.consumeCredits(
      userId,
      'EXAM_GENERATION',
      QUICK_QUIZ_CREDIT_COST,
    );

    const response = await this.geminiService.generateQuickQuiz(
      input.topic,
      input.numberOfQuestions,
      input.difficulty,
    );

    const { questions, metadata } = response;
    const { title, description, tema, area } = metadata;

    const quickQuiz = this.quickQuizRepo.create({
      area,
      tema,
      title,
      description,
      difficulty: input.difficulty,
      userId,
      totalQuestions: input.numberOfQuestions,
      acceso: normalizeAccess(input.acceso),
      code: await this.generateCode(),
    });

    const savedQuiz = await this.quickQuizRepo.save(quickQuiz);

    for (const q of questions) {
      const question = this.questionRepo.create({
        question: q.question,
        explanation: q.explanation || '',
        quickQuiz: savedQuiz,
      });

      const savedQuestion = await this.questionRepo.save(question);

      for (const opt of q.options) {
        const option = this.optionRepo.create({
          text: opt.text,
          isCorrect: opt.isCorrect,
          question: savedQuestion,
        });
        await this.optionRepo.save(option);
      }
    }

    return {
      message: 'Quick quiz generado exitosamente',
      quizId: savedQuiz.id,
      totalQuestions: savedQuiz.totalQuestions,
    };
  }

  // ==================== BASIC CRUD ====================

  async generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.quickQuizRepo.findOne({ where: { code } });
    if (existing) {
      return this.generateCode();
    }
    return code;
  }

  async getById(id: number, userId: number) {
    const quiz = await this.quickQuizRepo.findOne({
      where: { id, userId },
      relations: ['questions', 'questions.options', 'user'],
    });

    if (!quiz) throw new NotFoundException('Quick quiz not found');
    return this.quickQuizRefactor(quiz, userId, true);
  }

  async getByIdWithAccess(id: number, userId?: number) {
    const quiz = await this.quickQuizRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!quiz) throw new NotFoundException('Quick quiz not found');
    if (!isPublicAccess(quiz.acceso) && quiz.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este quick quiz');
    }
    return this.quickQuizRefactor(quiz, userId, true);
  }

  async getByIdForPlay(id: number, userId: number) {
    const quiz = await this.quickQuizRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!quiz) throw new NotFoundException('Quick quiz not found');

    if (!isPublicAccess(quiz.acceso) && quiz.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este quick quiz');
    }

    return this.quickQuizRefactor(quiz, userId, true);
  }

  async getLockedQuiz(id: number, userId: number) {
    const quiz = await this.quickQuizRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!quiz) throw new NotFoundException('Quick quiz not found');

    if (quiz.userId !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para ver este quick quiz',
      );
    }

    return this.quickQuizRefactor(quiz, userId, true);
  }

  async updateQuizScore(query: UpdateQuickQuizDto, userId: number) {
    const quiz = await this.getById(query.id, userId);
    if (!quiz) throw new NotFoundException('Quick quiz not found');
    await this.quickQuizRepo.update(query.id, { score: query.score });
    return this.getMyQuizzesDeck(userId);
  }

  async delete(id: number, userId: number) {
    const quiz = await this.quickQuizRepo.findOne({ where: { id, userId } });
    if (!quiz)
      throw new NotFoundException('Quick quiz not found or not owned by user');
    await this.quickQuizRepo.delete(id);
    return { message: 'Quick quiz deleted' };
  }

  async create(payload: Partial<QuickQuiz>, userId: number) {
    if (!payload?.title?.trim()) {
      throw new BadRequestException('El título es requerido');
    }

    const quiz = this.quickQuizRepo.create({
      title: payload.title.trim(),
      description: payload.description ?? '',
      area: payload.area ?? '',
      tema: payload.tema ?? '',
      difficulty: payload.difficulty ?? 'medium',
      totalQuestions: payload.totalQuestions ?? 0,
      acceso: normalizeAccess(payload.acceso),
      code: await this.generateCode(),
      userId,
    });

    const savedQuiz = await this.quickQuizRepo.save(quiz);
    return this.getById(savedQuiz.id, userId);
  }

  async update(id: number, payload: Partial<QuickQuiz>, userId: number) {
    const quiz = await this.quickQuizRepo.findOne({ where: { id, userId } });
    if (!quiz)
      throw new NotFoundException('Quick quiz not found or not owned by user');

    await this.quickQuizRepo.update(id, {
      title: payload.title ?? quiz.title,
      description: payload.description ?? quiz.description,
      area: payload.area ?? quiz.area,
      tema: payload.tema ?? quiz.tema,
      difficulty: payload.difficulty ?? quiz.difficulty,
      acceso: payload.acceso ?? quiz.acceso,
    });

    return this.getById(id, userId);
  }

  // ==================== REFACTOR DECKS ====================

  async quickQuizRefactor(
    quizzes: QuickQuiz[] | QuickQuiz,
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    if (Array.isArray(quizzes)) {
      return quizzes.map((quiz) =>
        this._quickQuizRefactorSingle(
          quiz,
          userId,
          includeQuestionsAndOptions,
          likesData,
        ),
      );
    }
    return this._quickQuizRefactorSingle(
      quizzes,
      userId,
      includeQuestionsAndOptions,
      likesData,
    );
  }

  private _quickQuizRefactorSingle(
    quiz: QuickQuiz,
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    const base = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      area: quiz.area,
      tema: quiz.tema,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.totalQuestions,
      creatorName: quiz.user?.name || 'Anónimo',
      likesCount: likesData?.counts?.get(quiz.id) || 0,
      userLiked: likesData?.userLiked?.has(quiz.id) || false,
      canDelete: userId ? quiz.userId === userId : false,
      quizType: 'quick' as const,
    };

    if (
      includeQuestionsAndOptions &&
      quiz.questions &&
      quiz.questions.length > 0
    ) {
      return {
        ...base,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          explanation: q.explanation || '',
          options:
            q.options && q.options.length > 0
              ? q.options.map((opt) => ({
                  id: opt.id,
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                }))
              : [],
        })),
      };
    }

    return { ...base, questions: [] };
  }

  async getPublicQuizzesDeck(userId?: number) {
    const quizzes = await this.quickQuizRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    const filtered = quizzes.filter((quiz) => isPublicAccess(quiz.acceso));
    const quizIds = filtered.map((e) => e.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'exam',
      quizIds,
    );
    const userLikedSet = userId
      ? await this.likesService.getUserLikedCards('exam', userId, quizIds)
      : new Set<number>();
    const result = this.quickQuizRefactor(filtered, userId, false, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    return Array.isArray(result) ? shuffleArray(result) : result;
  }

  async getMyQuizzesDeck(userId: number) {
    const quizzes = await this.quickQuizRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    const quizIds = quizzes.map((e) => e.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'exam',
      quizIds,
    );
    const userLikedSet = await this.likesService.getUserLikedCards(
      'exam',
      userId,
      quizIds,
    );
    const result = this.quickQuizRefactor(quizzes, userId, false, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    return Array.isArray(result) ? shuffleArray(result) : result;
  }

  async getQuizByCode(code: string, userId?: number) {
    const quiz = await this.quickQuizRepo.findOne({
      where: { code },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!quiz) throw new NotFoundException('Quick quiz not found');
    if (!isPublicAccess(quiz.acceso)) {
      throw new UnauthorizedException('No tienes acceso a este quick quiz');
    }
    return this.quickQuizRefactor(quiz, userId, true);
  }

  // ==================== INTELLIGENT SEARCH ====================

  async searchQuizzes(
    query: string,
    userId?: number,
    limit: number = 20,
    offset: number = 0,
    searchInQuestions: boolean = true,
  ) {
    if (!query || query.trim().length === 0) {
      const quizzes = await this.quickQuizRepo.find({
        where: { acceso: 'publico' },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
      return this.quickQuizRefactor(quizzes, userId, false);
    }

    const normalizedQuery = query.trim().toLowerCase();

    const queryBuilder = this.quickQuizRepo
      .createQueryBuilder('quiz')
      .leftJoin('quiz.questions', 'questions')
      .where('LOWER(quiz.title) LIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('LOWER(quiz.description) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(quiz.tema) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(quiz.area) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('quiz.code = :exactQuery', {
        exactQuery: normalizedQuery.toUpperCase(),
      });

    if (searchInQuestions) {
      queryBuilder.orWhere('LOWER(questions.question) LIKE :query', {
        query: `%${normalizedQuery}%`,
      });
    }

    if (!userId) {
      queryBuilder.andWhere('quiz.acceso = :acceso', { acceso: 'publico' });
    } else {
      queryBuilder.andWhere(
        '(quiz.acceso = :acceso OR quiz.userId = :userId)',
        {
          acceso: 'publico',
          userId,
        },
      );
    }

    queryBuilder.orderBy('quiz.createdAt', 'DESC').take(limit).skip(offset);

    const quizzes = await queryBuilder.getMany();

    if (quizzes.length > 0) {
      const quizIds = quizzes.map((e) => e.id);
      const quizzesWithUsers = await this.quickQuizRepo.find({
        where: { id: In(quizIds) },
        relations: ['user'],
      });
      return this.quickQuizRefactor(quizzesWithUsers, userId, false);
    }

    return this.quickQuizRefactor(quizzes, userId, false);
  }

  async deleteAll(
    userId: number,
  ): Promise<{ deleted: boolean; message: string }> {
    await this.quickQuizRepo.delete({ userId });
    return { deleted: true, message: 'All quick quizzes deleted' };
  }
}
