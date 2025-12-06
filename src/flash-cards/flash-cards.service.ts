import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
import { UpdateFlashCardDto } from './dto/update-flash-card.dto';
import { FlashCard } from './entities/flash-card.entity';

@Injectable()
export class FlashCardsService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(FlashCard) private readonly flashCardRepo: Repository<FlashCard>,
  ) { }

  private parseJSON(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch (e) {
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
      } catch (e2) {
        return null;
      }
    }
  }

  async generateFromTopic(input: any, userId: number) {
    if (!input.topic || input.numberOfCards <= 0) {
      throw new BadRequestException('Topic and valid numberOfCards required');
    }

    const instruction = `Genera ${input.numberOfCards} tarjetas flashcard sobre "${input.topic}" en JSON. Array "cards" con {front:(pregunta corta),back:(respuesta detallada),difficulty:"fácil"|"medio"|"difícil"}. Solo JSON.`;
    const aiRaw = await this.groqService.chat(instruction);
    const parsed = this.parseJSON(aiRaw);

    if (!parsed?.cards || !Array.isArray(parsed.cards)) {
      throw new BadRequestException('Invalid AI response');
    }

    const createdCards = [];
    for (const card of parsed.cards) {
      const flashCard = this.flashCardRepo.create({
        front: card.front,
        back: card.back,
        description: `Dificultad: ${card.difficulty || 'medio'}. Tema: ${input.topic}`,
        userId,
      } as any);
      await this.flashCardRepo.save(flashCard);
      createdCards.push(flashCard);
    }

    return { success: true, totalCreated: createdCards.length, cards: createdCards };
  }

  async generateFromReference(input: any, userId: number) {
    if (!input.referenceText || input.numberOfCards <= 0) {
      throw new BadRequestException('Reference text and numberOfCards required');
    }

    const instruction = `Analiza: "${input.referenceText}". Genera ${input.numberOfCards} tarjetas flashcard en JSON. Array "cards" con {front:(concepto clave),back:(explicación del texto),difficulty:"fácil"|"medio"|"difícil"}. Solo JSON.`;
    const aiRaw = await this.groqService.chat(instruction);
    const parsed = this.parseJSON(aiRaw);

    if (!parsed?.cards || !Array.isArray(parsed.cards)) {
      throw new BadRequestException('Invalid AI response');
    }

    const createdCards = [];
    for (const card of parsed.cards) {
      const flashCard = this.flashCardRepo.create({
        front: card.front,
        back: card.back,
        description: `Dificultad: ${card.difficulty || 'medio'}. Generado desde referencia`,
        userId,
      } as any);
      await this.flashCardRepo.save(flashCard);
      createdCards.push(flashCard);
    }

    return { success: true, totalCreated: createdCards.length, cards: createdCards };
  }

  async findAll(userId: number) {
    return this.flashCardRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const flashCard = await this.flashCardRepo.findOne({
      where: { id, userId },
    });
    if (!flashCard) throw new NotFoundException('Flashcard not found');
    return flashCard;
  }

  async update(id: number, updateFlashCardDto: UpdateFlashCardDto, userId: number) {
    const flashCard = await this.findOne(id, userId);
    Object.assign(flashCard, updateFlashCardDto);
    flashCard.updatedAt = new Date();
    return this.flashCardRepo.save(flashCard);
  }

  async remove(id: number, userId: number) {
    const flashCard = await this.findOne(id, userId);
    await this.flashCardRepo.delete(id);
    return { success: true, deletedId: id };
  }
}
