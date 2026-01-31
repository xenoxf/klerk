import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/examQuestion.entity';
import { ExamOption } from './entities/exam-option.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { GroqService } from '../groq/groq.service';

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

  async generateExamFromTopic(input: CreateExamDto, userId: number) {
    if (!input.topic || input.numberOfQuestions <= 0) {
      throw new BadRequestException(
        'Topic and valid numberOfQuestions are required',
      );
    }

    if (!['easy', 'medium', 'hard'].includes(input.difficulty)) {
      throw new BadRequestException('Invalid difficulty level');
    }

    try {
      const response = await this.groqService.generateExamFromTopic(
        input.topic,
        input.numberOfQuestions,
        input.difficulty,
      );

      if (!response || typeof response !== 'object') {
        throw new BadRequestException('Invalid AI response format');
      }

      const { title, description, questions } = response as any;

      if (
        !title ||
        !questions ||
        !Array.isArray(questions) ||
        questions.length === 0
      ) {
        throw new BadRequestException('AI response missing required fields');
      }

      const exam = this.examRepo.create({
        title,
        description: description || `Exam about ${input.topic}`,
        difficulty: input.difficulty,
        userId,
        totalQuestions: input.numberOfQuestions,
        createdAt: new Date().toISOString(),
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

      return savedExam;
    } catch (error) {
      throw new BadRequestException(`Error generating exam: ${error.message}`);
    }
  }

  // ==================== GENERATE EXAM FROM REFERENCIA ====================
  async generateExamFromReference(input: CreateExamDto, userId: number) {
    if (!input.reference || input.numberOfQuestions <= 0) {
      throw new BadRequestException(
        'Reference text and valid numberOfQuestions are required',
      );
    }

    if (!['easy', 'medium', 'hard'].includes(input.difficulty)) {
      throw new BadRequestException('Invalid difficulty level');
    }

    try {
      const response = await this.groqService.generateExamFromReference(
        input.reference,
        input.numberOfQuestions,
        input.difficulty,
      );

      if (!response || typeof response !== 'object') {
        throw new BadRequestException('Invalid AI response format');
      }

      const { title, description, questions } = response as any;

      if (
        !title ||
        !questions ||
        !Array.isArray(questions) ||
        questions.length === 0
      ) {
        throw new BadRequestException('AI response missing required fields');
      }

      const exam = this.examRepo.create({
        title,
        description: description || 'Exam generated from reference text',
        difficulty: input.difficulty,
        userId,
        totalQuestions: input.numberOfQuestions,
        createdAt: new Date().toISOString(),
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

      return savedExam;
    } catch (error) {
      throw new BadRequestException(
        `Error generating exam from reference: ${error.message}`,
      );
    }
  }

  // ==================== BASIC CRUD ====================

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

  async delete(id: number, userId: number) {
    const exam = await this.getById(id, userId);
    await this.questionRepo.delete({ exam: { id } } as any);
    await this.examRepo.delete(id);
    return { message: 'Exam deleted' };
  }
}
