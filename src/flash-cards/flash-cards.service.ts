import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from 'src/groq/groq.service';
import { CreateFlashCardDto } from './dto/create-flash-card.dto';
import { UpdateFlashCardDto } from './dto/update-flash-card.dto';
import { Flashcard } from './entities/flash-card.entity';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(Flashcard)
    private readonly flashCardRepo: Repository<Flashcard>,
  ) {}

  // ============================================================
  // 🚀 Generar múltiples tarjetas usando IA basadas en un tema
  // ============================================================
  async generateFromTopic(topic: string, numberOfCards: number, userId: number) {
    const prompt = `
Genera exactamente ${numberOfCards} flashcards sobre el tema "${topic}".
Devuelve SOLO JSON válido y con el formato:

{
  "cards": [
    { "front": "texto", "back": "texto", "difficulty": "fácil"|"medio"|"difícil" }
  ]
}
`;

    const result = await this.groqService.generateFlashcards(prompt);

    if (result.error || !Array.isArray(result.cards)) {
      throw new Error('IA no devolvió flashcards válidas');
    }

    const createdCards = [];

    for (const card of result.cards) {
      const flashCard = this.flashCardRepo.create({
        front: card.front,
        back: card.back,
        description: `Dificultad: ${card.difficulty}. Tema: ${topic}. Generado por IA.`,
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
  }

  // ============================================================
  // 🚀 Generar tarjetas desde un texto de referencia
  // ============================================================
  async generateFromReference(referenceText: string, numberOfCards: number, userId: number) {
    const prompt = `
A partir del siguiente texto, genera exactamente ${numberOfCards} flashcards:

"${referenceText}"

Formato obligatorio:

{
  "cards": [
    { "front": "texto", "back": "texto", "difficulty": "fácil"|"medio"|"difícil" }
  ]
}

Solo JSON válido.
`;

    const result = await this.groqService.generateFlashcards(prompt);

    if (result.error || !Array.isArray(result.cards)) {
      throw new Error('IA no devolvió flashcards válidas');
    }

    const createdCards = [];

    for (const card of result.cards) {
      const flashCard = this.flashCardRepo.create({
        front: card.front,
        back: card.back,
        description: `Dificultad: ${card.difficulty}. Generado desde referencia.`,
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
  }

  // ============================================================
  // CRUD NORMAL
  // ============================================================

  findAll(userId?: number) {
    if (userId) {
      return this.flashCardRepo.find({ where: { userId } });
    }
    return this.flashCardRepo.find();
  }

  findOne(id: number, userId?: number) {
    return this.flashCardRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
    });
  }

  async update(id: number, dto: UpdateFlashCardDto, userId?: number) {
    const flashCard = await this.flashCardRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
    });

    if (!flashCard) return null;

    Object.assign(flashCard, dto);

    await this.flashCardRepo.save(flashCard);

    return this.flashCardRepo.findOne({ where: { id } });
  }

  async remove(id: number, userId?: number) {
    const flashCard = await this.flashCardRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
    });

    if (!flashCard) return null;

    await this.flashCardRepo.delete(id);

    return { removed: true, id };
  }
}
