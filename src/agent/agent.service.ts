import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiRouterService } from '../ai/ai-router.service';
import { Content } from '../ai/ai-provider.interface';
import { CreditsService } from '../credits/credits.service';
import { ExamsService } from '../exams/exams.service';
import { FlashCardsService } from '../flash-cards/flash-cards.service';
import { NotesService } from '../notes/notes.service';
import {
  calculateExamCost,
  calculateFlashcardCost,
  calculateNoteCost,
} from '../credits/credits.service';

export interface AgentTool {
  name: string;
  args: Record<string, any>;
}

export interface AgentClassification {
  needsTools: boolean;
  tools: AgentTool[];
  directAnswer: boolean;
  confidence: number;
}

export interface ToolResult {
  name: string;
  success: boolean;
  summary: string;
  data?: any;
}

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly MAX_TOOLS_PER_MESSAGE = 3;
  private readonly MAX_QUESTIONS_AGENT = 10;

  constructor(
    private readonly aiRouter: AiRouterService,
    private readonly creditsService: CreditsService,
    private readonly examsService: ExamsService,
    private readonly flashCardsService: FlashCardsService,
    private readonly notesService: NotesService,
  ) {}

  async classifyIntent(
    prompt: string,
    history: Content[] = [],
    userId?: number,
  ): Promise<AgentClassification> {
    const routerPrompt = this.buildRouterPrompt(prompt, history);
    try {
      const result = await this.aiRouter.chat(
        routerPrompt,
        undefined,
        undefined,
        userId,
      );
      return this.parseAgentResponse(result.response);
    } catch (e) {
      this.logger.error(`Intent classification failed: ${e}`);
      return { needsTools: false, tools: [], directAnswer: true, confidence: 0 };
    }
  }

  private buildRouterPrompt(prompt: string, history: Content[]): string {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map(
          (h) =>
            `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.parts.map((p) => p.text ?? '').join(' ')}`,
        )
        .join('\n');
    }
    return `Analiza el siguiente mensaje de usuario y decide si necesita ejecutar herramientas o puede responder directamente.

Reglas:
- Si pide CREAR examen, quiz, test, evaluación, flashcards, tarjetas, notas, apuntes o resumen guardable → herramientas.
- Si pide explicar algo, saludar, debatir, definir o resolver una duda puntual → respuesta directa.
- Máximo 3 herramientas por mensaje.
- Para examen usa generate_exam con {reference, numberOfQuestions (max 10), difficulty (very_easy|easy|medium|hard|very_hard|expert), type (quiz|icfes)}.
- Para flashcards usa generate_flashcards con {reference, quantity (max 10)}.
- Para notas usa generate_notes con {reference, numberOfNotes (max 3), levelOfDetail (breve|medio|detallado)}.

Historial reciente:
${historyText}

Mensaje actual: ${prompt}

Responde SOLO con JSON:
{"needsTools": bool, "tools": [{"name": "generate_exam|generate_flashcards|generate_notes", "args": {...}}], "directAnswer": bool}
Si es respuesta directa: {"needsTools": false, "tools": [], "directAnswer": true}`;
  }

  private parseAgentResponse(response: string): AgentClassification {
    try {
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const parsed = JSON.parse(response.substring(start, end + 1));
        const tools = Array.isArray(parsed.tools)
          ? parsed.tools.filter(
              (t: any) =>
                t &&
                typeof t.name === 'string' &&
                ['generate_exam', 'generate_flashcards', 'generate_notes'].includes(t.name),
            )
          : [];
        return {
          needsTools: !!parsed.needsTools && tools.length > 0,
          tools,
          directAnswer: parsed.directAnswer ?? tools.length === 0,
          confidence: parsed.confidence ?? 0.5,
        };
      }
    } catch {}
    return { needsTools: false, tools: [], directAnswer: true, confidence: 0 };
  }

  /**
   * Orquesta el chat agente. NO consume el crédito base CHAT_MESSAGE
   * (lo hace messages.service antes de llamar). Aquí solo se cobran
   * los extras de generación (1 mensaje + costo real, tope 10).
   * Emite eventos SSE ya formateados como string.
   */
  async *executeAgentChat(
    prompt: string,
    history: Content[] = [],
    userId?: number,
  ): AsyncGenerator<string> {
    this.logger.log(`Agent chat: ${prompt.substring(0, 80)}`);

    const classification = await this.classifyIntent(prompt, history, userId);

    if (!classification.needsTools || classification.tools.length === 0) {
      for await (const c of this.aiRouter.chatStream(
        prompt,
        history,
        undefined,
        userId,
      )) {
        yield sse({ type: 'chunk', content: c.content });
      }
      return;
    }

    const tools = classification.tools.slice(0, this.MAX_TOOLS_PER_MESSAGE);
    const toolResults: ToolResult[] = [];

    for (const tool of tools) {
      yield sse({ type: 'tool', toolName: tool.name, status: 'start' });
      try {
        const result = await this.executeTool(tool, userId);
        toolResults.push(result);
        yield sse({
          type: 'tool',
          toolName: tool.name,
          status: 'done',
          resultSummary: result.summary,
        });
        if (result.success && result.data?.action) {
          yield sse({ type: 'action', ...result.data.action });
        }
      } catch (e: any) {
        const msg = e?.message || 'Error ejecutando herramienta';
        toolResults.push({ name: tool.name, success: false, summary: msg });
        yield sse({
          type: 'tool',
          toolName: tool.name,
          status: 'error',
          resultSummary: msg,
        });
      }
    }

    const synthPrompt = this.buildSynthesisPrompt(prompt, toolResults);
    for await (const c of this.aiRouter.chatStream(
      synthPrompt,
      history,
      undefined,
      userId,
    )) {
      yield sse({ type: 'chunk', content: c.content });
    }

    this.logger.log(`Agent chat done: ${toolResults.length} tools`);
  }

  private async executeTool(
    tool: AgentTool,
    userId?: number,
  ): Promise<ToolResult> {
    const { name, args = {} } = tool;

    switch (name) {
      case 'generate_exam': {
        const num = Math.min(
          Number(args.numberOfQuestions) || 10,
          this.MAX_QUESTIONS_AGENT,
        );
        const diff = args.difficulty || 'medium';
        const type = args.type === 'icfes' ? 'icfes' : 'quiz';
        const reference = args.reference || args.topic || '';
        if (!reference.trim()) {
          throw new BadRequestException('Falta el tema del examen');
        }
        if (userId) {
          const cost = calculateExamCost(num, diff, reference);
          await this.creditsService.consumeCredits(
            userId,
            'EXAM_GENERATION',
            cost,
          );
        }
        const exam =
          type === 'icfes'
            ? await this.aiRouter.generateIcfesExam(
                reference,
                num,
                diff,
                undefined,
                userId,
              )
            : await this.aiRouter.generateExam(
                reference,
                num,
                diff,
                undefined,
                userId,
              );
        // Persistir en la biblioteca del usuario
        let examId: number | undefined;
        if (userId) {
          const saved: any = await this.examsService.saveGeneratedExam(
            exam,
            { difficulty: diff, type },
            userId,
          );
          examId = saved?.id;
        }
        return {
          name,
          success: true,
          summary: `Examen "${exam.metadata.title}" con ${exam.questions.length} preguntas`,
          data: {
            title: exam.metadata.title,
            action: {
              kind: 'exam_created',
              title: exam.metadata.title,
              id: examId,
            },
          },
        };
      }
      case 'generate_flashcards': {
        const quantity = Math.min(
          Number(args.quantity) || 5,
          this.MAX_QUESTIONS_AGENT,
        );
        const reference = args.reference || args.topic || '';
        if (!reference.trim()) {
          throw new BadRequestException('Falta el tema de las flashcards');
        }
        if (userId) {
          const cost = calculateFlashcardCost(quantity, reference);
          await this.creditsService.consumeCredits(
            userId,
            'FLASHCARD_GENERATION',
            cost,
          );
        }
        const cards = await this.aiRouter.generateFlashcards(
          reference,
          quantity,
          undefined,
          userId,
        );
        // Persistir en la biblioteca del usuario
        let cardId: number | undefined;
        if (userId) {
          const saved: any = await this.flashCardsService.create(
            {
              title: cards.metadata.title,
              description: cards.metadata.description ?? '',
              tema: reference,
              flashcards: cards.cards.map((c) => ({
                front: c.front,
                back: c.back,
                hint: c.hint,
              })),
            },
            userId,
          );
          cardId = saved?.id;
        }
        return {
          name,
          success: true,
          summary: `${cards.cards.length} flashcards: "${cards.metadata.title}"`,
          data: {
            title: cards.metadata.title,
            action: {
              kind: 'flashcards_created',
              title: cards.metadata.title,
              id: cardId,
            },
          },
        };
      }
      case 'generate_notes': {
        const num = Math.min(Number(args.numberOfNotes) || 1, 3);
        const detail = args.levelOfDetail || 'medio';
        const reference = args.reference || args.topic || '';
        if (!reference.trim()) {
          throw new BadRequestException('Falta el tema de las notas');
        }
        if (userId) {
          const cost = calculateNoteCost(detail, reference);
          await this.creditsService.consumeCredits(
            userId,
            'NOTE_GENERATION',
            cost,
          );
        }
        const notes = await this.aiRouter.generateNote(
          reference,
          num,
          detail,
          undefined,
          userId,
        );
        // Persistir en la biblioteca del usuario
        let noteId: number | undefined;
        if (userId) {
          const saved: any = await this.notesService.create(
            {
              title: notes.metadata.title,
              description: notes.metadata.description ?? '',
              levelOfDetail: detail,
              noteContents: notes.notes.map((n, i) => ({
                tema: n.topic ?? n.title ?? reference,
                content: n.content,
                order: i,
              })),
            },
            userId,
          );
          noteId = saved?.id;
        }
        return {
          name,
          success: true,
          summary: `${notes.notes.length} notas sobre "${reference}"`,
          data: {
            title: notes.metadata.title,
            action: {
              kind: 'notes_created',
              title: notes.metadata.title,
              id: noteId,
            },
          },
        };
      }
      default:
        throw new BadRequestException(`Herramienta desconocida: ${name}`);
    }
  }

  private buildSynthesisPrompt(
    prompt: string,
    toolResults: ToolResult[],
  ): string {
    const resultsText = toolResults
      .map((r) => `- ${r.name}: ${r.summary}`)
      .join('\n');
    return `Basándote en los resultados de las herramientas, responde al usuario de forma natural y útil.

Resultados de acciones:
${resultsText}

Mensaje original del usuario: ${prompt}

Responde:
- Resume qué se hizo
- Si creó contenido, explica cómo verlo en su biblioteca
- Si hubo errores de créditos, explícalo con amabilidad
- Sé conciso y directo`;
  }
}
