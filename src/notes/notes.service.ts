import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroqService } from 'src/groq/groq.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './entities/note.entity';
import { NoteContent } from './entities/note-content.entity';

@Injectable()
export class NotesService {
  constructor(
    private readonly groqService: GroqService,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    @InjectRepository(NoteContent) private readonly noteContentRepo: Repository<NoteContent>,
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
      tittle: json.title,
      levelOfDetail,
      userId,
    });

    const savedNote = await this.noteRepo.save(note);

    // =================================================================
    //                   GUARDAR CONTENIDO DE NOTAS
    // =================================================================
    for (const block of json.contents) {
      const content = this.noteContentRepo.create({
        title: block.title,
        content: block.content,
        type: block.type || 'text',
        order: block.order,
        noteId: savedNote.id,
        userId,
      });

      await this.noteContentRepo.save(content);
    }

    return {
      message: 'Notas generadas correctamente',
      noteId: savedNote.id,
      totalSections: json.contents.length,
    };
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

    await this.noteContentRepo.delete({ noteId: id } as any);
    await this.noteRepo.delete(id);

    return { removed: true, id };
  }
}
