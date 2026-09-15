import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { Note } from '../notes/entities/note.entity';
import { Card } from '../flash-cards/entities/card.entity';
import { Chat } from '../messages/entities/chat.entity';

export interface GlobalSearchItem {
  id: number;
  title: string;
  description?: string;
  topic?: string;
  acceso?: string;
  updatedAt: Date | null;
}

export interface GlobalSearchResult {
  q: string;
  exams: GlobalSearchItem[];
  notes: GlobalSearchItem[];
  flashcards: GlobalSearchItem[];
  chats: GlobalSearchItem[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Exam) private examRepo: Repository<Exam>,
    @InjectRepository(Note) private noteRepo: Repository<Note>,
    @InjectRepository(Card) private cardRepo: Repository<Card>,
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
  ) {}

  async globalSearch(
    q: string,
    userId: number,
    limit = 6,
  ): Promise<GlobalSearchResult> {
    const query = (q || '').trim();
    if (query.length < 2) {
      return { q: '', exams: [], notes: [], flashcards: [], chats: [] };
    }
    const take = Math.min(Math.max(limit || 6, 1), 10);
    const like = `%${query}%`;

    const [exams, notes, cards, chats] = await Promise.all([
      this.examRepo
        .createQueryBuilder('e')
        .select(['e.id', 'e.title', 'e.description', 'e.acceso', 'e.createdAt'])
        .where('(e.userId = :userId OR e.acceso IN (:...pub))', {
          userId,
          pub: ['public', 'publico'],
        })
        .andWhere('(e.title ILIKE :like OR e.description ILIKE :like OR e.tema ILIKE :like)', { like })
        .orderBy('e.createdAt', 'DESC')
        .take(take)
        .getMany()
        .catch(() => [] as Exam[]),
      this.noteRepo
        .createQueryBuilder('n')
        .select(['n.id', 'n.title', 'n.description', 'n.tema', 'n.acceso', 'n.createdAt'])
        .where('(n.userId = :userId OR n.acceso IN (:...pub))', {
          userId,
          pub: ['public', 'publico'],
        })
        .andWhere('(n.title ILIKE :like OR n.description ILIKE :like OR n.tema ILIKE :like)', { like })
        .orderBy('n.createdAt', 'DESC')
        .take(take)
        .getMany()
        .catch(() => [] as Note[]),
      this.cardRepo
        .createQueryBuilder('c')
        .select(['c.id', 'c.title', 'c.description', 'c.tema', 'c.acceso', 'c.createdAt'])
        .where('(c.userId = :userId OR c.acceso IN (:...pub))', {
          userId,
          pub: ['public', 'publico'],
        })
        .andWhere('(c.title ILIKE :like OR c.description ILIKE :like OR c.tema ILIKE :like)', { like })
        .orderBy('c.createdAt', 'DESC')
        .take(take)
        .getMany()
        .catch(() => [] as Card[]),
      this.chatRepo
        .createQueryBuilder('ch')
        .select(['ch.id', 'ch.title', 'ch.createdAt'])
        .where('ch.userId = :userId', { userId })
        .andWhere('ch.title ILIKE :like', { like })
        .orderBy('ch.createdAt', 'DESC')
        .take(take)
        .getMany()
        .catch(() => [] as Chat[]),
    ]);

    return {
      q: query,
      exams: exams.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        acceso: e.acceso,
        updatedAt: e.createdAt ?? null,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        topic: (n as any).tema,
        acceso: n.acceso,
        updatedAt: n.createdAt ?? null,
      })),
      flashcards: cards.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        acceso: c.acceso,
        updatedAt: c.createdAt ?? null,
      })),
      chats: chats.map((ch) => ({
        id: ch.id,
        title: ch.title ?? 'Chat sin título',
        updatedAt: ch.createdAt ?? null,
      })),
    };
  }
}
