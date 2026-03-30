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

      const response = (await this.groqService.generateNote(
        promptText,
        numberOfNotes,
        level,
      )) as Record<string, unknown> & { error?: boolean; message?: string };

      if (response?.error === true) {
        throw new BadRequestException(
          String(response.message || response['detail'] || 'Error generando notas'),
        );
      }

      const meta = (response.metadata || {}) as Record<string, unknown>;
      const title = (meta.title as string) || 'Notas generadas';
      const description = (meta.description as string) || '';
      const area = meta.area as string | undefined;
      const tema = meta.tema as string | undefined;

      let blocks = this.normalizeAiNoteItems(response.notes);
      if (blocks.length === 0) {
        throw new BadRequestException(
          'La IA no devolvió notas en el formato esperado (array "notes").',
        );
      }

      const createdNotes: Note[] = [];
      for (const block of blocks) {
        const note = this.noteRepo.create({
          title,
          description,
          levelOfDetail: level,
          userId,
          code: await this.generateCode(),
          acceso,
          createdAt: new Date(),
          area,
          tema,
        });

        const savedNote = await this.noteRepo.save(note);

        const noteContent = this.noteContentRepo.create({
          tema: block.sectionTitle || tema || title,
          content: block.markdown,
          order: 0,
          noteId: savedNote.id,
          userId,
        } as any);

        await this.noteContentRepo.save(noteContent as any);

        const fullNote = await this.noteRepo.findOne({
          where: { id: savedNote.id },
          relations: ['noteContents'],
        });
        if (fullNote) createdNotes.push(fullNote);
      }

      return {
        success: true,
        notes: createdNotes,
        message: 'Notas creadas correctamente',
        data: createdNotes,
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
    return this.findAll(userId);
  }

  async findPublic(userId?: number) {
    const notes = await this.noteRepo.find({
      relations: ['noteContents'],
      order: { createdAt: 'DESC' },
    });
    const publicNotes = notes.filter((note) => this.isPublicAccess(note.acceso));
    return this.noteRefactorArray(publicNotes, userId);
  }

  /**
   * Refactor de Note para frontend - solo devuelve datos necesarios para mostrar
   * Excluye: code, userId, levelOfDetail (datos sensibles/internos)
   */
  noteRefactor(note: Note, userId?: number): {
    id: number;
    title: string;
    description: string;
    area?: string;
    tema?: string;
    acceso: string;
    createdAt: Date;
    noteContents: Array<{ id: number; content: string }>;
    canDelete: boolean;
  } {
    return {
      id: note.id,
      title: note.title,
      description: note.description,
      area: note.area,
      tema: note.tema,
      acceso: note.acceso,
      createdAt: note.createdAt,
      noteContents: note.noteContents?.map((nc) => ({
        id: nc.id,
        content: nc.content,
      })) ?? [],
      canDelete: userId ? note.userId === userId : false,
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
    const note = await this.findOne(id, userId);
    if (!note) throw new NotFoundException('Note not found');
    await this.noteContentRepo.delete({ noteId: id } as any);
    await this.noteRepo.delete(id);
    return { message: 'Eliminado' };
  }
}
