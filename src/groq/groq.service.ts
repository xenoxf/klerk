import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROMPTS } from '../gemini/AI_PROMPTS';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_TEXT_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
] as const;

const DEFAULT_VISION_MODEL = 'qwen/qwen3.6-27b';

type ModelName = string;

export interface AiMetadata {
  title: string;
  description: string;
  area?: string;
  tema?: string;
}

export interface ExamResponse {
  questions: Array<{
    question: string;
    explanation: string;
    contextId?: string;
    contextContent?: string;
    options: Array<{
      text: string;
      isCorrect: boolean;
      feedback: string;
    }>;
  }>;
  metadata: AiMetadata;
}

export interface NoteResponse {
  notes: Array<{
    title: string;
    content: string;
    topic?: string;
  }>;
  metadata: AiMetadata;
}

export interface CardResponse {
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
  }>;
  metadata: AiMetadata;
}

/**
 * Tipo compatible con el antiguo `Content` de `@google/generative-ai`.
 * Se mantiene para no romper `messages.service.ts` y otros consumidores.
 */
export interface Content {
  role: string;
  parts: Array<{ text?: string }>;
}

export interface FileInput {
  fileBase64: string;
  mimeType: string;
}

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      >;
};

/**
 * El extractor ahora es mínimo. Solo encuentra los límites del objeto.
 * NO limpia ni modifica el contenido interno (Markdown manda).
 */
class JsonExtractor {
  static extract(raw: string): string {
    if (!raw) return '';
    let text = raw.trim();
    text = text.replace(/```json\s*/gi, '').replace(/```/g, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }
    return text;
  }
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiKeys: string[];
  private currentKeyIndex = 0;
  private readonly textModels: ModelName[];
  private readonly visionModel: ModelName;

  constructor(private readonly configService: ConfigService) {
    const keys = [
      this.configService.get<string>('GROQ_API_KEY'),
      this.configService.get<string>('GROQ_API_KEY_2'),
    ];
    this.apiKeys = keys.filter(
      (key): key is string => !!key && key !== 'undefined',
    );

    // NUNCA tumbar el arranque por keys faltantes: se degrada y el router
    // usa otro proveedor. Solo se falla al intentar llamar sin keys.
    if (this.apiKeys.length === 0) {
      this.logger.error(
        'Sin GROQ_API_KEY: el proveedor Groq queda deshabilitado hasta configurar keys.',
      );
    } else if (this.apiKeys.every((key) => key === 'change_me')) {
      this.logger.warn(
        'GROQ_API_KEY tiene valor placeholder: configura tu key real de https://console.groq.com/keys',
      );
    }

    const customModels = this.configService
      .get<string>('GROQ_MODELS')
      ?.split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    const singleModel = this.configService
      .get<string>('GROQ_MODEL')
      ?.trim();

    this.textModels =
      customModels && customModels.length > 0
        ? customModels
        : singleModel
          ? [singleModel, ...DEFAULT_TEXT_MODELS.filter((m) => m !== singleModel)]
          : [...DEFAULT_TEXT_MODELS];

    this.visionModel =
      this.configService.get<string>('GROQ_VISION_MODEL')?.trim() ||
      DEFAULT_VISION_MODEL;
  }

