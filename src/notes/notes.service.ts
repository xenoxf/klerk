import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
//import { AI_PROMPTS } from '../groq/AI_PROMPTS';
import { Note } from './entities/note.entity';
import { NoteContent } from './entities/note-content.entity';
import { GenerateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    @InjectRepository(NoteContent)
    private readonly noteContentRepo: Repository<NoteContent>,
  ) {}

  private parseJSON(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
      } catch {
        return null;
      }
    }
  }

  private isPublicAccess(acceso?: string | null): boolean {
    const normalized = (acceso ?? '').toLowerCase();
    return normalized === 'public' || normalized === 'publico';
  }

  private async generateCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.noteRepo.findOne({ where: { code } });
    if (existing) return this.generateCode();
    return code;
  }

  private resolveNotePrompt(input: GenerateNoteDto): string {
    const parts = [input.reference, input.referenceText, input.topic]
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim());
    const ref = parts[0];
    if (!ref) {
      throw new BadRequestException(
        'Debe enviar reference, referenceText o topic para generar notas.',
      );
    }
    return ref;
  }

  /** Normaliza lo que devuelve la IA: strings markdown o bloques { title, contents[] }. */
  private normalizeAiNoteItems(rawNotes: unknown): Array<{
    markdown: string;
    sectionTitle?: string;
  }> {
    if (!Array.isArray(rawNotes)) return [];
    const out: Array<{ markdown: string; sectionTitle?: string }> = [];
    for (const item of rawNotes) {
      if (typeof item === 'string') {
        out.push({ markdown: item });
        continue;
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        if (Array.isArray(o.contents)) {
          const title = typeof o.title === 'string' ? o.title : undefined;
          const chunks: string[] = [];
          for (const block of o.contents) {
            if (!block || typeof block !== 'object') continue;
            const b = block as Record<string, unknown>;
            const type = typeof b.type === 'string' ? b.type : 'text';
            const c = b.content;
            const text = Array.isArray(c)
              ? c.map((x) => String(x)).join('\n')
              : String(c ?? '');
            chunks.push(`**${type}**\n\n${text}`);
          }
          out.push({
            markdown: chunks.join('\n\n'),
            sectionTitle: title,
          });
        } else if (typeof o.markdown === 'string') {
          out.push({
            markdown: o.markdown,
            sectionTitle: typeof o.title === 'string' ? o.title : undefined,
          });
        } else {
          out.push({ markdown: JSON.stringify(item, null, 2) });
        }
      }
    }
    return out;
  }

  // ==================== GENERATE NOTE FROM TOPIC / REFERENCE ====================
  async generateNote(input: GenerateNoteDto, userId: number) {
    try {
      const promptText = this.resolveNotePrompt(input);
      const numberOfNotes = input.numberOfNotes ?? 3;
      const level = input.levelOfDetail ?? 'medio';
      const acceso = input.acceso === 'public' ? 'public' : 'private';

      const response = await this.groqService.generateNote(
        promptText,
        numberOfNotes,
        level,
      );

      const meta = (response.metadata || {}) as Record<string, unknown>;
      const title = meta.title as string;
      const description = (meta.description as string) || '';
      const area = meta.area as string | undefined;
      const tema = meta.tema as string | undefined;

      const rawNotes = response.notes;
      const normalizedNotes = this.normalizeAiNoteItems(rawNotes);

      // Create the note first
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

      // Create note contents
      if (normalizedNotes.length > 0) {
        for (let i = 0; i < normalizedNotes.length; i++) {
          const item = normalizedNotes[i];
          const noteContent = this.noteContentRepo.create({
            content: item.markdown,
            noteId: savedNote.id,
            userId,
          });
          await this.noteContentRepo.save(noteContent);
        }
      }

      return {
        message: 'Notas creadas correctamente',
        noteId: savedNote.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error al generar notas',
      );
    }
  }
  // ==================== BASIC CRUD ====================
  async findAll(userId: number) {
    const notes = await this.noteRepo.find({
      where: { userId },
      relations: ['noteContents'],
      order: { createdAt: 'DESC' },
    });
    return this.noteRefactorArray(notes, userId);
  }

  async findPrivate(userId: number) {
    const notes = await this.findAll(userId);
    // Randomize order
    return this.shuffleArray(notes);
  }

  async findPublic(userId?: number) {
    const notes = await this.noteRepo.find({
      relations: ['noteContents'],
      order: { createdAt: 'DESC' },
    });
    const publicNotes = notes.filter((note) =>
      this.isPublicAccess(note.acceso),
    );
    const result = this.noteRefactorArray(publicNotes, userId);
    // Randomize order
    return this.shuffleArray(result);
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

  /**
   * Refactor de Note para frontend - solo devuelve datos necesarios para mostrar
   * Excluye: code, userId, levelOfDetail (datos sensibles/internos)
   */
  noteRefactor(
    note: Note,
    userId?: number,
  ): {
    id: number;
    title: string;
    description: string;
    area?: string;
    tema?: string;
    acceso: string;
    createdAt: Date;
    noteContents: Array<{ id: number; content: string }>;
    canDelete: boolean;
    contentsCount: number;
  } {
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
      contentsCount: note.noteContents.length,
    };
  }

  noteRefactorArray(notes: Note[], userId?: number) {
    return notes.map((note) => this.noteRefactor(note, userId));
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
      relations: ['noteContents'],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (!this.isPublicAccess(note.acceso) && note.userId !== userId) {
      throw new UnauthorizedException('No tienes acceso a esta nota');
    }
    return this.noteRefactor(note, userId);
  }

  async findOneByCode(code: string, userId?: number) {
    const note = await this.noteRepo.findOne({
      where: { code },
      relations: ['noteContents'],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (!this.isPublicAccess(note.acceso) && note.userId !== userId) {
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
      acceso: payload.acceso ?? 'private',
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

  // ==================== INTELLIGENT SEARCH ====================

  /**
   * Búsqueda inteligente de notas con soporte para:
   * - Búsqueda por texto en título, descripción, tema y área
   * - Búsqueda por código exacto
   * - Búsqueda en contenido de las notas
   * - Paginación con offset y limit (20 items por página)
   */
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
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
      return this.normalizeNotes(notes, userId, false);
    }

    const normalizedQuery = query.trim().toLowerCase();

    const queryBuilder = this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.contents', 'contents')
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
      queryBuilder.orWhere('LOWER(contents.content) LIKE :query', {
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
}
