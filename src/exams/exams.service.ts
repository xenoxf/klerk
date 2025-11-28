import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private examsRepo: Repository<Exam>,
  ) {}

  async create(input: { title: string; description: string }, userId: number) {
    if (!input.title) throw new BadRequestException('Title is required');

    const exam = this.examsRepo.create({
      title: input.title,
      description: input.description,
      totalQuestions: 0,
      userId,
    });

    return this.examsRepo.save(exam);
  }

  async getAll(filters: { search?: string; sort?: string; page?: number; limit?: number }, userId: number) {
    const query = this.examsRepo.createQueryBuilder('exam').where('exam.userId = :userId', { userId });

    if (filters.search) {
      const q = `%${filters.search.toLowerCase()}%`;
      query.andWhere('LOWER(exam.title) LIKE :search', { search: q });
    }

    if (filters.sort === 'newest') {
      query.orderBy('exam.createdAt', 'DESC');
    } else if (filters.sort === 'oldest') {
      query.orderBy('exam.createdAt', 'ASC');
    } else if (filters.sort === 'byScore') {
      query.orderBy('exam.score', 'DESC');
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    return query.skip(skip).take(limit).getMany();
  }

  async getById(id: number, userId: number) {
    const exam = await this.examsRepo.findOne({
      where: { id, userId },
      relations: ['questions'],
    });

    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async update(id: number, input: { title?: string; description?: string }, userId: number) {
    const exam = await this.getById(id, userId);

    if (input.title) exam.title = input.title;
    if (input.description) exam.description = input.description;
    exam.updatedAt = new Date();

    return this.examsRepo.save(exam);
  }

  async delete(id: number, userId: number) {
    const exam = await this.examsRepo.findOne({
      where: { id, userId },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    await this.examsRepo.delete(id);
    return { message: 'Exam deleted' };
  }

  async addQuestion(
    examId: number,
    input: { question: string; options: string[]; correctOptionIndex: number; explanation?: string },
    userId: number
  ) {
    const exam = await this.getById(examId, userId);

    const newQuestion = {
      id: Math.random(),
      question: input.question,
      options: input.options.map((text, index) => ({
        id: Math.random(),
        text,
        isCorrect: index === input.correctOptionIndex,
      })),
      correctOption: input.correctOptionIndex,
      explanation: input.explanation,
      examId,
    };

    exam.totalQuestions = (exam.totalQuestions || 0) + 1;
    exam.updatedAt = new Date();

    await this.examsRepo.save(exam);

    return newQuestion;
  }
}
