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
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(FlashCard)
    private readonly flashCardRepo: Repository<FlashCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async generateFromTopic(input: GenerateFlashCardsDto, userId: number) {
    if (!input.topic || input.quantity <= 0) {
      throw new BadRequestException('Topic and valid quantity required');
    }

    try {
      const response = await this.groqService.generateFlashcardsFromTopic(
        input.topic,
        input.quantity,
      );

      if (!response?.cards || !Array.isArray(response.cards)) {
        throw new BadRequestException('Invalid AI response');
      }

      // Generar título y descripción por IA
      const title = await this.groqService.generateFlashcardTitle(input.topic);
      const description = await this.groqService.generateFlashcardDescription(
        input.topic,
        input.quantity,
      );

      // Crear el Card padre con título y descripción
      const card = this.cardRepo.create({
        title,
        description,
        totalCards: input.quantity,
        reviewedCards: 0,
        userId,
      });
      const savedCard = await this.cardRepo.save(card);

      // Crear los FlashCard hijos
      const createdFlashCards = [];
      for (const flashCard of response.cards) {
        const fc = this.flashCardRepo.create({
          front: flashCard.front || flashCard.question || '',
          back: flashCard.back || flashCard.answer || '',
          hint: flashCard.hint || null,
          difficulty: flashCard.difficulty || 'medium',
          cardId: savedCard.id,
          userId,
        });
        await this.flashCardRepo.save(fc);
        createdFlashCards.push(fc);
      }

      return {
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

  async generateFromReference(input: GenerateFlashCardsDto, userId: number) {
    if (!input.referenceText || input.quantity <= 0) {
      throw new BadRequestException(
        'Reference text and quantity required',
      );
    }

    try {
      const response = await this.groqService.generateFlashcardsFromReference(
        input.referenceText,
        input.quantity,
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
        input.quantity,
      );

      // Crear el Card padre con título y descripción
      const card = this.cardRepo.create({
        title,
        description,
        totalCards: input.quantity,
        reviewedCards: 0,
        userId,
      });
      const savedCard = await this.cardRepo.save(card);

      // Crear los FlashCard hijos
      const createdFlashCards = [];
      for (const flashCard of response.cards) {
        const fc = this.flashCardRepo.create({
          front: flashCard.front || flashCard.question || '',
          back: flashCard.back || flashCard.answer || '',
          hint: flashCard.hint || null,
          difficulty: flashCard.difficulty || 'medium',
          cardId: savedCard.id,
          userId,
        });
        await this.flashCardRepo.save(fc);
        createdFlashCards.push(fc);
      }

      return {
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
  async findAllCards(userId: number) {
    return this.cardRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findCardById(id: number, userId: number) {
    return this.cardRepo.findOne({
      where: { id, userId },
      relations: ['flashCards'],
    });
  }

  async remove(id: number, userId: number) {
    const cards = await this.findCardById(id, userId);
    if (!cards) throw new NotFoundException('Cards not found');
    await this.cardRepo.delete(id);
    return { message: 'Eliminado correctamente' };
  }
}
