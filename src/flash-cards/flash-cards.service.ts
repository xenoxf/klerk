import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
import { FlashCard } from './entities/flash-card.entity';
import { Card } from './entities/card.entity';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';
import { CardResponse } from './types';
import { title } from 'process';
import { map } from 'rxjs';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(FlashCard)
    private readonly flashCardRepo: Repository<FlashCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async generateFromReference(input: GenerateFlashCardsDto, userId: number) {
    try {
      const response: CardResponse =
        await this.groqService.generateFlashcardsFromReference(
          input.reference,
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
        acceso: input.acceso,
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
      return { message: 'Creadaaa, pruebalas' };
    } catch (error) {
      throw new BadRequestException(
        `Error generating flashcards from reference: ${error.message}`,
      );
    }
  }

  async findCardById(id: number, userId: number) {
    return this.cardRepo.findOne({
      where: { id, userId },
      relations: ['flashcards'],
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

  klekRefactor(card: Card) {
    return {
      id: card.id,
      area: card.area,
      title: card.title,
      flashCards: card.flashcards.map((flash) => ({
        front: flash.front,
        back: flash.back,
        id: flash.id,
      })),
    };
  }

  async deckRefactor(cards: Card[] | Card) {
    if (Array.isArray(cards)) {
      return cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        code: card.code,
        area: card.area,
      }));
    }
    return {
      id: cards.id,
      title: cards.title,
      description: cards.description,
      code: cards.code,
      area: cards.area,
    };
  }

  async findPublicCardsDeck() {
    const cards = await this.cardRepo.find({
      where: { acceso: 'public' },
      relations: ['flashcards'],
    });

    return this.deckRefactor(cards);
  }

  // |

  async findMyCardsDeck(userId: number) {
    const cards = await this.cardRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return this.deckRefactor(cards);
  }

  async returnIdByCard(id: number, userId: number) {
    const card = await this.cardRepo.findOneBy({ id, userId });
    return card.id;
  }

  async remove(id: number, userId: number) {
    const cards = await this.returnIdByCard(id, userId);
    if (!cards) throw new NotFoundException('Cards not found');
    await this.cardRepo.delete(id);
    return { message: 'Eliminado correctamente' };
  }

  async getCardByCode(code: string) {
    const card = await this.cardRepo.findOne({
      where: { code },
      relations: ['flashcards'],
    });
    if (!card) throw new NotFoundException('Card not found');
    return this.deckRefactor(card);
  }

  async getCardKlekById(id: number, userId: number) {
    const tuyo = await this.cardRepo.findOneBy({ id });
    if (!tuyo) throw new NotFoundException('Card not found');
    if (tuyo.acceso === 'private') {
      if (userId === tuyo.userId) {
        return this.klekRefactor(tuyo);
      } else throw new UnauthorizedException('No tienes acceso a este lugar');
    } else {
      return this.klekRefactor(tuyo);
    }
  }
}
