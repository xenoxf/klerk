import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService, GroqApiError } from '../groq/groq.service';
import { CreditsService } from '../credits/credits.service';
import { FlashCard } from './entities/flash-card.entity';
import { Card } from './entities/card.entity';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';
import { CardResponse } from './types';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    private readonly creditsService: CreditsService,
    @InjectRepository(FlashCard)
    private readonly flashCardRepo: Repository<FlashCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async generateFrom(input: GenerateFlashCardsDto, userId: number) {
    // Verificar y consumir créditos
    const creditStatus = await this.creditsService.consumeCredits(
      userId,
      'FLASHCARD_GENERATION',
    );

    try {
      const response: CardResponse = await this.groqService.generateFlashcards(
        input.reference,
        input.quantity,
      );

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new BadRequestException({
          message: 'Error al generar flashcards',
          details: 'La IA respondió con un formato inválido. Por favor, intenta de nuevo con un tema más específico.',
          errorCode: 'INVALID_AI_RESPONSE',
        });
      }

      // Validate cards array
      if (!response.cards || !Array.isArray(response.cards) || response.cards.length === 0) {
        throw new BadRequestException({
          message: 'No se generaron flashcards',
          details: 'La IA no pudo generar tarjetas de estudio. Intenta con otro tema o una referencia más detallada.',
          errorCode: 'NO_CARDS_GENERATED',
        });
      }

      // Validate metadata
      const { title, description, area, tema } = response.metadata;

      if (!title) {
        throw new BadRequestException({
          message: 'Datos incompletos de la IA',
          details: 'La IA generó flashcards pero no incluyó un título para el mazo. Por favor, intenta de nuevo.',
          errorCode: 'MISSING_METADATA',
        });
      }

      const card = this.cardRepo.create({
        area,
        title,
        description,
        tema,
        userId,
        code: await this.generateCode(),
        acceso: this.normalizeAccess(input.acceso),
      });
      const savedCard = await this.cardRepo.save(card);

      // Crear los FlashCard hijos
      const createdFlashCards = [];
      for (const flashCard of response.cards) {
        // Validate each flashcard
        if (!flashCard.front || !flashCard.back) {
          throw new BadRequestException({
            message: 'Formato de flashcard inválido',
            details: 'La IA generó una tarjeta sin frente o reverso. Por favor, intenta de nuevo.',
            errorCode: 'INVALID_CARD_FORMAT',
          });
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
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      
      // Si es un GroqApiError, incluimos la respuesta completa de la IA
      if (error instanceof GroqApiError) {
        throw new BadRequestException({
          message: error.message,
          details: error.rawResponse || error.message,
          errorCode: error.code,
        });
      }
      
      throw new BadRequestException({
        message: 'Error al generar flashcards',
        details: error instanceof Error ? error.message : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
        errorCode: 'FLASHCARDS_GENERATION_ERROR',
      });
    }
  }

  private isPublicAccess(acceso?: string | null): boolean {
    const normalized = (acceso ?? '').toLowerCase();
    return normalized === 'public' || normalized === 'publico';
  }

  /** Normaliza el acceso a 'publico' o 'privado' (valores de la BD) */
  private normalizeAccess(acceso?: string): string {
    if (!acceso) return 'privado';
    const normalized = acceso.toLowerCase().trim();
    if (normalized === 'public' || normalized === 'publico') return 'publico';
    return 'privado';
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
  async deckRefactor(cards: Card[] | Card, userId?: number) {
    if (Array.isArray(cards)) {
      return cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        area: card.area,
        tema: card.tema,
        canDelete: userId ? card.userId === userId : false,
        totalCards: card.flashcards.length,
      }));
    }
    return {
      id: cards.id,
      title: cards.title,
      description: cards.description,
      area: cards.area,
      tema: cards.tema,
      canDelete: userId ? cards.userId === userId : false,
      totalCards: cards.flashcards.length,
    };
  }

  async findPublicCardsDeck(userId?: number) {
    const cards = await this.cardRepo.find({ relations: ['flashcards'] });
    const filtered = cards.filter((card) => this.isPublicAccess(card.acceso));
    const result = this.deckRefactor(filtered, userId);
    // Randomize order
    return Array.isArray(result) ? this.shuffleArray(result) : result;
  }

  async findMyCardsDeck(userId: number) {
    const cards = await this.cardRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const result = this.deckRefactor(cards, userId);
    // Randomize order
    return Array.isArray(result) ? this.shuffleArray(result) : result;
  }

  // Helper method to shuffle array (Fisher-Yates)
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
    if (!this.isPublicAccess(card.acceso)) {
      throw new UnauthorizedException('No tienes acceso a este mazo');
    }
    return this.klekRefactor(card);
  }

  async getCardKlekById(id: number, userId: number) {
    const card = await this.cardRepo.findOne({
      where: { id },
      relations: ['flashcards'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!this.isPublicAccess(card.acceso)) {
      if (userId === card.userId) {
        return this.klekRefactor(card);
      } else throw new UnauthorizedException('No tienes acceso a este lugar');
    } else {
      return this.klekRefactor(card);
    }
  }

  async getCardById(id: number, userId?: number) {
    const card = await this.cardRepo.findOne({
      where: { id },
      relations: ['flashcards'],
    });
    if (!card) throw new NotFoundException('Card not found');
    if (!this.isPublicAccess(card.acceso) && card.userId !== userId) {
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
        acceso: this.normalizeAccess(payload.acceso),
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
}
