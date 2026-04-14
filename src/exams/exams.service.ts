import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/examQuestion.entity';
import { ExamOption } from './entities/exam-option.entity';
import { ExamContext } from './entities/exam-context.entity';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { GeminiService } from '../gemini/gemini.service';
import { CreditsService, calculateExamCost } from '../credits/credits.service';
import { LikesService } from '../likes/likes.service';
import { UpdateExamDto } from './dto/update-exam.dto';
import {
  shuffleArray,
  isPublicAccess,
  normalizeAccess,
} from '../common/utils/shared.utils';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private questionRepo: Repository<ExamQuestion>,
    @InjectRepository(ExamOption) private optionRepo: Repository<ExamOption>,
    @InjectRepository(ExamContext)
    private contextRepo: Repository<ExamContext>,
    private readonly geminiService: GeminiService,
    private readonly creditsService: CreditsService,
    private readonly likesService: LikesService,
  ) {}

  // ==================== GENERATE EXAM FROM TOPIC ====================

  async generateExam(input: GenerateExamDto, userId: number) {
    const dynamicCost = calculateExamCost(
      input.numberOfQuestions,
      input.difficulty,
      input.reference,
    );

    const creditStatus = await this.creditsService.consumeCredits(
      userId,
      'EXAM_GENERATION',
      dynamicCost,
    );

    const response = await this.geminiService.generateExam(
      input.reference,
      input.numberOfQuestions,
      input.difficulty,
    );

    const { questions, metadata } = response;
    const { title, description, tema, area } = metadata;

    const exam = this.examRepo.create({
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

    const savedExam = await this.examRepo.save(exam);

    // Group questions by context to create ExamContext entities
    const contextMap = new Map<string, ExamContext>();
    const questionsWithNoContext: typeof questions = [];

    for (const q of questions) {
      const contextText = (q.context || '').trim();

      if (contextText) {
        // Check if we already have this context
        let ctx = contextMap.get(contextText);
        if (!ctx) {
          ctx = this.contextRepo.create({
            text: contextText,
            exam: savedExam,
          });
          ctx = await this.contextRepo.save(ctx);
          contextMap.set(contextText, ctx);
        }
      } else {
        questionsWithNoContext.push(q);
      }
    }

    // Now create questions with their context groups
    for (const q of questions) {
      const contextText = (q.context || '').trim();
      const contextGroup = contextText ? contextMap.get(contextText) : null;

      const question = this.questionRepo.create({
        context: contextText || null,
        question: q.question,
        explanation: q.explanation || '',
        contextGroup: contextGroup || null,
        exam: savedExam,
      });

      const savedQuestion = await this.questionRepo.save(question);

      for (const opt of q.options) {
        const option = this.optionRepo.create({
          text: opt.text,
          isCorrect: opt.isCorrect,
          feedback: opt.feedback || null,
          question: savedQuestion,
        });
        await this.optionRepo.save(option);
      }
    }

    // Fetch the full exam with questions and options to return
    const fullExam = await this.examRepo.findOne({
      where: { id: savedExam.id },
      relations: ['questions', 'questions.options', 'user'],
    });

    if (!fullExam) {
      throw new Error('Exam not found after creation');
    }

    const examData = await this.examRefactor(fullExam, userId, true);

    return {
      message: 'Examen generado exitosamente',
      examId: savedExam.id,
      totalQuestions: savedExam.totalQuestions,
      creditsRemaining: creditStatus.remaining,
      creditsTotal: creditStatus.total,
      exam: examData,
    };
  }

  // ==================== BASIC CRUD ====================

  async generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.examRepo.findOne({ where: { code } });
    if (existing) {
      return this.generateCode();
    }
    return code;
  }

  async getById(id: number, userId: number) {
    const exam = await this.examRepo.findOne({
      where: { id, userId },
      relations: ['questions', 'questions.options', 'user'],
    });

    if (!exam) throw new NotFoundException('Exam not found');
    return this.examRefactor(exam, userId, true);
  }

  async getByIdWithAccess(id: number, userId?: number) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!exam) throw new NotFoundException('Exam not found');
    if (!isPublicAccess(exam.acceso) && exam.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este quiz');
    }
    return this.examRefactor(exam, userId, true);
  }

  async getByIdForPlay(id: number, userId: number) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!exam) throw new NotFoundException('Exam not found');

    if (!isPublicAccess(exam.acceso) && exam.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este quiz');
    }

    return this.examRefactor(exam, userId, true);
  }

  async getLockedExam(id: number, userId: number) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!exam) throw new NotFoundException('Exam not found');

    if (exam.userId !== userId) {
      throw new UnauthorizedException('No tienes permiso para ver este quiz');
    }

    return this.examRefactor(exam, userId, true);
  }

  async updateExamScore(query: UpdateExamDto, userId: number) {
    const exam = await this.getById(query.id, userId);
    if (!exam) throw new NotFoundException('Exam not found');
    await this.examRepo.update(query.id, { score: query.score });
    return this.getMyExamsDeck(userId);
  }

  async delete(id: number, userId: number) {
    const exam = await this.examRepo.findOne({ where: { id, userId } });
    if (!exam)
      throw new NotFoundException('Exam not found or not owned by user');
    await this.examRepo.delete(id);
    return { message: 'Exam deleted' };
  }

  async create(payload: Partial<Exam>, userId: number) {
    if (!payload?.title?.trim()) {
      throw new BadRequestException('El título es requerido');
    }

    const exam = this.examRepo.create({
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

    const savedExam = await this.examRepo.save(exam);
    return this.getById(savedExam.id, userId);
  }

  async update(id: number, payload: Partial<Exam>, userId: number) {
    const exam = await this.examRepo.findOne({ where: { id, userId } });
    if (!exam)
      throw new NotFoundException('Exam not found or not owned by user');

    await this.examRepo.update(id, {
      title: payload.title ?? exam.title,
      description: payload.description ?? exam.description,
      area: payload.area ?? exam.area,
      tema: payload.tema ?? exam.tema,
      difficulty: payload.difficulty ?? exam.difficulty,
      acceso: payload.acceso ?? exam.acceso,
    });

    return this.getById(id, userId);
  }

  // ==================== REFACTOR DECKS ====================

  async examRefactor(
    exams: Exam[] | Exam,
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    if (Array.isArray(exams)) {
      return exams.map((exam) =>
        this._examRefactorSingle(
          exam,
          userId,
          includeQuestionsAndOptions,
          likesData,
        ),
      );
    }
    return this._examRefactorSingle(
      exams,
      userId,
      includeQuestionsAndOptions,
      likesData,
    );
  }

  private _examRefactorSingle(
    exam: Exam,
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    const base = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      area: exam.area,
      tema: exam.tema,
      difficulty: exam.difficulty,
      totalQuestions: exam.totalQuestions,
      creatorName: exam.user?.name || 'Anónimo',
      likesCount: likesData?.counts?.get(exam.id) || 0,
      userLiked: likesData?.userLiked?.has(exam.id) || false,
      canDelete: userId ? exam.userId === userId : false,
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
          context: q.context || '',
          question: q.question,
          explanation: q.explanation || '',
          contextGroupId: q.contextGroupId,
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

  async getPublicExamsDeck(userId?: number) {
    const exams = await this.examRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    const filtered = exams.filter((exam) => isPublicAccess(exam.acceso));
    const examIds = filtered.map((e) => e.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'exam',
      examIds,
    );
    const userLikedSet = userId
      ? await this.likesService.getUserLikedCards('exam', userId, examIds)
      : new Set<number>();
    const result = this.examRefactor(filtered, userId, false, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    return Array.isArray(result) ? shuffleArray(result) : result;
  }

  async getMyExamsDeck(userId: number) {
    const exams = await this.examRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    const examIds = exams.map((e) => e.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'exam',
      examIds,
    );
    const userLikedSet = await this.likesService.getUserLikedCards(
      'exam',
      userId,
      examIds,
    );
    const result = this.examRefactor(exams, userId, false, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    return Array.isArray(result) ? shuffleArray(result) : result;
  }

  async getExamByCode(code: string, userId?: number) {
    const exam = await this.examRepo.findOne({
      where: { code },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!exam) throw new NotFoundException('Exam not found');
    if (!isPublicAccess(exam.acceso)) {
      throw new UnauthorizedException('No tienes acceso a este quiz');
    }
    return this.examRefactor(exam, userId, true);
  }

  // ==================== INTELLIGENT SEARCH ====================

  async searchExams(
    query: string,
    userId?: number,
    limit: number = 20,
    offset: number = 0,
    searchInQuestions: boolean = true,
  ) {
    if (!query || query.trim().length === 0) {
      const exams = await this.examRepo.find({
        where: { acceso: 'publico' },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
      return this.examRefactor(exams, userId, false);
    }

    const normalizedQuery = query.trim().toLowerCase();

    const queryBuilder = this.examRepo
      .createQueryBuilder('exam')
      .leftJoin('exam.questions', 'questions')
      .where('LOWER(exam.title) LIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('LOWER(exam.description) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(exam.tema) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(exam.area) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('exam.code = :exactQuery', {
        exactQuery: normalizedQuery.toUpperCase(),
      });

    if (searchInQuestions) {
      queryBuilder.orWhere('LOWER(questions.question) LIKE :query', {
        query: `%${normalizedQuery}%`,
      });
    }

    if (!userId) {
      queryBuilder.andWhere('exam.acceso = :acceso', { acceso: 'publico' });
    } else {
      queryBuilder.andWhere(
        '(exam.acceso = :acceso OR exam.userId = :userId)',
        {
          acceso: 'publico',
          userId,
        },
      );
    }

    queryBuilder.orderBy('exam.createdAt', 'DESC').take(limit).skip(offset);

    const exams = await queryBuilder.getMany();

    if (exams.length > 0) {
      const examIds = exams.map((e) => e.id);
      const examsWithUsers = await this.examRepo.find({
        where: { id: In(examIds) },
        relations: ['user'],
      });
      return this.examRefactor(examsWithUsers, userId, false);
    }

    return this.examRefactor(exams, userId, false);
  }

  async deleteAll(
    userId: number,
  ): Promise<{ deleted: boolean; message: string }> {
    await this.examRepo.delete({ userId });
    return { deleted: true, message: 'All exams deleted' };
  }
}
