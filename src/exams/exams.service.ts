import { Injectable, BadRequestException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/examQuestion.entity';
import { ExamOption } from './entities/exam-option.entity';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamService {
  private groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  constructor(
    @InjectRepository(Exam)
    private examRepo: Repository<Exam>,

    @InjectRepository(ExamQuestion)
    private questionRepo: Repository<ExamQuestion>,

    @InjectRepository(ExamOption)
    private optionRepo: Repository<ExamOption>,
  ) {}

  private examPrompt(description: string, difficulty: string, number: number) {
    return `
Eres un generador de exámenes.

REGLAS:
- Genera EXACTAMENTE ${number} preguntas.
- Cada pregunta debe tener exactamente 4 opciones.
- Solo UNA opción debe tener "isCorrect": true.
- Devuelve SOLO JSON válido sin markdown.
- Tema: "${description}"
- Dificultad: ${difficulty}

FORMATO:
{
  "questions": [
    {
      "question": "texto",
      "options": [
        {"text": "A", "isCorrect": false},
        {"text": "B", "isCorrect": true},
        {"text": "C", "isCorrect": false},
        {"text": "D", "isCorrect": false}
      ]
    }
  ]
}
`;
  }

  async generateExam(userId: number, payload: CreateExamDto) {
    const {
      examPrompt,
      difficulty = 'medium',
      numberOfQuestions = 5,
    } = payload;

    if (!examPrompt)
      throw new BadRequestException('examPrompt es obligatorio.');

    if (numberOfQuestions <= 0)
      throw new BadRequestException('numberOfQuestions debe ser mayor a 0.');

    const prompt = this.examPrompt(examPrompt, difficulty, numberOfQuestions);

    let completion;
    try {
      completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un generador estricto de exámenes.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      });
    } catch (err) {
      throw new BadRequestException({
        message: 'Error llamando a Groq',
        detail: err?.message,
      });
    }

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) throw new BadRequestException('Groq devolvió vacío.');

    let parsed;
    try {
      parsed = JSON.parse(
        raw
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim(),
      );
    } catch {
      throw new BadRequestException({ message: 'JSON inválido.', raw });
    }

    if (!Array.isArray(parsed.questions))
      throw new BadRequestException('JSON inválido: falta "questions".');

    const questions = parsed.questions.slice(0, numberOfQuestions);

    // Validaciones detalladas
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4)
        throw new BadRequestException(
          `Pregunta #${i + 1} inválida: debe tener campo question y 4 opciones.`,
        );

      const correct = q.options.filter((o) => o.isCorrect === true);
      if (correct.length !== 1)
        throw new BadRequestException(
          `Pregunta #${i + 1} debe tener exactamente 1 opción correcta.`,
        );
    }

    const exam = this.examRepo.create({
      title: examPrompt,
      difficulty,
      numberOfQuestions,
      userId,
      questions: [],
    });

    for (const q of questions) {
      const questionEntity = this.questionRepo.create({
        question: q.question,
        options: q.options.map((opt) =>
          this.optionRepo.create({
            text: opt.text,
            isCorrect: !!opt.isCorrect,
          }),
        ),
      });

      exam.questions.push(questionEntity);
    }

    return await this.examRepo.save(exam);
  }

  async remove(id: number, userId: number) {
    const exam = await this.examRepo.findOneBy({ id, userId });
    if (!exam)
      throw new BadRequestException(
        'Examen no encontrado o no pertenece al usuario.',
      );

    await this.examRepo.delete({ id, userId });
    return { message: 'Examen eliminado' };
  }

  async findAll(userId: number) {
    return this.examRepo.find({
      where: { userId },
      relations: ['questions', 'questions.options'],
    });
  }

  async findExamById(id: number, userId: number) {
    return this.examRepo.findOne({
      where: { id, userId },
      relations: ['questions', 'questions.options'],
    });
  }
}
