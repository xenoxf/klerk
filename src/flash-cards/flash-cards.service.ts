import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeminiService } from '../gemini/gemini.service';
import {
  CreditsService,
  calculateFlashcardCost,
} from '../credits/credits.service';
import { LikesService } from '../likes/likes.service';
import { FlashCard } from './entities/flash-card.entity';
import { Card } from './entities/card.entity';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';
import { CardResponse } from './types';
import {
  shuffleArray,
  isPublicAccess,
  normalizeAccess,
} from '../common/utils/shared.utils';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly creditsService: CreditsService,
    private readonly likesService: LikesService,
    @InjectRepository(FlashCard)
    private readonly flashCardRepo: Repository<FlashCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async generateFrom(input: GenerateFlashCardsDto, userId: number) {
    const dynamicCost = calculateFlashcardCost(input.quantity, input.reference);

    const creditStatus = await this.creditsService.consumeCredits(
      userId,
      'FLASHCARD_GENERATION',
      dynamicCost,
    );

    const response: CardResponse = await this.geminiService.generateFlashcards(
      input.reference,
      input.quantity,
    );

    const { title, description, area, tema } = response.metadata;

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

    const createdFlashCards = [];
    for (const flashCard of response.cards) {
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
      await this.flashCardRepo.save(fc);
      createdFlashCards.push(fc);
    }
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

  /**
   * Refactor de Card para frontend - solo datos necesarios para mostrar
   * Excluye: code, userId, acceso, createdAt (datos internos)
   * NOTA: Usa 'flashcards' (minuscula) para consistencia con el frontend
   */
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

  /**
   * Refactor para lista de decks - solo datos para listar
   */
  async deckRefactor(
    cards: Card[] | Card,
    userId?: number,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    if (Array.isArray(cards)) {
      return cards.map((card) => ({
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
      id: cards.id,
      title: cards.title,
      description: cards.description,
      area: cards.area,
      tema: cards.tema,
      creatorName: cards.user?.name || 'Anónimo',
      likesCount: likesData?.counts?.get(cards.id) || 0,
      userLiked: likesData?.userLiked?.has(cards.id) || false,
      canDelete: userId ? cards.userId === userId : false,
      totalCards: cards.flashcards?.length || 0,
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

  /**
   * Get card in locked format - ONLY for owner
   */
  async getLockedCard(id: number, userId: number) {
    const card = await this.cardRepo.findOne({
      where: { id },
      relations: ['flashcards', 'user'],
    });
    if (!card) throw new NotFoundException('Card not found');

    // ONLY the owner can access locked format
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
      for (const flash of payload.flashcards) {
        await this.flashCardRepo.save(
          this.flashCardRepo.create({
            front: flash.front,
            back: flash.back,
            hint: flash.hint ?? null,
            card,
            userId,
          }),
        );
      }
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

  // ==================== INTELLIGENT SEARCH ====================

  /**
   * Búsqueda inteligente de flashcards con soporte para:
   * - Búsqueda por texto en título, descripción, tema y área
   * - Búsqueda por código exacto
   * - Búsqueda en el frente y reverso de las tarjetas
   * - Paginación con offset y limit (20 items por página)
   */
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
