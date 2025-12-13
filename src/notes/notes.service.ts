import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
//import { CreateNoteDto } from './dto/create-note.dto';
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

    const instruction = `Eres un experto educativo. Genera ${input.numberOfNotes} nota(s) académica(s) detallada(s) en formato JSON únicamente sobre el tema: "${input.topic}".

Nivel de detalle: ${input.levelOfDetail}.

El JSON debe tener SOLO un array "notes" donde cada elemento tiene: { title: string (título descriptivo), contents: array de { type: "text"|"list"|"code", content: string | string[] } }.

Responde SOLO con JSON válido, sin marcas de código.`;

    try {
      const aiRaw = await this.groqService.chat(instruction);
      const parsed = this.parseJSON(aiRaw);

      if (!parsed?.notes || !Array.isArray(parsed.notes)) {
        throw new BadRequestException('Invalid AI response format');
      }

      const createdNotes = [];
      for (const noteData of parsed.notes) {
        const note = this.noteRepo.create({
          title: noteData.title || 'Sin título',
          levelOfDetail: input.levelOfDetail || 'medio',
          userId,
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

    const instruction = `Eres un experto educativo. Analiza el siguiente texto y genera ${input.numberOfNotes} nota(s) académica(s) estructurada(s) en formato JSON únicamente.

Texto de referencia: "${input.referenceText}"

Nivel de detalle: ${input.levelOfDetail}.

El JSON debe tener SOLO un array "notes" donde cada elemento tiene: { title: string (título clave del texto), contents: array de { type: "text"|"list"|"code", content: string | string[] } }.

Las notas deben capturar los conceptos más importantes del texto.

Responde SOLO con JSON válido, sin marcas de código.`;

    try {
      const aiRaw = await this.groqService.chat(instruction);
      const parsed = this.parseJSON(aiRaw);

      if (!parsed?.notes || !Array.isArray(parsed.notes)) {
        throw new BadRequestException('Invalid AI response format');
      }

      const createdNotes = [];
      for (const noteData of parsed.notes) {
        const note = this.noteRepo.create({
          title: noteData.title || 'Sin título',
          levelOfDetail: input.levelOfDetail || 'medio',
          userId,
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
