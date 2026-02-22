import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
import { FlashCard } from './entities/flash-card.entity';
import { Card } from './entities/card.entity';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(FlashCard)
    private readonly flashCardRepo: Repository<FlashCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
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

      // Generar título y descripción por IA
      const title = await this.groqService.generateFlashcardTitle(input.topic);
      const description = await this.groqService.generateFlashcardDescription(
        input.topic,
        input.numberOfCards,
      );

      // Crear el Card padre con título y descripción
      const card = this.cardRepo.create({
        title,
        description,
        totalCards: input.numberOfCards,
        reviewedCards: 0,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedCard = await this.cardRepo.save(card);

      // Crear los FlashCard hijos
      const createdFlashCards = [];
      for (const flashCard of response.cards) {
        const fc = this.flashCardRepo.create({
          question: flashCard.front || flashCard.question || '',
          answer: flashCard.back || flashCard.answer || '',
          hint: flashCard.hint || null,
          difficulty: (flashCard.difficulty ||
            'medium') as 'easy' | 'medium' | 'hard',
          tags: flashCard.tags || [],
          cardId: savedCard.id,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await this.flashCardRepo.save(fc);
        createdFlashCards.push(fc);
      }

      return {
        success: true,
        card: savedCard,
        totalCreated: createdFlashCards.length,
        flashcards: createdFlashCards,
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

      // Generar título y descripción por IA
      const title = await this.groqService.generateFlashcardTitle(
        'Reference-based Flashcards',
      );
      const description = await this.groqService.generateFlashcardDescription(
        'From Reference',
        input.numberOfCards,
      );

      // Crear el Card padre con título y descripción
      const card = this.cardRepo.create({
        title,
        description,
        totalCards: input.numberOfCards,
        reviewedCards: 0,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const savedCard = await this.cardRepo.save(card);

      // Crear los FlashCard hijos
      const createdFlashCards = [];
      for (const flashCard of response.cards) {
        const fc = this.flashCardRepo.create({
          question: flashCard.front || flashCard.question || '',
          answer: flashCard.back || flashCard.answer || '',
          hint: flashCard.hint || null,
          difficulty: (flashCard.difficulty ||
            'medium') as 'easy' | 'medium' | 'hard',
          tags: flashCard.tags || [],
          cardId: savedCard.id,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await this.flashCardRepo.save(fc);
        createdFlashCards.push(fc);
      }

      return {
        success: true,
        card: savedCard,
        totalCreated: createdFlashCards.length,
        flashcards: createdFlashCards,
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
