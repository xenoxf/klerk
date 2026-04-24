import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Note } from './entities/note.entity';
import { NoteContent } from './entities/note-content.entity';
import { CreditsService, calculateNoteCost } from '../credits/credits.service';
import { GeminiService, NoteResponse } from '../gemini/gemini.service';
import { LikesService } from '../likes/likes.service';
import {
  isPublicAccess,
  normalizeAccess,
  shuffleArray,
} from '../common/utils/shared.utils';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private noteRepo: Repository<Note>,
    @InjectRepository(NoteContent)
    private noteContentRepo: Repository<NoteContent>,
    private creditsService: CreditsService,
    private geminiService: GeminiService,
    private likesService: LikesService,
  ) {}

  async generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.noteRepo.findOne({ where: { code } });
    if (existing) return this.generateCode();
    return code;
  }

  private normalizeAiNoteItems(rawNotes: any[]): Array<{
    title: string;
    markdown: string;
    topic: string;
  }> {
    if (!Array.isArray(rawNotes)) return [];
    return rawNotes.map((item) => ({
      title: item.title || 'Sección',
      markdown: item.content || item.markdown || '',
      topic: item.topic || 'General',
    }));
  }

  async generate(
    input: {
      reference?: string;
      topic?: string;
      numberOfNotes?: number;
      levelOfDetail?: string;
      acceso?: string;
    },
    userId: number,
  ) {
    const promptText = input.reference || input.topic || 'Tema general';
    const dynamicCost = calculateNoteCost(
      input.levelOfDetail || 'medio',
      promptText,
    );

    const creditStatus = await this.creditsService.consumeCredits(
      userId,
      'NOTE_GENERATION',
      dynamicCost,
    );

    const numberOfNotes = input.numberOfNotes ?? 3;
    const level = input.levelOfDetail ?? 'medio';
    const acceso = normalizeAccess(input.acceso);

    const response: NoteResponse = await this.geminiService.generateNote(
      promptText,
      numberOfNotes,
      level,
    );

    const meta = response.metadata || { title: '', description: '' };
    const title = meta.title;
    const description = meta.description || '';
    const area = meta.area;
    const tema = meta.tema;

    const rawNotes = response.notes || [];
    const normalizedNotes = this.normalizeAiNoteItems(rawNotes);

    const note = this.noteRepo.create({
      description,
      tema,
      title,
      area,
      acceso,
      levelOfDetail: level,
      code: await this.generateCode(),
      userId,
    });

    const savedNote = await this.noteRepo.save(note);

    await Promise.all(
      normalizedNotes.map((item) => {
        const noteContent = this.noteContentRepo.create({
          content: item.markdown,
          noteId: savedNote.id,
          userId,
        });
        return this.noteContentRepo.save(noteContent);
      }),
    );

    return {
      message: 'Notas creadas correctamente',
      noteId: savedNote.id,
      totalSections: normalizedNotes.length,
      creditsRemaining: creditStatus.remaining,
      creditsTotal: creditStatus.total,
    };
  }

  // ==================== BASIC CRUD ====================
  async findAll(userId: number) {
    const notes = await this.noteRepo.find({
      where: { userId },
      relations: ['noteContents', 'user'],
      order: { createdAt: 'DESC' },
    });
    const noteIds = notes.map((n) => n.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'note',
      noteIds,
    );
    const userLikedSet = await this.likesService.getUserLikedCards(
      'note',
      userId,
      noteIds,
    );
    return this.noteRefactorArray(notes, userId, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
  }

  async findPrivate(userId: number) {
    const notes = await this.noteRepo.find({
      where: { userId },
      relations: ['noteContents', 'user'],
      order: { createdAt: 'DESC' },
    });
    const noteIds = notes.map((n) => n.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'note',
      noteIds,
    );
    const userLikedSet = await this.likesService.getUserLikedCards(
      'note',
      userId,
      noteIds,
    );
    const result = this.noteRefactorArray(notes, userId, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    // Randomize order
    return shuffleArray(result);
  }

  async findPublic(userId?: number) {
    const notes = await this.noteRepo.find({
      relations: ['noteContents', 'user'],
      order: { createdAt: 'DESC' },
    });
    const publicNotes = notes.filter((note) => isPublicAccess(note.acceso));
    const noteIds = publicNotes.map((n) => n.id);
    const countsMap = await this.likesService.getLikeCountsForCards(
      'note',
      noteIds,
    );
    const userLikedSet = userId
      ? await this.likesService.getUserLikedCards('note', userId, noteIds)
      : new Set<number>();
    const result = this.noteRefactorArray(publicNotes, userId, {
      counts: countsMap,
      userLiked: userLikedSet,
    });
    // Randomize order
    return shuffleArray(result);
  }

  noteRefactor(
    note: Note,
    userId?: number,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    return {
      id: note.id,
      title: note.title,
      description: note.description,
      area: note.area,
      tema: note.tema,
      acceso: note.acceso,
      createdAt: note.createdAt,
      noteContents:
        note.noteContents?.map((nc) => ({
          id: nc.id,
          content: nc.content,
        })) ?? [],
      canDelete: userId ? note.userId === userId : false,
      contentsCount: note.noteContents?.length || 0,
      creatorName: note.user?.name || 'Anónimo',
      likesCount: likesData?.counts?.get(note.id) || 0,
      userLiked: likesData?.userLiked?.has(note.id) || false,
    };
  }

  noteRefactorArray(
    notes: Note[],
    userId?: number,
    likesData?: { counts: Map<number, number>; userLiked: Set<number> },
  ) {
    return notes.map((note) => this.noteRefactor(note, userId, likesData));
  }

  async findOne(id: number, userId: number) {
    const note = await this.noteRepo.findOne({
      where: { id, userId },
      relations: ['noteContents'],
    });
    if (!note) throw new NotFoundException('Note not found');
    return this.noteRefactor(note, userId);
  }

  async findOneByAccess(id: number, userId?: number) {
    const note = await this.noteRepo.findOne({
      where: { id },
      relations: ['noteContents', 'user'],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (!isPublicAccess(note.acceso) && note.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a esta nota');
    }
    return this.noteRefactor(note, userId);
  }

  async getLockedNote(id: number, userId: number) {
    const note = await this.noteRepo.findOne({
      where: { id },
      relations: ['noteContents', 'user'],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) {
      throw new UnauthorizedException('No tienes permiso para ver esta nota');
    }
    return this.noteRefactor(note, userId);
  }

  async findOneByCode(code: string, userId?: number) {
    const note = await this.noteRepo.findOne({
      where: { code },
      relations: ['noteContents'],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (!isPublicAccess(note.acceso) && note.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a esta nota');
    }
    return this.noteRefactor(note, userId);
  }

  async create(
    payload: {
      title: string;
      description?: string;
      levelOfDetail?: string;
      acceso?: string;
      noteContents?: Array<{ tema?: string; content: string; order?: number }>;
    },
    userId: number,
  ) {
    if (!payload?.title?.trim()) {
      throw new BadRequestException('El título es requerido');
    }

    const note = this.noteRepo.create({
      title: payload.title.trim(),
      description: payload.description ?? '',
      levelOfDetail: payload.levelOfDetail ?? 'medio',
      acceso: normalizeAccess(payload.acceso),
      code: await this.generateCode(),
      userId,
    });
    const savedNote = await this.noteRepo.save(note);

    if (
      Array.isArray(payload.noteContents) &&
      payload.noteContents.length > 0
    ) {
      for (let i = 0; i < payload.noteContents.length; i++) {
        const item = payload.noteContents[i];
        await this.noteContentRepo.save(
          this.noteContentRepo.create({
            tema: item.tema ?? payload.title,
            content: item.content,
            order: item.order ?? i,
            noteId: savedNote.id,
            userId,
          } as any),
        );
      }
    }

    return this.findOne(savedNote.id, userId);
  }

  async update(
    id: number,
    payload: {
      title?: string;
      description?: string;
      levelOfDetail?: string;
      acceso?: string;
    },
    userId: number,
  ) {
    const note = await this.noteRepo.findOne({ where: { id, userId } });
    if (!note) throw new NotFoundException('Note not found');
    await this.noteRepo.update(id, {
      title: payload.title ?? note.title,
      description: payload.description ?? note.description,
      levelOfDetail: payload.levelOfDetail ?? note.levelOfDetail,
      acceso: payload.acceso ?? note.acceso,
    });
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const note = await this.noteRepo.findOne({ where: { id, userId } });
    if (!note)
      throw new NotFoundException('Note not found or not owned by user');
    await this.noteContentRepo.delete({ noteId: id } as any);
    await this.noteRepo.delete(id);
    return { message: 'Eliminado' };
  }

  async searchNotes(
    query: string,
    userId?: number,
    limit: number = 20,
    offset: number = 0,
    searchInContent: boolean = true,
  ) {
    if (!query || query.trim().length === 0) {
      const notes = await this.noteRepo.find({
        where: { acceso: 'publico' },
        relations: ['noteContents', 'user'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
      return this.normalizeNotes(notes, userId, false);
    }

    const normalizedQuery = query.trim().toLowerCase();

    const queryBuilder = this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.noteContents', 'noteContents')
      .where('LOWER(note.title) LIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('LOWER(note.description) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(note.tema) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('LOWER(note.area) LIKE :query', {
        query: `%${normalizedQuery}%`,
      })
      .orWhere('note.code = :exactQuery', {
        exactQuery: normalizedQuery.toUpperCase(),
      });

    if (searchInContent) {
      queryBuilder.orWhere('LOWER(noteContents.content) LIKE :query', {
        query: `%${normalizedQuery}%`,
      });
    }

    if (!userId) {
      queryBuilder.andWhere('note.acceso = :acceso', { acceso: 'publico' });
    } else {
      queryBuilder.andWhere(
        '(note.acceso = :acceso OR note.userId = :userId)',
        {
          acceso: 'publico',
          userId,
        },
      );
    }

    queryBuilder.orderBy('note.createdAt', 'DESC').take(limit).skip(offset);

    const notes = await queryBuilder.getMany();
    return this.normalizeNotes(notes, userId, false);
  }

  private normalizeNotes(
    notes: any[],
    userId?: number,
    includeContents: boolean = false,
  ) {
    return notes.map((note) => ({
      id: note.id,
      title: note.title,
      description: note.description || '',
      area: note.area || '',
      tema: note.tema || '',
      levelOfDetail: note.levelOfDetail || '',
      code: note.code,
      acceso: note.acceso,
      userId: note.userId,
      createdAt: note.createdAt,
      totalSections: note.contents?.length || 0,
      canDelete: userId === note.userId,
      contents: includeContents ? note.contents : [],
    }));
  }

  async deleteAll(
    userId: number,
  ): Promise<{ deleted: boolean; message: string }> {
    const notes = await this.noteRepo.find({
      where: { userId },
      select: ['id'],
    });
    const noteIds = notes.map((n) => n.id);
    if (noteIds.length > 0) {
      await this.noteContentRepo.delete({ noteId: In(noteIds) } as any);
      await this.noteRepo.delete({ userId });
    }
    return { deleted: true, message: 'All notes deleted' };
  }
}
