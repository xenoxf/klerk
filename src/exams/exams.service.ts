import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/examQuestion.entity';
import { ExamOption } from './entities/exam-option.entity';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { GeminiService } from '../gemini/gemini.service';
import { CreditsService, calculateExamCost } from '../credits/credits.service';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private questionRepo: Repository<ExamQuestion>,
    @InjectRepository(ExamOption) private optionRepo: Repository<ExamOption>,
    private readonly geminiService: GeminiService,
    private readonly creditsService: CreditsService,
  ) { }

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
      createdAt: new Date().toISOString(),
      acceso: this.normalizeAccess(input.acceso),
      code: await this.generateCode(),
    });

    const savedExam = await this.examRepo.save(exam);

    for (const q of questions) {
      const question = this.questionRepo.create({
        question: q.question,
        explanation: q.explanation || '',
        exam: savedExam,
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
      message: 'Examen generado exitosamente',
      examId: savedExam.id,
      totalQuestions: savedExam.totalQuestions,
      creditsRemaining: creditStatus.remaining,
      creditsTotal: creditStatus.total,
    };
  }
  // ==================== BASIC CRUD ====================

  private isPublicAccess(acceso?: string | null): boolean {
    const normalized = (acceso ?? '').toLowerCase();
    return normalized === 'public' || normalized === 'publico';
  }

  /** Normaliza el acceso a 'publico' o 'privado' (valores de la BD) */
  private normalizeAccess(acceso?: string): string {
    if (!acceso) return 'privado';
    const normalized = acceso.toLowerCase().trim();
    if (normalized === 'public' || normalized === 'publico') return 'publico';
    return 'privado';
  }

  async generateCode() {
    // debe tener 5 caracteres de letras mayúsculas y números
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.examRepo.findOne({ where: { code } });
    if (existing) {
      return this.generateCode(); // Regenerar si ya existe
    }
    return code;
  }
  async getById(id: number, userId: number) {
    const exam = await this.examRepo.findOne({
      where: { id, userId },
      relations: ['questions', 'questions.options'],
    });

    if (!exam) throw new NotFoundException('Exam not found');
    return this.examRefactor(exam, userId, true);
  }

  async getByIdWithAccess(id: number, userId?: number) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options'],
    });
    if (!exam) throw new NotFoundException('Exam not found');
    if (!this.isPublicAccess(exam.acceso) && exam.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este quiz');
    }
    // Devuelve con preguntas y opciones (sin isCorrect)
    return this.examRefactor(exam, userId, true);
  }

  /**
   * Get exam for playing (klek format) - always includes questions
   * This is different from deck format which is just metadata
   */
  async getByIdForPlay(id: number, userId: number) {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'user'],
    });
    if (!exam) throw new NotFoundException('Exam not found');

    // Check ownership or public access
    if (!this.isPublicAccess(exam.acceso) && exam.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este quiz');
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
    await this.questionRepo.delete({ exam: { id } } as any);
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
      acceso: this.normalizeAccess(payload.acceso),
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

  // ==================== REFACTOR DECKS (OPTIMIZAR DATOS) ====================

  /**
   * Refactor de Exam para frontend - solo datos necesarios para mostrar
   * Excluye: code, userId, score (datos internos)
   * Para preguntas: solo texto, sin opciones ni isCorrect
   */
  async examRefactor(
    exams: Exam[] | Exam,
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
  ) {
    if (Array.isArray(exams)) {
      return exams.map((exam) =>
        this._examRefactorSingle(exam, userId, includeQuestionsAndOptions),
      );
    }
    return this._examRefactorSingle(exams, userId, includeQuestionsAndOptions);
  }

  private _examRefactorSingle(
    exam: Exam,
    userId?: number,
    includeQuestionsAndOptions: boolean = false,
  ) {
    const base = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      area: exam.area,
      tema: exam.tema,
      difficulty: exam.difficulty,
      totalQuestions: exam.totalQuestions,
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

    return {
      ...base,
      questions: [],
    };
  }

  async getPublicExamsDeck(userId?: number) {
    const exams = await this.examRepo.find({
      order: { createdAt: 'DESC' },
    });
    const filtered = exams.filter((exam) => this.isPublicAccess(exam.acceso));
    const result = this.examRefactor(filtered, userId);
    // Randomize order
    return Array.isArray(result) ? this.shuffleArray(result) : result;
  }

  async getMyExamsDeck(userId: number) {
    const exams = await this.examRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const result = this.examRefactor(exams, userId);
    // Randomize order
    return Array.isArray(result) ? this.shuffleArray(result) : result;
  }

  // Helper method to shuffle array (Fisher-Yates)
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async getExamByCode(code: string, userId?: number) {
    const exam = await this.examRepo.findOne({
      where: { code },
      relations: ['questions', 'questions.options'],
    });
    if (!exam) throw new NotFoundException('Exam not found');
    if (!this.isPublicAccess(exam.acceso)) {
      throw new UnauthorizedException('No tienes acceso a este quiz');
    }
    // Devuelve con preguntas y opciones (sin isCorrect)
    return this.examRefactor(exam, userId, true);
  }

  // ==================== INTELLIGENT SEARCH ====================

  /**
   * Búsqueda inteligente de exámenes con soporte para:
   * - Búsqueda por texto en título, descripción, tema y área
   * - Búsqueda por código exacto
   * - Búsqueda en preguntas (opcional)
   * - Paginación con offset y limit (20 items por página)
   * - Filtro por visibilidad (público/privado)
   */
  async searchExams(
    query: string,
    userId?: number,
    limit: number = 20,
    offset: number = 0,
    searchInQuestions: boolean = true,
  ) {
    if (!query || query.trim().length === 0) {
      // Si no hay query, devolver exámenes públicos por defecto
      const exams = await this.examRepo.find({
        where: { acceso: 'publico' },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
      return this.examRefactor(exams, userId, false);
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Construir query para búsqueda en múltiples campos
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

    // Búsqueda en preguntas si está habilitado
    if (searchInQuestions) {
      queryBuilder.orWhere('LOWER(questions.question) LIKE :query', {
        query: `%${normalizedQuery}%`,
      });
    }

    // Filtrar solo públicos si no hay userId
    if (!userId) {
      queryBuilder.andWhere('exam.acceso = :acceso', { acceso: 'publico' });
    } else {
      // Si hay userId, mostrar públicos y privados del usuario
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

    // Si searchInQuestions está activo, necesitamos cargar las preguntas explícitamente
    if (searchInQuestions && exams.length > 0) {
      return this.examRefactor(exams, userId, false);
    }

    return this.examRefactor(exams, userId, false);
  }

  async deleteAll(userId: number): Promise<{ deleted: boolean; message: string }> {
    await this.examRepo.delete({ userId });
    return { deleted: true, message: 'All exams deleted' };
  }
}
