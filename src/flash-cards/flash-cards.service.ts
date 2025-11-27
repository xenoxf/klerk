import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { Flashcard } from './entities/flash-card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { GroqService } from 'src/groq/groq.service';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
    @InjectRepository(Flashcard)
    private flashcardsRepo: Repository<Flashcard>,
  ) {}

  // ============================================================
  // 🚀 Generar múltiples tarjetas usando IA basadas en un tema
  // ============================================================
  async generateFromTopic(
    topic: string,
    numberOfCards: number,
    cardId: number,
    userId: number,
  ) {
    const card = await this.getCardById(cardId, userId);
    
    const prompt = `
Genera exactamente ${numberOfCards} flashcards sobre el tema "${topic}".
Devuelve SOLO JSON válido con el formato:

{
  "cards": [
    { "question": "texto", "answer": "texto", "difficulty": "easy"|"medium"|"hard" }
  ]
}
`;

    try {
      const result = await this.groqService.generateFlashcards(prompt);

      if (result.error || !Array.isArray(result.cards)) {
        throw new BadRequestException('IA no devolvió flashcards válidas');
      }

      const createdCards = [];

      for (const cardData of result.cards) {
        const flashcard = this.flashcardsRepo.create({
          question: cardData.question,
          answer: cardData.answer,
          difficulty: cardData.difficulty || 'medium',
          tags: [topic],
          cardId,
          numCard: card.totalCards + createdCards.length + 1,
        });

        const savedFlashcard = await this.flashcardsRepo.save(flashcard);
        createdCards.push(savedFlashcard);
      }

      // Actualizar contador de tarjetas en el mazo
      card.totalCards += createdCards.length;
      await this.cardsRepository.save(card);

      return {
        success: true,
        totalCreated: createdCards.length,
        cards: createdCards,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Error al generar flashcards con IA');
    }
  }

  // ============================================================
  // 🚀 Generar tarjetas desde un texto de referencia
  // ============================================================
  async generateFromReference(referenceText: string, numberOfCards: number, cardId: number, userId: number) {
    const card = await this.getCardById(cardId, userId);

    const prompt = `
A partir del siguiente texto, genera exactamente ${numberOfCards} flashcards:

"${referenceText}"

Formato obligatorio JSON:

{
  "cards": [
    { "question": "texto", "answer": "texto", "difficulty": "easy"|"medium"|"hard" }
  ]
}

Solo JSON válido.
`;

    try {
      const result = await this.groqService.generateFlashcards(prompt);

      if (result.error || !Array.isArray(result.cards)) {
        throw new BadRequestException('IA no devolvió flashcards válidas');
      }

      const createdCards = [];

      for (const cardData of result.cards) {
        const flashcard = this.flashcardsRepo.create({
          question: cardData.question,
          answer: cardData.answer,
          difficulty: cardData.difficulty || 'medium',
          tags: ['reference', 'generated'],
          cardId,
          numCard: card.totalCards + createdCards.length + 1,
        });

        const savedFlashcard = await this.flashcardsRepo.save(flashcard);
        createdCards.push(savedFlashcard);
      }

      // Actualizar contador de tarjetas en el mazo
      card.totalCards += createdCards.length;
      await this.cardsRepository.save(card);

      return {
        success: true,
        totalCreated: createdCards.length,
        cards: createdCards,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Error al generar flashcards desde referencia');
    }
  }

  // ==================== CARD OPERATIONS ====================

  async createCard(createCardDto: CreateCardDto, userId: number): Promise<Card> {
    try {
      const card = this.cardsRepository.create({
        ...createCardDto,
        userId,
        totalCards: 0,
        reviewedCards: 0,
      });
      return await this.cardsRepository.save(card);
    } catch (error) {
      throw new BadRequestException('Error al crear el mazo de tarjetas');
    }
  }

  async getAllCards(userId: number): Promise<Card[]> {
    return await this.cardsRepository.find({
      where: { userId, isArchived: false },
      relations: ['flashcards'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCardById(id: number, userId: number): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id, userId },
      relations: ['flashcards'],
    });

    if (!card) {
      throw new NotFoundException('Mazo de tarjetas no encontrado');
    }

    return card;
  }

  async updateCard(
    id: number,
    updateCardDto: UpdateCardDto,
    userId: number,
  ): Promise<Card> {
    const card = await this.getCardById(id, userId);
    
    Object.assign(card, updateCardDto);
    return await this.cardsRepository.save(card);
  }

  async deleteCard(id: number, userId: number): Promise<{ message: string }> {
    const card = await this.getCardById(id, userId);
    await this.cardsRepository.remove(card);
    return { message: 'Mazo de tarjetas eliminado correctamente' };
  }

  async archiveCard(id: number, userId: number): Promise<Card> {
    const card = await this.getCardById(id, userId);
    card.isArchived = true;
    return await this.cardsRepository.save(card);
  }

  // ==================== FLASHCARD OPERATIONS ====================

  async createFlashcard(
    createFlashcardDto: CreateFlashcardDto,
    userId: number,
  ): Promise<Flashcard> {
    try {
      const card = await this.getCardById(createFlashcardDto.cardId, userId);

      const flashcard = this.flashcardsRepo.create({
        ...createFlashcardDto,
        numCard: card.totalCards + 1,
      });

      const savedFlashcard = await this.flashcardsRepo.save(flashcard);

      // Actualizar contador de tarjetas en el mazo
      card.totalCards += 1;
      await this.cardsRepository.save(card);

      return savedFlashcard;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Error al crear la tarjeta');
    }
  }

  async getFlashcardsByCard(
    cardId: number,
    userId: number,
  ): Promise<Flashcard[]> {
    // Verificar que el card pertenece al usuario
    await this.getCardById(cardId, userId);

    return await this.flashcardsRepo.find({
      where: { cardId, isArchived: false },
      order: { numCard: 'ASC' },
    });
  }

  async getFlashcardById(id: number, userId: number): Promise<Flashcard> {
    const flashcard = await this.flashcardsRepo.findOne({
      where: { id },
      relations: ['card'],
    });

    if (!flashcard || flashcard.card.userId !== userId) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    return flashcard;
  }

  async updateFlashcard(
    id: number,
    updateFlashcardDto: UpdateFlashcardDto,
    userId: number,
  ): Promise<Flashcard> {
    const flashcard = await this.getFlashcardById(id, userId);

    Object.assign(flashcard, updateFlashcardDto);
    return await this.flashcardsRepo.save(flashcard);
  }

  async deleteFlashcard(id: number, userId: number): Promise<{ message: string }> {
    const flashcard = await this.getFlashcardById(id, userId);
    const card = flashcard.card;

    await this.flashcardsRepo.remove(flashcard);

    // Actualizar contador de tarjetas
    card.totalCards = Math.max(0, card.totalCards - 1);
    await this.cardsRepository.save(card);

    return { message: 'Tarjeta eliminada correctamente' };
  }

  async archiveFlashcard(id: number, userId: number): Promise<Flashcard> {
    const flashcard = await this.getFlashcardById(id, userId);
    flashcard.isArchived = true;
    return await this.flashcardsRepo.save(flashcard);
  }

  async reviewFlashcard(id: number, userId: number): Promise<Flashcard> {
    const flashcard = await this.getFlashcardById(id, userId);
    const card = flashcard.card;

    flashcard.reviewDate = new Date();
    const savedFlashcard = await this.flashcardsRepo.save(flashcard);

    // Actualizar fecha de revisión del mazo
    card.lastReviewDate = new Date();
    card.reviewedCards = Math.min(card.reviewedCards + 1, card.totalCards);
    await this.cardsRepository.save(card);

    return savedFlashcard;
  }

  async getArchivedCards(userId: number): Promise<Card[]> {
    return await this.cardsRepository.find({
      where: { userId, isArchived: true },
      relations: ['flashcards'],
      order: { updatedAt: 'DESC' },
    });
  }

  async restoreCard(id: number, userId: number): Promise<Card> {
    const card = await this.cardsRepository.findOne({
      where: { id, userId },
    });

    if (!card) {
      throw new NotFoundException('Mazo de tarjetas no encontrado');
    }

    card.isArchived = false;
    return await this.cardsRepository.save(card);
  }

  async getCardStats(id: number, userId: number): Promise<any> {
    const card = await this.getCardById(id, userId);
    const flashcards = await this.flashcardsRepo.find({
      where: { cardId: id },
    });

    const difficultyCounts = {
      easy: flashcards.filter((f) => f.difficulty === 'easy').length,
      medium: flashcards.filter((f) => f.difficulty === 'medium').length,
      hard: flashcards.filter((f) => f.difficulty === 'hard').length,
    };

    return {
      totalCards: card.totalCards,
      reviewedCards: card.reviewedCards,
      pendingReview: card.totalCards - card.reviewedCards,
      difficultyCounts,
      lastReviewDate: card.lastReviewDate,
    };
  }
}
