import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { FlashCard } from './entities/flash-card.entity';
import {
  CreditsService,
  calculateFlashcardCost,
} from '../credits/credits.service';
import { GeminiService, CardResponse } from '../gemini/gemini.service';
import { LikesService } from '../likes/likes.service';
import {
  isPublicAccess,
  normalizeAccess,
  shuffleArray,
} from '../common/utils/shared.utils';

@Injectable()
export class FlashCardsService {
  constructor(
    @InjectRepository(Card)
    private cardRepo: Repository<Card>,
    @InjectRepository(FlashCard)
    private flashCardRepo: Repository<FlashCard>,
    private creditsService: CreditsService,
    private geminiService: GeminiService,
    private likesService: LikesService,
  ) {}

  async generate(
    input: {
      reference: string;
      quantity: number;
      acceso?: string;
    },
    userId: number,
  ) {
    const isPublic = normalizeAccess(input.acceso) === 'publico';
    let dynamicCost = calculateFlashcardCost(input.quantity, input.reference);

    if (isPublic) {
      dynamicCost = Math.ceil(dynamicCost * 0.5);
    }

    const creditStatus = await this.creditsService.consumeCredits(
      userId,
      'FLASHCARD_GENERATION',
      dynamicCost,
    );

    const response: CardResponse = await this.geminiService.generateFlashcards(
      input.reference,
      input.quantity,
    );

    const metadata = response.metadata || { title: 'Mazo', description: '' };
    const title = metadata.title || 'Mazo de Flashcards';
    const description = metadata.description || '';
    const area = metadata.area || '';
    const tema = metadata.tema || '';

    const card = this.cardRepo.create({
      area,
      title,
      description,
      tema,
      userId,
      code: await this.generateCode(),
      acceso: normalizeAccess(input.acceso),
    });
    const savedCard = await this.cardRepo.save(card);

    const cards = response.cards || [];
    const createdFlashCards = await Promise.all(
      cards.map((flashCard) => {
        if (!flashCard.front || !flashCard.back) {
          throw new Error('Flashcard generada sin frente o reverso.');
        }

        const fc = this.flashCardRepo.create({
          front: flashCard.front,
          back: flashCard.back,
          hint: flashCard.hint || null,
          card: savedCard,
          userId,
        });
        return this.flashCardRepo.save(fc);
      }),
    );

    return {
      message: 'Flashcards creadas exitosamente',
      cardId: savedCard.id,
      totalCards: createdFlashCards.length,
      creditsRemaining: creditStatus.remaining,
      creditsTotal: creditStatus.total,
    };
  }

  async findCardById(id: number, userId: number) {
    return this.cardRepo.findOne({
      where: { id, userId },
      relations: ['flashcards'],
    });
  }

