import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
import { AI_PROMPTS } from '../groq/AI_PROMPTS';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';
import { NoteContent } from './entities/note-content.entity';

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
    } catch (e) {
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
      } catch (e2) {
        return null;
      }
    }
  }

  // ==================== GENERATE NOTE FROM TOPIC ====================
  async generateFromTopic(
    input: {
      topic: string;
      numberOfNotes: number;
      levelOfDetail: 'breve' | 'medio' | 'detallado';
    },
    userId: number,
  ) {
    if (!input.topic || input.numberOfNotes <= 0) {
      throw new BadRequestException(
        'Topic and valid numberOfNotes are required',
      );
    }

    if (!['breve', 'medio', 'detallado'].includes(input.levelOfDetail)) {
      throw new BadRequestException(
        'Invalid levelOfDetail. Must be: breve, medio, or detallado',
      );
    }

    try {
      const response = await this.groqService.generateNoteFromTopic(
        input.topic,
        input.numberOfNotes,
        input.levelOfDetail,
      );

      if (!response?.notes || !Array.isArray(response.notes)) {
        throw new BadRequestException('Invalid AI response format');
      }

      // Generar título y descripción por IA
      const title = await this.groqService.generateNoteTitle(input.topic);
      const description = await this.groqService.generateNoteDescription(
        input.topic,
        input.levelOfDetail,
      );

      const createdNotes = [];
      for (const noteData of response.notes) {
        const note = this.noteRepo.create({
          title: title,
          description: description,
          levelOfDetail: input.levelOfDetail || 'medio',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        await this.noteRepo.save(note);

        if (Array.isArray(noteData.contents)) {
          let order = 0;
          for (const content of noteData.contents) {
            const noteContent = this.noteContentRepo.create({
              title: noteData.title,
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

  // ==================== GENERATE NOTE FROM REFERENCE ====================
  async generateFromReference(
    input: {
      referenceText: string;
      numberOfNotes: number;
      levelOfDetail: 'breve' | 'medio' | 'detallado';
    },
    userId: number,
  ) {
    if (!input.referenceText || input.numberOfNotes <= 0) {
      throw new BadRequestException(
        'Reference text and valid numberOfNotes are required',
      );
    }

    if (!['breve', 'medio', 'detallado'].includes(input.levelOfDetail)) {
      throw new BadRequestException(
        'Invalid levelOfDetail. Must be: breve, medio, or detallado',
      );
    }

    try {
      const response = await this.groqService.generateNoteFromReference(
        input.referenceText,
        input.numberOfNotes,
        input.levelOfDetail,
      );

      if (!response?.notes || !Array.isArray(response.notes)) {
        throw new BadRequestException('Invalid AI response format');
      }

      // Generar título y descripción por IA
      const title = await this.groqService.generateNoteTitle(
        'Reference-based Notes',
      );
      const description = await this.groqService.generateNoteDescription(
        'From Reference',
        input.levelOfDetail,
      );

      const createdNotes = [];
      for (const noteData of response.notes) {
        const note = this.noteRepo.create({
          title: title,
          description: description,
          levelOfDetail: input.levelOfDetail || 'medio',
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        await this.noteRepo.save(note);

        if (Array.isArray(noteData.contents)) {
          let order = 0;
          for (const content of noteData.contents) {
            const noteContent = this.noteContentRepo.create({
              title: noteData.title,
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
        `Error generating notes from reference: ${error.message}`,
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

  async findOne(id: number, userId: number) {
    const note = await this.noteRepo.findOne({
      where: { id, userId },
      relations: ['noteContents'],
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto, userId: number) {
    const note = await this.findOne(id, userId);
    Object.assign(note, updateNoteDto);
    note.updatedAt = new Date();
    return this.noteRepo.save(note);
  }

  async remove(id: number, userId: number) {
    const note = await this.findOne(id, userId);
    await this.noteContentRepo.delete({ noteId: id } as any);
    await this.noteRepo.delete(id);
    return { success: true, deletedId: id };
  }
}
