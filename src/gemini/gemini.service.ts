import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AI_PROMPTS } from './AI_PROMPTS';

// Available Gemini models for fallback chain
const MODELS = [
  'gemini-2.5-flash-lite', // Primary: fast, cheap
  'gemini-2.5-flash', // Fallback 1: more capable
  'gemini-2.0-flash', // Fallback 2: older but reliable
  'gemini-1.5-flash', // Fallback 3: stable fallback
] as const;

type ModelName = (typeof MODELS)[number];

interface RetryableError extends Error {
  code?: number;
  status?: number;
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKeys: string[];
  private currentKeyIndex = 0;

  constructor() {
    this.apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
    ].filter((key): key is string => !!key && key !== 'undefined');

    if (this.apiKeys.length === 0) {
      throw new Error('No GEMINI_API_KEY found in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKeys[0]);
    this.logger.log(
      `GeminiService initialized with ${this.apiKeys.length} API keys`,
    );
  }

  /**
   * Rotate to the next available API key
   */
  private rotateKey(): boolean {
    if (this.apiKeys.length <= 1) return false;

    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.genAI = new GoogleGenerativeAI(this.apiKeys[this.currentKeyIndex]);
    this.logger.warn(`Rotated to API Key #${this.currentKeyIndex + 1}`);
    return true;
  }

  /**
   * Get a model instance by name using current genAI instance
   */
  private getModel(name: ModelName = MODELS[0]): GenerativeModel {
    return this.genAI.getGenerativeModel({ model: name });
  }

  /**
   * Check if an error is retryable (rate limit, server error, etc.)
   */
  private isRetryableError(error: unknown): boolean {
    const err = error as RetryableError;
    const code = err.code ?? err.status ?? 0;

    // Rate limit (429) - always retryable if we have more keys or models
    if (code === 429) return true;

    // Server errors (500-599) or network issues
    if (code >= 500 && code < 600) return true;

    // Also retry on generic "no content" errors that might be temporary
    if (err.message?.includes('no generó contenido')) return true;

    return false;
  }

  /**
   * Generate text with automatic model and key fallback
   */
  private async generateTextWithFallback(
    prompt: string,
    modelName?: ModelName,
  ): Promise<{ text: string; modelName: string }> {
    const startModel = modelName ?? MODELS[0];
    const startIndex = MODELS.indexOf(startModel);

    // Track keys tried for each model to avoid infinite loops
    for (let i = startIndex; i < MODELS.length; i++) {
      const currentModelName = MODELS[i];
      let keysTriedForCurrentModel = 0;

      while (keysTriedForCurrentModel < this.apiKeys.length) {
        const model = this.getModel(currentModelName);
        keysTriedForCurrentModel++;

        try {
          this.logger.log(
            `Attempting generation with model ${currentModelName} (Key #${this.currentKeyIndex + 1})`,
          );
          const result = await model.generateContent(prompt);
          const text = result.response.text();

          if (!text || text.trim().length === 0) {
            throw new Error('La IA no generó contenido. Intenta de nuevo.');
          }

          return { text: text.trim(), modelName: currentModelName };
        } catch (error) {
          const err = error as RetryableError;
          const code = err.code ?? err.status ?? 0;

          this.logger.warn(
            `Model ${currentModelName} (Key #${this.currentKeyIndex + 1}) failed: ${err.message} (code: ${code})`,
          );

          // If rate limited and we have more keys, rotate and retry SAME model
          if (code === 429 && keysTriedForCurrentModel < this.apiKeys.length) {
            this.rotateKey();
            continue; // Retry while loop with same model but new key
          }

          // If retryable (not just 429) and we have more models, try next model
          if (this.isRetryableError(error) && i < MODELS.length - 1) {
            this.logger.log(`Moving to fallback model: ${MODELS[i + 1]}`);
            break; // Exit while loop to move to next model in for loop
          }

          // Non-retryable error or last model/key failed
          throw error;
        }
      }
    }

    throw new Error(
      'Todos los proveedores de IA y claves fallaron. Intenta más tarde.',
    );
  }

  /**
   * Generate text stream with automatic model and key fallback
   */
  private async *generateTextStreamWithFallback(
    prompt: string,
    modelName?: ModelName,
  ): AsyncIterable<string> {
    const startModel = modelName ?? MODELS[0];
    const startIndex = MODELS.indexOf(startModel);

    for (let i = startIndex; i < MODELS.length; i++) {
      const currentModelName = MODELS[i];
      let keysTriedForCurrentModel = 0;

      while (keysTriedForCurrentModel < this.apiKeys.length) {
        const model = this.getModel(currentModelName);
        keysTriedForCurrentModel++;

        try {
          this.logger.log(
            `Attempting stream with model ${currentModelName} (Key #${this.currentKeyIndex + 1})`,
          );
          const result = await model.generateContentStream(prompt);

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) yield text;
          }

          return; // Success, exit generator
        } catch (error) {
          const err = error as RetryableError;
          const code = err.code ?? err.status ?? 0;

          this.logger.warn(
            `Stream model ${currentModelName} (Key #${this.currentKeyIndex + 1}) failed: ${err.message} (code: ${code})`,
          );

          if (code === 429 && keysTriedForCurrentModel < this.apiKeys.length) {
            this.rotateKey();
            continue;
          }

          if (this.isRetryableError(error) && i < MODELS.length - 1) {
            this.logger.log(
              `Moving to fallback model for stream: ${MODELS[i + 1]}`,
            );
            break;
          }

          throw error;
        }
      }
    }

