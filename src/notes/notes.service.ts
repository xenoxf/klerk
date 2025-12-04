import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { GroqService } from '../groq/groq.service';
import { AI_PROMPTS } from '../groq/AI_PROMPTS';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private noteRepo: Repository<Note>,
    private readonly groqService: GroqService,
  ) {}

  // ================================================================
  //                    GENERAR NOTAS CON IA
  // ================================================================

  async generateNotes(dto: CreateNoteDto, userId: number) {
    const { numberOfNotes, levelOfDetail, tema, textoReferencia } = dto;

    if (!tema && !textoReferencia) {
      throw new BadRequestException(
        "Debes enviar 'tema' o 'textoReferencia' para generar notas."
      );
    }

    // Prompt para la IA
    const prompt = `
Eres un generador de notas académico. 
Crea exactamente ${numberOfNotes} secciones de notas.
Nivel de detalle: "${levelOfDetail}".
si nivel de detalle es "breve", las secciones deben ser breves y concisas.
si nivel de detalle es "medio", las secciones deben tener explicaciones claras y ejemplos.
si nivel de detalle es "alto", las secciones deben ser exhaustivas, con análisis profundos y múltiples ejemplos.

${tema ? `Tema principal: ${tema}` : ""}
${textoReferencia ? `Texto de referencia:\n${textoReferencia}` : ""}

REGLAS IMPORTANTES:
- Devuelve exclusivamente JSON válido.
- No incluyas texto fuera del JSON.
- Cada sección debe ser clara y educativa.
- Cada sección debe tener:
  - "title": string
  - "content": string
  - "type": "text"
  - "order": número incremental desde 1

Formato EXACTO del JSON:

{
  "title": "Titulo general de la nota",
  "levelOfDetail": "breve | medio | alto",
  "numberOfSections": número,
  "contents": [
    {
      "title": "Título de sección",
      "content": "Contenido de la sección...",
      "type": "text",
      "order": 1
    }
  ]
}
`;

    // Llamada al modelo IA
    const response = await this.groqService.chat(prompt);

    // Parseamos JSON: groqService.chat ya intenta parsear y devuelve el objeto JSON o un objeto con error
    let json;
    if (response && (response as any).type === 'answer' && (response as any).success === false) {
      console.error(response);
      throw new BadRequestException('La IA devolvió JSON inválido.');
    }
    json = response;

    // =================================================================
    //                   GUARDAR LA NOTA PRINCIPAL
    // =================================================================
    const note = this.noteRepo.create({
      title: json.title,
      levelOfDetail: levelOfDetail as 'breve' | 'medio' | 'alto',
      userId,
    } as Partial<Note>);

    const savedNote = await this.noteRepo.save(note);

    return {
      message: 'Notas generadas correctamente',
      noteId: savedNote.id,
      totalSections: json.contents.length,
    };
  }

  async generateNoteFromTopic(input: { topic: string }, userId: number) {
    if (!input.topic) {
      throw new BadRequestException('Topic is required');
    }

    const prompt = AI_PROMPTS.generateNoteFromTopic(input.topic);

    try {
      const response = await this.groqService.chat(prompt);

      if (!response || typeof response !== 'object') {
        throw new BadRequestException('Invalid AI response format');
      }

      const { title, content, tags } = response as any;

      if (!title || !content) {
        throw new BadRequestException('AI response missing title or content');
      }

      const note = this.noteRepo.create({
        title,
        content,
        tags: tags || [input.topic],
        userId,
      });

      return await this.noteRepo.save(note);
    } catch (error) {
      throw new BadRequestException(`Failed to generate note: ${error.message}`);
    }
  }

  async generateNoteFromReference(input: { referenceText: string }, userId: number) {
    if (!input.referenceText) {
      throw new BadRequestException('Reference text is required');
    }

    const prompt = AI_PROMPTS.generateNoteFromReference(input.referenceText);

    try {
      const response = await this.groqService.chat(prompt);

      if (!response || typeof response !== 'object') {
        throw new BadRequestException('Invalid AI response format');
      }

      const { title, content, tags } = response as any;

      if (!title || !content) {
        throw new BadRequestException('AI response missing required fields');
      }

      const note = this.noteRepo.create({
        title,
        content,
        tags: tags || ['generated'],
        userId,
      });

      return await this.noteRepo.save(note);
    } catch (error) {
      throw new BadRequestException(`Failed to generate note from reference: ${error.message}`);
    }
  }

  // ================================================================
  //                        MÉTODOS CRUD
  // ================================================================

  findAll(userId?: number) {
    if (userId)
      return this.noteRepo.find({
        where: { userId },
        relations: ['noteContents'],
      });

    return this.noteRepo.find({ relations: ['noteContents'] });
  }

  findOne(id: number, userId?: number) {
    return this.noteRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
      relations: ['noteContents'],
    });
  }

  async remove(id: number, userId?: number) {
    const note = await this.noteRepo.findOne({
      where: { id, ...(userId ? { userId } : {}) },
    });

    if (!note) return null;

    await this.noteRepo.delete(id);

    return { removed: true, id };
  }

  // ================================================================
  //                  MÉTODOS CON FILTROS INTELIGENTES
  // ================================================================

  async create(input: { title: string; content: string; color?: string; tags?: string[] }, userId: number): Promise<Note> {
    if (!input.title || !input.content) {
      throw new BadRequestException('Title and content are required');
    }

    const note = this.noteRepo.create({
      title: input.title,
      levelOfDetail: 'medio',
      userId,
    });

    return this.noteRepo.save(note);
  }

  async getAll(
    filters: {
      search?: string;
      tags?: string;
      color?: string;
      sort?: 'newest' | 'oldest' | 'updated';
      page?: number;
      limit?: number;
    },
    userId: number
  ): Promise<Note[]> {
    const query = this.noteRepo.createQueryBuilder('note').where('note.userId = :userId', { userId });

    if (filters.search) {
      const q = `%${filters.search.toLowerCase()}%`;
      query.andWhere('LOWER(note.title) LIKE :search', { search: q });
    }

    // Sort
    const sort = filters.sort || 'newest';
    if (sort === 'newest') {
      query.orderBy('note.createdAt', 'DESC');
    } else if (sort === 'oldest') {
      query.orderBy('note.createdAt', 'ASC');
    } else if (sort === 'updated') {
      query.orderBy('note.updatedAt', 'DESC');
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    return query.skip(skip).take(limit).getMany();
  }

  async getById(id: number, userId: number): Promise<Note> {
    const note = await this.noteRepo.findOne({
      where: { id, userId },
      relations: ['noteContents'],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async update(
    id: number,
    input: { title?: string; content?: string; color?: string; tags?: string[] },
    userId: number
  ): Promise<Note> {
    const note = await this.getById(id, userId);

    if (input.title) note.title = input.title;
    note.updatedAt = new Date();

    return this.noteRepo.save(note);
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    const note = await this.noteRepo.findOne({
      where: { id, userId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    await this.noteRepo.delete(id);

    return { message: 'Note deleted' };
  }

  async search(
    { query, tags, color }: { query?: string; tags?: string; color?: string },
    userId: number
  ): Promise<Note[]> {
    const queryBuilder = this.noteRepo.createQueryBuilder('note').where('note.userId = :userId', { userId });

    if (query) {
      const q = `%${query.toLowerCase()}%`;
      queryBuilder.andWhere('LOWER(note.title) LIKE :search', { search: q });
    }

    return queryBuilder.getMany();
  }
}
