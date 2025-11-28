import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { FlashCard } from './entities/flash-card.entity';
import { CreateFlashCardDto, UpdateFlashCardDto } from './dto/create-flash-card.dto';
import { FlashCardFiltersDto, CardFiltersDto } from './dto/filters.dto';
import { GroqService } from 'src/groq/groq.service';

@Injectable()
export class FlashCardsService {
  constructor(
    @InjectRepository(Card) private cardRepo: Repository<Card>,
    @InjectRepository(FlashCard) private flashCardRepo: Repository<FlashCard>,
    private readonly groqService: GroqService,
  ) {}

  // ==================== CARDS ====================

  async createCard(input: { title: string; description?: string }, userId: number) {
    if (!input.title) throw new BadRequestException('Title is required');

    const card = this.cardRepo.create({
      title: input.title,
      description: input.description,
      totalCards: 0,
      reviewedCards: 0,
      userId,
    });

    return this.cardRepo.save(card);
  }

  async getAllCards(filters: CardFiltersDto, userId: number) {
    const query = this.cardRepo.createQueryBuilder('card').where('card.userId = :userId', { userId });

    if (filters.search) {
      const q = `%${filters.search.toLowerCase()}%`;
      query.andWhere('LOWER(card.title) LIKE :search', { search: q });
    }

    if (filters.sort === 'newest') {
      query.orderBy('card.createdAt', 'DESC');
    } else if (filters.sort === 'oldest') {
      query.orderBy('card.createdAt', 'ASC');
    } else if (filters.sort === 'mostReviewed') {
      query.orderBy('card.reviewedCards', 'DESC');
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    return query.skip(skip).take(limit).getMany();
  }

  async getCardById(id: number, userId: number) {
    const card = await this.cardRepo.findOne({
      where: { id, userId },
      relations: ['flashcards'],
    });

    if (!card) throw new NotFoundException('Card not found');
    return card;
  }

  async updateCard(id: number, input: { title?: string; description?: string }, userId: number) {
    const card = await this.getCardById(id, userId);

    if (input.title) card.title = input.title;
    if (input.description) card.description = input.description;
    card.updatedAt = new Date();

    return this.cardRepo.save(card);
  }

  async deleteCard(id: number, userId: number) {
    const card = await this.getCardById(id, userId);
    await this.flashCardRepo.delete({ cardId: id });
    await this.cardRepo.delete(id);
    return { message: 'Card deleted' };
  }

  async getCardStats(id: number, userId: number) {
    const card = await this.getCardById(id, userId);
    const flashcards = await this.flashCardRepo.find({ where: { cardId: id } });

    return {
      totalCards: flashcards.length,
      reviewedCards: flashcards.filter(f => f.reviewDate).length,
      difficultyCounts: {
        easy: flashcards.filter(f => f.difficulty === 'easy').length,
        medium: flashcards.filter(f => f.difficulty === 'medium').length,
        hard: flashcards.filter(f => f.difficulty === 'hard').length,
      },
    };
  }

  // ==================== FLASHCARDS ====================

  async createFlashcard(input: CreateFlashCardDto, userId: number) {
    if (!input.question || !input.answer) {
      throw new BadRequestException('Question and answer are required');
    }

    const card = await this.getCardById(input.cardId, userId);

    const flashcard = this.flashCardRepo.create({
      question: input.question,
      answer: input.answer,
      cardId: input.cardId,
      difficulty: input.difficulty || 'medium',
      hint: input.hint,
      tags: input.tags || [],
      userId,
    });

    const saved = await this.flashCardRepo.save(flashcard);

    // Update card stats
    card.totalCards = (await this.flashCardRepo.count({ where: { cardId: card.id } })) || 0;
    await this.cardRepo.save(card);

    return saved;
  }

  async getFlashcardsByCard(cardId: number, filters: FlashCardFiltersDto, userId: number) {
    await this.getCardById(cardId, userId);

    const query = this.flashCardRepo.createQueryBuilder('fc').where('fc.cardId = :cardId', { cardId });

    if (filters.difficulty) {
      query.andWhere('fc.difficulty = :difficulty', { difficulty: filters.difficulty });
    }

    if (filters.reviewed !== undefined) {
      if (filters.reviewed) {
        query.andWhere('fc.reviewDate IS NOT NULL');
      } else {
        query.andWhere('fc.reviewDate IS NULL');
      }
    }

    if (filters.search) {
      const q = `%${filters.search.toLowerCase()}%`;
      query.andWhere('(LOWER(fc.question) LIKE :search OR LOWER(fc.answer) LIKE :search)', { search: q });
    }

    if (filters.sort === 'newest') {
      query.orderBy('fc.createdAt', 'DESC');
    } else if (filters.sort === 'oldest') {
      query.orderBy('fc.createdAt', 'ASC');
    } else if (filters.sort === 'byDifficulty') {
      query.orderBy('FIELD(fc.difficulty, "hard", "medium", "easy")');
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    return query.skip(skip).take(limit).getMany();
  }

  async getFlashcardById(id: number, userId: number) {
    const flashcard = await this.flashCardRepo.findOne({
      where: { id, userId },
    });

    if (!flashcard) throw new NotFoundException('Flashcard not found');
    return flashcard;
  }

  async updateFlashcard(id: number, input: UpdateFlashCardDto, userId: number) {
    const flashcard = await this.getFlashcardById(id, userId);

    if (input.question) flashcard.question = input.question;
    if (input.answer) flashcard.answer = input.answer;
    if (input.difficulty) flashcard.difficulty = input.difficulty;
    if (input.hint) flashcard.hint = input.hint;
    if (input.tags) flashcard.tags = input.tags;
    flashcard.updatedAt = new Date();

    return this.flashCardRepo.save(flashcard);
  }

  async deleteFlashcard(id: number, userId: number) {
    const flashcard = await this.getFlashcardById(id, userId);
    await this.flashCardRepo.delete(id);
    return { message: 'Flashcard deleted' };
  }

  async markFlashcardAsReviewed(id: number, userId: number) {
    const flashcard = await this.getFlashcardById(id, userId);
    flashcard.reviewDate = new Date();
    flashcard.updatedAt = new Date();
    return this.flashCardRepo.save(flashcard);
  }

  // ==================== AI GENERATION ====================

  async generateFromTopic(input: { topic: string; numberOfCards: number; cardId: number }, userId: number) {
    const card = await this.getCardById(input.cardId, userId);

    const prompt = `Generate exactly ${input.numberOfCards} flashcard pairs about "${input.topic}".
    Return ONLY valid JSON with this exact format:
    {
      "cards": [
        {"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}
      ]
    }`;

    const response = await this.groqService.chat(prompt);

    const generatedCards: FlashCard[] = [];
    if (response && typeof response === 'object' && 'cards' in response) {
      for (const card of (response as any).cards) {
        const flashcard = this.flashCardRepo.create({
          question: card.question,
          answer: card.answer,
          cardId: input.cardId,
          difficulty: card.difficulty || 'medium',
          tags: [input.topic],
          userId,
        });
        const saved = await this.flashCardRepo.save(flashcard);
        generatedCards.push(saved);
      }
    }

    card.totalCards = (await this.flashCardRepo.count({ where: { cardId: card.id } })) || 0;
    await this.cardRepo.save(card);

    return {
      success: true,
      totalCreated: generatedCards.length,
      cards: generatedCards,
    };
  }

  async generateFromReference(input: { referenceText: string; numberOfCards: number; cardId: number }, userId: number) {
    const card = await this.getCardById(input.cardId, userId);

    const prompt = `Based on this reference text, generate exactly ${input.numberOfCards} flashcard pairs:
    "${input.referenceText}"
    
    Return ONLY valid JSON with this exact format:
    {
      "cards": [
        {"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}
      ]
    }`;

    const response = await this.groqService.chat(prompt);

    const generatedCards: FlashCard[] = [];
    if (response && typeof response === 'object' && 'cards' in response) {
      for (const card of (response as any).cards) {
        const flashcard = this.flashCardRepo.create({
          question: card.question,
          answer: card.answer,
          cardId: input.cardId,
          difficulty: card.difficulty || 'medium',
          tags: ['generated'],
          userId,
        });
        const saved = await this.flashCardRepo.save(flashcard);
        generatedCards.push(saved);
      }
    }

    card.totalCards = (await this.flashCardRepo.count({ where: { cardId: card.id } })) || 0;
    await this.cardRepo.save(card);

    return {
      success: true,
      totalCreated: generatedCards.length,
      cards: generatedCards,
    };
  }
}
