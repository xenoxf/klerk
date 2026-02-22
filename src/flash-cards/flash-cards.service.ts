import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
//import { AI_PROMPTS } from '../groq/AI_PROMPTS';
import { FlashCard } from './entities/flash-card.entity';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(FlashCard)
    private readonly flashCardRepo: Repository<FlashCard>,
  ) {}

  async generateFromTopic(input: any, userId: number) {
    if (!input.topic || input.numberOfCards <= 0) {
      throw new BadRequestException('Topic and valid numberOfCards required');
    }

    try {
      const response = await this.groqService.generateFlashcardsFromTopic(
        input.topic,
        input.numberOfCards,
      );

      if (!response?.cards || !Array.isArray(response.cards)) {
        throw new BadRequestException('Invalid AI response');
      }

      const createdCards = [];
      for (const card of response.cards) {
        const flashCard = this.flashCardRepo.create({
          question: card.front || card.question || '',
          answer: card.back || card.answer || '',
          hint: card.hint || null,
          difficulty: (card.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
          tags: card.tags || [],
          userId,
        } as any);
        await this.flashCardRepo.save(flashCard);
        createdCards.push(flashCard);
      }

      return {
        success: true,
        totalCreated: createdCards.length,
        cards: createdCards,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error generating flashcards from topic: ${error.message}`,
      );
    }
  }

  async generateFromReference(input: any, userId: number) {
    if (!input.referenceText || input.numberOfCards <= 0) {
      throw new BadRequestException(
        'Reference text and numberOfCards required',
      );
    }

    try {
      const response = await this.groqService.generateFlashcardsFromReference(
        input.referenceText,
        input.numberOfCards,
      );

      if (!response?.cards || !Array.isArray(response.cards)) {
        throw new BadRequestException('Invalid AI response');
      }

      const createdCards = [];
      for (const card of response.cards) {
        const flashCard = this.flashCardRepo.create({
          question: card.front || card.question || '',
          answer: card.back || card.answer || '',
          hint: card.hint || null,
          difficulty: (card.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
          tags: card.tags || [],
          userId,
        } as any);
        await this.flashCardRepo.save(flashCard);
        createdCards.push(flashCard);
      }

      return {
        success: true,
        totalCreated: createdCards.length,
        cards: createdCards,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error generating flashcards from reference: ${error.message}`,
      );
    }
  }

  async findAll(userId: number) {
    return this.flashCardRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const flashCard = await this.flashCardRepo.findOne({
      where: { id, userId },
    });
    if (!flashCard) throw new NotFoundException('Flashcard not found');
    return flashCard;
  }

  async remove(id: number, userId: number) {
    const flashCard = await this.findOne(id, userId);
    if (!flashCard) throw new NotFoundException('Flashcard not found');
    await this.flashCardRepo.delete(id);
    return { message: 'Eliminado correctamente' };
  }
}