  async generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.cardRepo.findOne({ where: { code } });
    if (existing) return this.generateCode();
    return code;
  }

  klekRefactor(card: Card) {
    return {
      id: card.id,
      area: card.area,
      title: card.title,
      description: card.description,
      tema: card.tema,
      flashcards: card.flashcards.map((flash) => ({
        id: flash.id,
        front: flash.front,
        back: flash.back,
        hint: flash.hint,
      })),
    };
  }

  async deckRefactor(
    cards: Card[] | Card,
    userId?: number,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    if (Array.isArray(cards)) {
      return (cards as Card[]).map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        area: card.area,
        tema: card.tema,
        creatorName: card.user?.name || 'Anónimo',
        likesCount: likesData?.counts?.get(card.id) || 0,
        userLiked: likesData?.userLiked?.has(card.id) || false,
        canDelete: userId ? card.userId === userId : false,
        totalCards: card.flashcards?.length || 0,
      }));
    }
    return {
      id: (cards as Card).id,
      title: (cards as Card).title,
      description: (cards as Card).description,
      area: (cards as Card).area,
      tema: (cards as Card).tema,
      creatorName: (cards as Card).user?.name || 'Anónimo',
      likesCount: likesData?.counts?.get((cards as Card).id) || 0,
      userLiked: likesData?.userLiked?.has((cards as Card).id) || false,
      canDelete: userId ? (cards as Card).userId === userId : false,
      totalCards: (cards as Card).flashcards?.length || 0,
    };
  }

  async findPublicCardsDeck(userId?: number) {
    const cards = await this.cardRepo.find({
      relations: ['flashcards', 'user'],
    });
    const filtered = cards.filter((card) => isPublicAccess(card.acceso));
    const cardIds = filtered.map((c) => c.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'card',
      cardIds,
    );
    const userLikedSet = userId
      ? await this.likesService.getUserLikedCards('card', userId, cardIds)
      : new Set<number>();
    const result = this.deckRefactor(filtered, userId, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    return Array.isArray(result) ? shuffleArray(result) : result;
  }

  async findMyCardsDeck(userId: number) {
    const cards = await this.cardRepo.find({
      where: { userId },
      relations: ['flashcards', 'user'],
      order: { createdAt: 'DESC' },
    });
    const cardIds = cards.map((c) => c.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'card',
      cardIds,
    );
    const userLikedSet = await this.likesService.getUserLikedCards(
      'card',
      userId,
      cardIds,
    );
    const result = this.deckRefactor(cards, userId, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    return Array.isArray(result) ? shuffleArray(result) : result;
  }

  async returnIdByCard(id: number, userId: number) {
    const card = await this.cardRepo.findOneBy({ id, userId });
    return card?.id;
  }

  async remove(id: number, userId: number) {
    const card = await this.cardRepo.findOne({ where: { id, userId } });
    if (!card)
      throw new NotFoundException('Card not found or not owned by user');
    await this.cardRepo.delete(id);
    return { message: 'Eliminado correctamente' };
  }

  async getCardByCode(code: string, userId?: number) {
    const card = await this.cardRepo.findOne({
      where: { code },
      relations: ['flashcards'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!isPublicAccess(card.acceso) && card.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este mazo');
    }
    return this.klekRefactor(card);
  }

  async getCardKlekById(id: number, userId: number) {
    const card = await this.cardRepo.findOne({
      where: { id },
      relations: ['flashcards', 'user'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!isPublicAccess(card.acceso)) {
      if (userId === card.userId) {
        return this.klekRefactor(card);
      } else throw new UnauthorizedException('No tienes acceso a este lugar');
    } else {
      return this.klekRefactor(card);
    }
  }

  async getLockedCard(id: number, userId: number) {
    const card = await this.cardRepo.findOne({
      where: { id },
      relations: ['flashcards', 'user'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (card.userId !== userId) {
      throw new UnauthorizedException('No tienes permiso para ver este mazo');
    }
    return this.klekRefactor(card);
  }

  async getCardById(id: number, userId?: number) {
    const card = await this.cardRepo.findOne({
      where: { id },
      relations: ['flashcards'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!isPublicAccess(card.acceso) && card.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a este mazo');
    }
    return this.klekRefactor(card);
  }

  async create(
    payload: {
      title: string;
      description?: string;
      tema?: string;
      area?: string;
      acceso?: string;
      flashcards?: Array<{ front: string; back: string; hint?: string }>;
    },
    userId: number,
  ) {
    if (!payload?.title?.trim()) {
      throw new BadRequestException('El título es requerido');
    }

    const card = await this.cardRepo.save(
      this.cardRepo.create({
        title: payload.title.trim(),
        description: payload.description ?? '',
        tema: payload.tema ?? '',
        area: payload.area ?? '',
        acceso: normalizeAccess(payload.acceso),
        code: await this.generateCode(),
        userId,
      }),
    );

    if (Array.isArray(payload.flashcards) && payload.flashcards.length > 0) {
      await Promise.all(
        payload.flashcards.map((flash) => {
          return this.flashCardRepo.save(
            this.flashCardRepo.create({
              front: flash.front,
              back: flash.back,
              hint: flash.hint ?? null,
              card,
              userId,
            }),
          );
        }),
      );
    }

    return this.getCardById(card.id, userId);
  }

  async update(
    id: number,
    payload: {
      title?: string;
      description?: string;
      tema?: string;
      area?: string;
      acceso?: string;
    },
    userId: number,
  ) {
    const card = await this.cardRepo.findOneBy({ id, userId });
    if (!card) throw new NotFoundException('Card not found');
    await this.cardRepo.update(id, {
      title: payload.title ?? card.title,
      description: payload.description ?? card.description,
      tema: payload.tema ?? card.tema,
      area: payload.area ?? card.area,
      acceso: payload.acceso ?? card.acceso,
    });
    return this.getCardById(id, userId);
  }

  async searchFlashCards(
    query: string,
    userId?: number,
    limit: number = 20,
    offset: number = 0,
    searchInCards: boolean = true,
  ) {
    if (!query || query.trim().length === 0) {
      const cards = await this.cardRepo.find({
        where: { acceso: 'publico' },
        relations: ['user', 'flashcards'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
      return this.deckRefactor(cards, userId);
    }

    const normalizedQuery = query.trim().toLowerCase();

    const queryBuilder = this.cardRepo
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.flashcards', 'flashcards')
      .where('LOWER(card.title) LIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('LOWER(card.description) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(card.tema) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(card.area) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('card.code = :exactQuery', {
        exactQuery: normalizedQuery.toUpperCase(),
      });

    if (searchInCards) {
      queryBuilder
        .orWhere('LOWER(flashcards.front) LIKE :query', {
          query: `%${normalizedQuery}%`,
        })
        .orWhere('LOWER(flashcards.back) LIKE :query', {
          query: `%${normalizedQuery}%`,
        });
    }

    if (!userId) {
      queryBuilder.andWhere('card.acceso = :acceso', { acceso: 'publico' });
    } else {
      queryBuilder.andWhere(
        '(card.acceso = :acceso OR card.userId = :userId)',
        {
          acceso: 'publico',
          userId,
        },
      );
    }

    queryBuilder.orderBy('card.createdAt', 'DESC').take(limit).skip(offset);

    const cards = await queryBuilder.getMany();
    return this.deckRefactor(cards, userId);
  }

  async deleteAll(
    userId: number,
  ): Promise<{ deleted: boolean; message: string }> {
    await this.cardRepo.delete({ userId });
    return { deleted: true, message: 'All flashcards deleted' };
  }
}