    throw new Error(
      'Todos los proveedores de IA y claves fallaron. Intenta más tarde.',
    );
  }

  // ==================== HELPER ====================

  private async generateText(prompt: string): Promise<string> {
    const { text } = await this.generateTextWithFallback(prompt);
    return text;
  }

  private cleanJson(raw: string): string {
    if (!raw) throw new Error("Respuesta vacía");

    let text = raw.trim();

    // 1. Quitar markdown fences
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "");

    // 2. Extraer bloque JSON más probable
    const firstBrace = text.search(/[\{\[]/);
    const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No se encontró JSON en la respuesta");
    }

    text = text.slice(firstBrace, lastBrace + 1);

    // 3. Eliminar caracteres de control invisibles
    text = text.replace(/[\u0000-\u001F\u007F]/g, "");

    // 4. Eliminar escapes inválidos (clave)
    text = text.replace(/\\(?!["\\/bfnrtu])/g, "");

    // 5. Eliminar comas colgantes
    text = text.replace(/,\s*([}\]])/g, "$1");

    // 6. Normalizar saltos de línea dentro de strings
    text = text.replace(/\r/g, "");

    return text;
  }
  private parseJson<T>(raw: string): T {
    const cleaned = this.cleanJson(raw);

    try {
      return JSON.parse(cleaned);
    } catch (err1) {
      try {
        // 🔥 intento agresivo: escapar saltos dentro de strings
        const repaired = this.repairJson(cleaned);
        return JSON.parse(repaired);
      } catch (err2) {
        throw new Error(
          `JSON inválido incluso tras reparación.\n\n` +
          `Error original: ${(err1 as Error).message}\n` +
          `Error reparando: ${(err2 as Error).message}\n\n` +
          `Preview:\n${cleaned.slice(0, 1000)}`
        );
      }
    }
  } private repairJson(text: string): string {
    let fixed = text;

    // 1. Escapar saltos de línea dentro de strings
    fixed = fixed.replace(
      /"([^"\\]*(\\.[^"\\]*)*)"/gs,
      (match) => match.replace(/\n/g, "\\n")
    );

    // 2. Asegurar comillas válidas
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

    // 3. Convertir comillas simples a dobles (caso raro)
    fixed = fixed.replace(/'/g, '"');

    // 4. Eliminar trailing commas otra vez (por seguridad)
    fixed = fixed.replace(/,\s*([}\]])/g, "$1");

    return fixed;
  }  // ==================== EXAM ====================

  async generateExam(
    topic: string,
    numberOfQuestions: number,
    difficulty: string,
  ) {
    const prompt = AI_PROMPTS.generateExam(numberOfQuestions, difficulty);
    const { text: raw } = await this.generateTextWithFallback(
      `${prompt}\n\nTema: ${topic}`,
    );
    const parsed = this.parseJson<any>(raw);

    if (
      !parsed.questions ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length === 0
    ) {
      throw new Error(
        'No se generaron preguntas válidas. Intenta con otro tema.',
      );
    }
    if (!parsed.metadata || typeof parsed.metadata !== 'object') {
      throw new Error('Faltan metadatos en la respuesta del examen.');
    }
    for (const q of parsed.questions) {
      if (!q.question || !q.options || !Array.isArray(q.options)) {
        throw new Error('Las preguntas generadas tienen formato inválido.');
      }
    }
    return parsed;
  }

  async generateIcfesExam(
    topic: string,
    numberOfQuestions: number,
    difficulty: string,
  ) {
    const prompt = AI_PROMPTS.generateIcfesExam(numberOfQuestions, difficulty);
    const { text: raw } = await this.generateTextWithFallback(
      `${prompt}\n\nTema: ${topic}`,
    );
    const parsed = this.parseJson<any>(raw);

    if (
      !parsed.questions ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length === 0
    ) {
      throw new Error(
        'No se generaron preguntas válidas. Intenta con otro tema.',
      );
    }
    if (!parsed.metadata || typeof parsed.metadata !== 'object') {
      throw new Error('Faltan metadatos en la respuesta del examen.');
    }
    for (const q of parsed.questions) {
      if (!q.question || !q.options || !Array.isArray(q.options)) {
        throw new Error('Las preguntas generadas tienen formato inválido.');
      }
    }
    return parsed;
  }

  // ==================== NOTE ====================

  async generateNote(
    topic: string,
    numberOfNotes: number,
    levelOfDetail: string,
  ) {
    const prompt = AI_PROMPTS.generateNote(numberOfNotes, levelOfDetail);
    const { text: raw } = await this.generateTextWithFallback(
      `${prompt}\n\nTema: ${topic}`,
    );
    const parsed = this.parseJson<any>(raw);

    if (
      !parsed.notes ||
      !Array.isArray(parsed.notes) ||
      parsed.notes.length === 0
    ) {
      throw new Error('No se generaron notas válidas. Intenta con otro tema.');
    }
    if (!parsed.metadata || typeof parsed.metadata !== 'object') {
      throw new Error('Faltan metadatos en la respuesta de notas.');
    }
    return parsed;
  }

  // ==================== FLASHCARDS ====================

  async generateFlashcards(topic: string, numberOfCards: number) {
    const prompt = AI_PROMPTS.generateFlashcards(numberOfCards);
    const { text: raw } = await this.generateTextWithFallback(
      `${prompt}\n\nTema: ${topic}`,
    );
    const parsed = this.parseJson<any>(raw);

    if (
      !parsed.cards ||
      !Array.isArray(parsed.cards) ||
      parsed.cards.length === 0
    ) {
      throw new Error(
        'No se generaron flashcards válidas. Intenta con otro tema.',
      );
    }
    if (!parsed.metadata || typeof parsed.metadata !== 'object') {
      throw new Error('Faltan metadatos en la respuesta de flashcards.');
    }
    return parsed;
  }

  // ==================== CHAT (with streaming) ====================

  async generateEducationalChatResponse(
    userMessage: string,
    _conversationContext?: string,
    conversationHistory?: Array<{
      prompt: string;
      response: string;
      createdAt: string;
    }>,
  ) {
    let historyText = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-5);
      historyText = recent
        .map((m) => `Usuario: ${m.prompt}\nJunior: ${m.response}`)
        .join('\n\n---\n\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: conversationHistory?.length || 0,
    });

    const fullPrompt = `${systemPrompt}\n\n${historyText ? `Historial reciente:\n${historyText}\n\n---\n\n` : ''}Usuario: ${userMessage}`;

    const { text: raw } = await this.generateTextWithFallback(fullPrompt);
    return { response: raw };
  }

  async *generateEducationalChatResponseStream(
    userMessage: string,
    conversationHistory?: Array<{
      prompt: string;
      response: string;
      createdAt: string;
    }>,
  ): AsyncIterable<string> {
    let historyText = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-5);
      historyText = recent
        .map((m) => `Usuario: ${m.prompt}\nJunior: ${m.response}`)
        .join('\n\n---\n\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: conversationHistory?.length || 0,
    });

    const fullPrompt = `${systemPrompt}\n\n${historyText ? `Historial reciente:\n${historyText}\n\n---\n\n` : ''}Usuario: ${userMessage}`;

    yield* this.generateTextStreamWithFallback(fullPrompt);
  }

  // ==================== CHAT TITLE ====================

  async generateChatTitleFromMessage(firstMessage: string): Promise<string> {
    let keysTried = 0;

    while (keysTried < this.apiKeys.length) {
      const model = this.getModel(MODELS[0]);
      keysTried++;

      try {
        const raw = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: AI_PROMPTS.CHAT_TITLE_SYSTEM_PROMPT }],
            },
            {
              role: 'model',
              parts: [{ text: 'Entendido. Solo devolveré el título.' }],
            },
            {
              role: 'user',
              parts: [{ text: firstMessage.substring(0, 100).trim() }],
            },
          ],
          generationConfig: { temperature: 0.3, maxOutputTokens: 30 },
        });

        return raw.response
          .text()
          .trim()
          .replace(/^["']|["']$/g, '')
          .replace(/\.$/g, '');
      } catch (error) {
        const err = error as RetryableError;
        const code = err.code ?? err.status ?? 0;

        if (code === 429 && keysTried < this.apiKeys.length) {
          this.rotateKey();
          continue;
        }

        throw error;
      }
    }

    throw new Error('Falló la generación del título del chat.');
  }
}