  private rotateKey(): void {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    }
  }

  /** Hay al menos una key real (no vacía ni placeholder). */
  hasUsableKeys(): boolean {
    return (
      this.apiKeys.length > 0 &&
      !this.apiKeys.every((key) => key === 'change_me')
    );
  }

  private assertKeys(): void {
    if (!this.hasUsableKeys()) {
      throw new Error(
        'Groq sin API keys configuradas: configura GROQ_API_KEY en el .env',
      );
    }
  }

  private historyToMessages(history?: Content[]): GroqMessage[] {
    if (!history || history.length === 0) return [];
    return history.map((h) => ({
      role: h.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: h.parts.map((p) => p.text ?? '').join(' '),
    }));
  }

  private buildImageContent(
    text: string,
    files: FileInput[],
  ): GroqMessage['content'] {
    const parts: Extract<GroqMessage['content'], Array<unknown>> = [
      { type: 'text', text },
    ];
    for (const f of files) {
      if (f.mimeType.startsWith('image/')) {
        parts.push({
          type: 'image_url',
          image_url: {
            url: `data:${f.mimeType};base64,${f.fileBase64}`,
          },
        });
      }
    }
    return parts;
  }

  private describeNonImageFiles(files: FileInput[]): string {
    const nonImages = files.filter((f) => !f.mimeType.startsWith('image/'));
    if (nonImages.length === 0) return '';
    return `\n\nNota: el usuario también adjuntó ${nonImages.length} archivo(s) no visual (tipos: ${nonImages.map((f) => f.mimeType).join(', ')}). Groq no puede leer PDFs directamente: genera el contenido basándote en la referencia de texto del usuario y el contexto de las imágenes (si las hay).`;
  }

  private async callChat(opts: {
    model: ModelName;
    messages: GroqMessage[];
    jsonMode?: boolean;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    this.assertKeys();
    const body: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? (opts.jsonMode ? 0.4 : 0.7),
      max_completion_tokens: opts.maxTokens ?? 8000,
    };
    if (opts.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKeys[this.currentKeyIndex]}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const error = new Error(
        `Groq ${opts.model} failed with ${res.status}: ${errText.slice(0, 300)}`,
      ) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('Empty');
    return text.trim();
  }

  private async *streamChat(opts: {
    model: ModelName;
    messages: GroqMessage[];
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<string> {
    this.assertKeys();
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKeys[this.currentKeyIndex]}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_completion_tokens: opts.maxTokens ?? 8000,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const errText = res.body ? '' : await res.text().catch(() => '');
      const error = new Error(
        `Groq stream ${opts.model} failed with ${res.status}: ${errText.slice(0, 300)}`,
      ) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') return;
          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // línea SSE parcial, se ignora
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async generateTextWithFallback(
    buildMessages: () => GroqMessage[],
    opts?: { jsonMode?: boolean; temperature?: number; maxTokens?: number },
  ): Promise<{ text: string; model: string }> {
    let lastError: unknown = null;
    for (const modelName of this.textModels) {
      let keysTried = 0;
      while (keysTried < this.apiKeys.length) {
        try {
          const text = await this.callChat({
            model: modelName,
            messages: buildMessages(),
            jsonMode: opts?.jsonMode,
            temperature: opts?.temperature,
            maxTokens: opts?.maxTokens,
          });
          return { text, model: modelName };
        } catch (error: unknown) {
          lastError = error;
          const err = error as { status?: number; code?: number | string };
          const code = err.status ?? err.code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          this.logger.warn(
            `Model ${modelName} error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          break;
        }
      }
    }
    throw lastError || new Error('All models failed');
  }

  private async generateWithSchema(prompt: string): Promise<string> {
    const { text } = await this.generateTextWithFallback(
      () => [
        {
          role: 'user',
          content: `${prompt}\n\nResponde SOLO con un objeto JSON válido, sin markdown ni texto extra.`,
        },
      ],
      { jsonMode: true, temperature: 0.4, maxTokens: 8000 },
    );
    return text;
  }

  private async generateContentWithFileFallback(
    textPrompt: string,
    files: FileInput[],
  ): Promise<string> {
    this.assertKeys();
    const images = files.filter((f) => f.mimeType.startsWith('image/'));
    const fullPrompt = textPrompt + this.describeNonImageFiles(files);

    // Si hay imágenes, usar el modelo de visión (Qwen soporta JSON mode).
    if (images.length > 0) {
      const visionImages = images.slice(0, 5);
      if (images.length > 5) {
        this.logger.warn(
          `Groq vision admite máximo 5 imágenes por petición; se usarán las 5 primeras de ${images.length}.`,
        );
      }
      let keysTried = 0;
      let lastError: unknown = null;
      while (keysTried < this.apiKeys.length) {
        try {
          return await this.callChat({
            model: this.visionModel,
            messages: [
              {
                role: 'user',
                content: this.buildImageContent(
                  `${fullPrompt}\n\nResponde SOLO con un objeto JSON válido, sin markdown ni texto extra.`,
                  visionImages,
                ),
              },
            ],
            jsonMode: true,
            temperature: 0.4,
            maxTokens: 8000,
          });
        } catch (error: unknown) {
          lastError = error;
          const err = error as { status?: number; code?: number | string };
          const code = err.status ?? err.code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          this.logger.warn(
            `Vision model ${this.visionModel} error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          break;
        }
      }
      // Si la visión falla y hay referencia de texto, degradar a modelos de texto.
      this.logger.warn(
        `Vision failed, falling back to text models: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
      );
    } else if (files.length > 0) {
      this.logger.warn(
        'Archivos no visuales (ej. PDF) recibidos: Groq no los lee directamente; se generará desde la referencia de texto.',
      );
    }

    const { text } = await this.generateTextWithFallback(
      () => [
        {
          role: 'user',
          content: `${fullPrompt}\n\nResponde SOLO con un objeto JSON válido, sin markdown ni texto extra.`,
        },
      ],
      { jsonMode: true, temperature: 0.4, maxTokens: 8000 },
    );
    return text;
  }

  // ==================== FEATURES ====================

  async generateExam(
    topic: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateExam(num, diff)}\n\nTema: ${topic}`,
    );
    this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateIcfesExam(
    topic: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateIcfesExam(num, diff)}\n\nTema: ${topic}`,
    );
    this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateNote(
    topic: string,
    num: number,
    detail: string,
  ): Promise<NoteResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateNote(num, detail)}\n\nTema: ${topic}`,
    );
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateFlashcards(topic: string, num: number): Promise<CardResponse> {
    const raw = await this.generateWithSchema(
      `${AI_PROMPTS.generateFlashcards(num)}\n\nTema: ${topic}`,
    );
    this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateEducationalChatResponse(
    msg: string,
    ctx?: string,
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text ?? '').join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT();
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${msg}`;

    const messages: GroqMessage[] = [];
    if (ctx) messages.push({ role: 'system', content: ctx });
    messages.push(...this.historyToMessages(history));
    messages.push({ role: 'user', content: prompt });

    const { text } = await this.generateTextWithFallback(() => messages, {
      temperature: 0.7,
    });
    return { response: text.trim() };
  }

  async *generateEducationalChatResponseStream(
    msg: string,
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text ?? '').join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT();
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${msg}`;
    const buildMessages = (): GroqMessage[] => [
      ...this.historyToMessages(history),
      { role: 'user', content: prompt },
    ];

    let lastError: Error | null = null;
    for (const modelName of this.textModels) {
      let keysTried = 0;
      while (keysTried < this.apiKeys.length) {
        try {
          yield* this.streamChat({ model: modelName, messages: buildMessages() });
          return;
        } catch (error: unknown) {
          lastError = error as Error;
          const err = error as { status?: number; code?: number | string };
          const code = err.status ?? err.code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          this.logger.warn(
            `Model ${modelName} stream error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          break;
        }
      }
    }
    throw lastError || new Error('All models failed for stream');
  }

  async generateChatTitleFromMessage(msg: string): Promise<string> {
    const { text } = await this.generateTextWithFallback(
      () => [
        {
          role: 'user',
          content:
            AI_PROMPTS.CHAT_TITLE_SYSTEM_PROMPT + '\n\n' + msg.substring(0, 100),
        },
      ],
      { temperature: 0.3, maxTokens: 500 },
    );
    return text.trim().replace(/^["']|["']$/g, '');
  }

  // ==================== MULTIMODAL METHODS ====================

  async generateExamFromFile(
    files: FileInput[],
    reference: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const textPrompt = `${AI_PROMPTS.generateExam(num, diff)}\n\nEl usuario ha subido ${files.length} archivo(s) como referencia. También dice: "${reference || 'genera preguntas sobre estos archivos'}". Analiza los archivos y genera preguntas basadas en su contenido.`;

    const raw = await this.generateContentWithFileFallback(textPrompt, files);
    this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateIcfesExamFromFile(
    files: FileInput[],
    reference: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const textPrompt = `${AI_PROMPTS.generateIcfesExam(num, diff)}\n\nEl usuario ha subido ${files.length} archivo(s) como referencia. También dice: "${reference || 'genera preguntas sobre estos archivos'}". Analiza los archivos y genera preguntas basadas en su contenido.`;

    const raw = await this.generateContentWithFileFallback(textPrompt, files);
    this.logger.debug(raw);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateFlashcardsFromFile(
    files: FileInput[],
    reference: string,
    num: number,
  ): Promise<CardResponse> {
    const textPrompt = `${AI_PROMPTS.generateFlashcards(num)}\n\nEl usuario ha subido ${files.length} archivo(s) como referencia. También dice: "${reference || 'genera flashcards sobre estos archivos'}". Analiza los archivos y genera flashcards basadas en su contenido.`;

    const raw = await this.generateContentWithFileFallback(textPrompt, files);
    return JSON.parse(JsonExtractor.extract(raw));
  }

  async generateEducationalChatResponseWithFile(
    msg: string,
    fileBase64: string,
    mimeType: string,
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text ?? '').join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT();

    const userMsg = `El usuario ha subido un archivo y dice: "${msg || 'Analiza este archivo'}". Analiza el archivo y responde basándote en su contenido.`;
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${userMsg}`;
    const file: FileInput = { fileBase64, mimeType };

    if (mimeType.startsWith('image/')) {
      const buildMessages = (): GroqMessage[] => [
        ...this.historyToMessages(history),
        {
          role: 'user',
          content: this.buildImageContent(prompt, [file]),
        },
      ];
      let lastError: unknown = null;
      let keysTried = 0;
      while (keysTried < this.apiKeys.length) {
        try {
          const text = await this.callChat({
            model: this.visionModel,
            messages: buildMessages(),
          });
          return { response: text };
        } catch (error: unknown) {
          lastError = error;
          const err = error as { status?: number; code?: number | string };
          const code = err.status ?? err.code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          break;
        }
      }
      this.logger.warn(
        `Vision single-file failed, falling back to text: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`,
      );
    }

    const fullPrompt =
      prompt + this.describeNonImageFiles([file]);
    const { text } = await this.generateTextWithFallback(
      () => [...this.historyToMessages(history), { role: 'user', content: fullPrompt }],
    );
    return { response: text };
  }

  async *generateEducationalChatResponseStreamWithFile(
    msg: string,
    files: FileInput[],
    history?: Content[],
  ) {
    let historyText = '';
    if (history && history.length > 0) {
      historyText = history
        .map((h) => {
          const role = h.role === 'user' ? 'User' : 'Assistant';
          const text = h.parts.map((p) => p.text ?? '').join(' ');
          return `${role}: ${text}`;
        })
        .join('\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT();

    const fileCount = files.length;
    const userMsg =
      fileCount === 1
        ? `El usuario ha subido un archivo y dice: "${msg || 'Analiza este archivo'}". Analiza el archivo y responde basándote en su contenido.`
        : `El usuario ha subido ${fileCount} archivos y dice: "${msg || 'Analiza estos archivos'}". Analiza los archivos y responde basándote en su contenido.`;
    const prompt = `${systemPrompt}\n\n${historyText}\nUser: ${userMsg}`;
    const images = files.filter((f) => f.mimeType.startsWith('image/')).slice(0, 5);
    const fullPrompt = prompt + this.describeNonImageFiles(files);

    // Con imágenes: streaming con el modelo de visión.
    if (images.length > 0) {
      let keysTried = 0;
      let lastError: Error | null = null;
      while (keysTried < this.apiKeys.length) {
        try {
          yield* this.streamChat({
            model: this.visionModel,
            messages: [
              ...this.historyToMessages(history),
              {
                role: 'user',
                content: this.buildImageContent(fullPrompt, images),
              },
            ],
          });
          return;
        } catch (error: unknown) {
          lastError = error as Error;
          const err = error as { status?: number; code?: number | string };
          const code = err.status ?? err.code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          this.logger.warn(
            `Vision model ${this.visionModel} stream file error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          break;
        }
      }
      if (images.length === files.length && lastError) {
        // Todas eran imágenes y la visión falló: no tiene sentido degradar a texto.
        throw lastError;
      }
      this.logger.warn('Vision stream failed, falling back to text stream.');
    }

    // Sin imágenes (o degradado): streaming con modelos de texto.
    let lastError: Error | null = null;
    for (const modelName of this.textModels) {
      let keysTried = 0;
      while (keysTried < this.apiKeys.length) {
        try {
          yield* this.streamChat({
            model: modelName,
            messages: [
              ...this.historyToMessages(history),
              { role: 'user', content: fullPrompt },
            ],
          });
          return;
        } catch (error: unknown) {
          lastError = error as Error;
          const err = error as { status?: number; code?: number | string };
          const code = err.status ?? err.code;
          if (code === 429 && keysTried < this.apiKeys.length - 1) {
            this.rotateKey();
            keysTried++;
            continue;
          }
          this.logger.warn(
            `Model ${modelName} stream file error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          break;
        }
      }
    }
    throw lastError || new Error('All models failed for file stream');
  }
}
