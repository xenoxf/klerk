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

  // ==================== GENERATE NOTE FROM TOPIC ====================
  async generateNote(input: GenerateNoteDto, userId: number) {
    try {
      const response = await this.groqService.generateNote(
        input.reference,
        input.numberOfNotes,
        input.levelOfDetail,
      );

      if (!response?.notes || !Array.isArray(response.notes)) {
        throw new BadRequestException('Invalid AI response format');
      }

      const { title, description, area, tema } = response.metadata;

      const createdNotes = [];
      for (const noteData of response.notes) {
        const note = this.noteRepo.create({
          title,
          description,
          levelOfDetail: input.levelOfDetail,
          userId,
          code: await this.generateCode(),
          acceso: 'private',
          createdAt: new Date(),
          area,
          tema,
        });
        await this.noteRepo.save(note);

        if (Array.isArray(noteData.contents)) {
          let order = 0;
          for (const content of noteData.contents) {
            const noteContent = this.noteContentRepo.create({
              tema: noteData.title,
              content: Array.isArray(content.content)
                ? JSON.stringify(content.content)
                : content.content,
              type: content.type || 'text',
              order,
              noteId: (note as any).id,
              userId,
            } as any);
            await this.noteContentRepo.save(noteContent as any);
            order++;
          }
        }

        const savedNote = await this.noteRepo.findOne({
          where: { id: (note as any).id },
          relations: ['noteContents'],
        });
        createdNotes.push(savedNote);
      }

      return { success: true, notes: createdNotes };
    } catch (error) {
      throw new BadRequestException(
        `Error generating notes from topic: ${error.message}`,
      );
    }
  }
  // ==================== BASIC CRUD ====================
  async findAll(userId: number) {
    return this.noteRepo.find({
      where: { userId },
      relations: ['noteContents'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPrivate(userId: number) {
    return this.findAll(userId);
  }

  async findPublic() {
    const notes = await this.noteRepo.find({
      relations: ['noteContents'],
      order: { createdAt: 'DESC' },
    });
    return notes.filter((note) => this.isPublicAccess(note.acceso));
  }

  async findOne(id: number, userId: number) {
    const note = await this.noteRepo.findOne({
      where: { id, userId },
      relations: ['noteContents'],
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
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
    return note;
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
    return note;
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
    const note = await this.findOne(id, userId);
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
