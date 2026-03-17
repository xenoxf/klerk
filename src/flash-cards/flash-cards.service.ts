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
import { CardResponse } from './types';
import { title } from 'process';

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
        userId,
      });
      const savedCard = await this.cardRepo.save(card);

      // Crear los FlashCard hijos
      const createdFlashCards = [];
      for (const flashCard of response.cards) {
        const fc = this.flashCardRepo.create({
          front: flashCard.front,
          back: flashCard.back,
          hint: flashCard.hint || null,
          card: savedCard,
          userId,
        });
        await this.flashCardRepo.save(fc);
        createdFlashCards.push(fc);
      }

      return {message: 'Creadaaa, pruebalas'}

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
      const response: CardResponse = await this.groqService.generateFlashcardsFromReference(
        input.referenceText,
        input.quantity,
      );

      if (!response.cards || !Array.isArray(response.cards)) {
        throw new BadRequestException('Invalid AI response');
      }

      

      const card = this.cardRepo.create({
        title: response.metadata.title,
        description: response.metadata.description,
        tema: response.metadata.tema,
        area: response.metadata.area,
        userId,
        code: await this.generateCode(),
        acceso: input.acceso
      });
      const savedCard = await this.cardRepo.save(card);

      // Crear los FlashCard hijos
      // Crear los FlashCard hijos
      const createdFlashCards = [];
      for (const flashCard of response.cards) {
        const fc = this.flashCardRepo.create({
          front: flashCard.front,
          back: flashCard.back,
          hint: flashCard.hint || null,
          card: savedCard,
          userId,
        });
        await this.flashCardRepo.save(fc);
        createdFlashCards.push(fc);
      }
      return {message: 'Creadaaa, pruebalas'}
    } catch (error) {
      throw new BadRequestException(
        `Error generating flashcards from reference: ${error.message}`,
      );
    }
  }

  async findCardById(id: number, userId: number) {
    return this.cardRepo.findOne({
      where: { id, userId },
      relations: ['flashCards'],
    });
  }

  async generateCode() {
    // debe tener 5 caracteres de letras mayúsculas y números
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.cardRepo.findOne({ where: { code } });
    if (existing) {
      return this.generateCode(); // Regenerar si ya existe
    }
    return code;
  }

  async deckRefactor(cards: Card[] | Card) {
    if (Array.isArray(cards)) {
      return cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        code: card.code,
      }));
    }
    return {
      id: cards.id,
      title: cards.title,
      description: cards.description,
      code: cards.code,
    };
  }

  async findPublicCardsDeck() {
    const cards = await this.cardRepo.find({
      where: {acceso: 'public'}
    })

    return this.deckRefactor(cards);
  }

  // |

  async findOne(id: number, userId: number) {
    const card = await this.cardRepo.findOne({
      where: {id, userId}
    });
    if (!card) throw new NotFoundException('Card not found');
    return this.deckRefactor(card);
  }

  async findMyCardsDeck(userId: number) {
    const cards = await this.cardRepo.find({
      where: {userId },
      order: { createdAt: 'DESC' },
    })
    return this.deckRefactor(cards);
  }

  async remove(id: number, userId: number) {
    const cards = await this.findCardById(id, userId);
    if (!cards) throw new NotFoundException('Cards not found');
    await this.cardRepo.delete(id);
    return { message: 'Eliminado correctamente' };
  }

  async getCardByCode(code: string) {
    const card = await this.cardRepo.findOne({
      where: { code },
      relations: ['flashCards'],
    });
    if (!card) throw new NotFoundException('Card not found');
    return this.deckRefactor(card);
  }
}
