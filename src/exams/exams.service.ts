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
import { GroqService } from '../groq/groq.service';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private questionRepo: Repository<ExamQuestion>,
    @InjectRepository(ExamOption) private optionRepo: Repository<ExamOption>,
    private readonly groqService: GroqService,
  ) {}

  // ==================== GENERATE EXAM FROM TOPIC ====================

  async generateExam(input: GenerateExamDto, userId: number) {
    try {
      const response = await this.groqService.generateExam(
        input.topic,
        input.numberOfQuestions,
        input.difficulty,
      );

      const { questions } = response.questions;
      const { title, description, tema, area } = response.metadata;

      const exam = this.examRepo.create({
        area,
        tema,
        title,
        description,
        difficulty: input.difficulty,
        userId,
        totalQuestions: input.numberOfQuestions,
        createdAt: new Date().toISOString(),
        acceso: input.acceso,
        code: await this.generateCode(),
      });

      const savedExam = await this.examRepo.save(exam);

      for (const q of questions) {
        if (!q.question || !Array.isArray(q.options)) {
          throw new BadRequestException('Invalid question format from AI');
        }

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

      return { message: 'Examen generado, respondelo ya¡¡¡' };
    } catch (error) {
      throw new BadRequestException(`Error generating exam: ${error.message}`);
    }
  }
  // ==================== BASIC CRUD ====================

  private isPublicAccess(acceso?: string | null): boolean {
    const normalized = (acceso ?? '').toLowerCase();
    return normalized === 'public' || normalized === 'publico';
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
  async getAll(userId: number) {
    return this.examRepo.find({
      where: { userId },
      relations: ['questions', 'questions.options'],
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: number, userId: number) {
    const exam = await this.examRepo.findOne({
      where: { id, userId },
      relations: ['questions', 'questions.options'],
    });

    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
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
    return exam;
  }

  async updateExamScore(query: UpdateExamDto, userId: number) {
    const examReferido = this.getById(query.id, userId);
    if (!examReferido) throw new NotFoundException('Exam not found');
    this.examRepo.update(query.id, { score: query.score });
    return this.getAll(userId);
  }

  async delete(id: number, userId: number) {
    const exam = await this.getById(id, userId);
    if (!exam) throw new NotFoundException('Exam not found');
    await this.questionRepo.delete({ exam: { id } } as any);
    await this.examRepo.delete(id);
    return { message: 'Exam deleted' };
  }

  // ==================== REFACTOR DECKS (OPTIMIZAR DATOS) ====================
  async examRefactor(exams: Exam[] | Exam) {
    if (Array.isArray(exams)) {
      return exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        difficulty: exam.difficulty,
      }));
    }
    return {
      id: exams.id,
      title: exams.title,
      difficulty: exams.difficulty,
      description: exams.description,
    };
  }

  async getPublicExamsDeck() {
    const exams = await this.examRepo.find({
      order: { createdAt: 'DESC' },
    });
    return this.examRefactor(
      exams.filter((exam) => this.isPublicAccess(exam.acceso)),
    );
  }

  async getMyExamsDeck(userId: number) {
    const exams = await this.examRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return this.examRefactor(exams);
  }

  async getExamByCode(code: string) {
    const exam = await this.examRepo.findOne({
      where: { code },
      relations: ['questions', 'questions.options'],
    });
    if (!exam) throw new NotFoundException('Exam not found');
    if (!this.isPublicAccess(exam.acceso)) {
      throw new UnauthorizedException('No tienes acceso a este quiz');
    }
    return this.examRefactor(exam);
  }
}
