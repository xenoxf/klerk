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
    @InjectRepository(Flashcard) private readonly flashCardRepo: Repository<Flashcard>,
  ) {}

  // Generar múltiples tarjetas usando IA basadas en un tema
  async generateFromTopic(topic: string, numberOfCards: number, userId: number) {
    const instruction = `Eres un experto educativo. Genera exactamente ${numberOfCards} tarjetas de estudio (flashcards) en formato JSON únicamente, sin explicaciones adicionales. El JSON debe tener SOLO un array "cards" donde cada elemento tiene exactamente estos campos: { front: string (pregunta o concepto corto, máximo 15 palabras), back: string (respuesta o explicación detallada, mínimo 50 caracteres), difficulty: "fácil"|"medio"|"difícil" }. Tema: "${topic}". Las tarjetas deben ser claras, precisas, educativas y progresivamente más complejas. Responde SOLO con el JSON válido, sin marcas de código.`;

    const aiRaw = await this.groqService.chat(instruction);

    let parsed: any = null;
    try {
      parsed = JSON.parse(aiRaw);
    } catch (e) {
      try {
        const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e2) {
        parsed = null;
      }
    }

    if (!parsed || !Array.isArray(parsed.cards)) {
      throw new Error('No se pudo generar tarjetas válidas desde la IA');
    }

    const createdCards = [];
    for (const card of parsed.cards) {
      const flashCard = this.flashCardRepo.create({
        front: card.front,
        back: card.back,
        description: `Dificultad: ${card.difficulty || 'medio'}. Tema: ${topic}. Generado por IA.`,
        userId,
      } as any);
      await this.flashCardRepo.save(flashCard);
      createdCards.push(flashCard);
    }

    return { success: true, totalCreated: createdCards.length, cards: createdCards };
  }

  // Generar tarjetas desde un texto de referencia
  async generateFromReference(referenceText: string, numberOfCards: number, userId: number) {
    const instruction = `Eres un experto educativo. Analiza el siguiente texto de referencia y genera exactamente ${numberOfCards} tarjetas de estudio (flashcards) en formato JSON únicamente, sin explicaciones adicionales. El JSON debe tener SOLO un array "cards" donde cada elemento tiene exactamente estos campos: { front: string (pregunta o concepto clave del texto, máximo 15 palabras), back: string (respuesta o explicación completa basada en el texto, mínimo 50 caracteres), difficulty: "fácil"|"medio"|"difícil" }. Texto de referencia: "${referenceText}". Las tarjetas deben capturar los conceptos más importantes y educativos del texto. Responde SOLO con el JSON válido, sin marcas de código.`;

    const aiRaw = await this.groqService.chat(instruction);

    let parsed: any = null;
    try {
      parsed = JSON.parse(aiRaw);
    } catch (e) {
      try {
        const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e2) {
        parsed = null;
      }
    }

    if (!parsed || !Array.isArray(parsed.cards)) {
      throw new Error('No se pudo generar tarjetas válidas desde la IA');
    }

    const createdCards = [];
    for (const card of parsed.cards) {
      const flashCard = this.flashCardRepo.create({
        front: card.front,
        back: card.back,
        description: `Dificultad: ${card.difficulty || 'medio'}. Generado desde referencia por IA.`,
        userId,
      } as any);
      await this.flashCardRepo.save(flashCard);
      createdCards.push(flashCard);
    }

    return { success: true, totalCreated: createdCards.length, cards: createdCards };
  }

  // Obtener todas las tarjetas del usuario
  findAll(userId?: number) {
    if (userId) {
      return this.flashCardRepo.find({ where: { userId } });
    }
    return this.flashCardRepo.find();
  }

  // Obtener una tarjeta por ID
  findOne(id: number, userId?: number) {
    return this.flashCardRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
    });
  }

  // Actualizar una tarjeta (solo campos que el usuario puede editar manualmente)
  async update(id: number, updateFlashCardDto: UpdateFlashCardDto, userId?: number) {
    const flashCard = await this.flashCardRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
    });
    if (!flashCard) return null;
    Object.assign(flashCard, updateFlashCardDto);
    await this.flashCardRepo.save(flashCard);
    return this.flashCardRepo.findOne({ where: { id } });
  }

  // Eliminar una tarjeta
  async remove(id: number, userId?: number) {
    const flashCard = await this.flashCardRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
    });
    if (!flashCard) return null;
    await this.flashCardRepo.delete(id);
    return { removed: true, id };
  }
}
