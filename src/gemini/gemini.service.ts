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
  private logger = new Logger(GeminiService.name);

  constructor() {
    this.genAI = new GoogleGenerativeAI(String(process.env.GEMINI_API_KEY));
  }

  /**
   * Get a model instance by name
   */
  private getModel(name: ModelName = MODELS[0]): GenerativeModel {
    return this.genAI.getGenerativeModel({ model: name });
  }

  /**
   * Check if an error is retryable (rate limit, server error, etc.)
   */
  private isRetryableError(error: unknown): boolean {
    const err = error as RetryableError;
    // Rate limit (429), server errors (500-599), or network issues
    const code = err.code ?? err.status ?? 0;
    if (code === 429 || (code >= 500 && code < 600)) return true;
    // Also retry on generic "no content" errors that might be temporary
    if (err.message?.includes('no generó contenido')) return true;
    return false;
  }

  /**
   * Generate text with automatic model fallback on retryable errors
   */
  private async generateTextWithFallback(
    prompt: string,
    modelName?: ModelName,
  ): Promise<{ text: string; modelName: string }> {
    const startModel = modelName ?? MODELS[0];
    const startIndex = MODELS.indexOf(startModel);

    for (let i = startIndex; i < MODELS.length; i++) {
      const modelName = MODELS[i];
      const model = this.getModel(modelName);

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (!text || text.trim().length === 0) {
          throw new Error('La IA no generó contenido. Intenta de nuevo.');
        }

        return { text: text.trim(), modelName };
      } catch (error) {
        const err = error as RetryableError;
        this.logger.warn(
          `Model ${modelName} failed: ${err.message} (code: ${err.code ?? err.status})`,
        );

        if (this.isRetryableError(error) && i < MODELS.length - 1) {
          this.logger.log(`Trying fallback model: ${MODELS[i + 1]}`);
          continue; // Try next model
        }

        // Non-retryable error or last model failed
        throw error;
      }
    }

    throw new Error('Todos los proveedores de IA fallaron. Intenta más tarde.');
  }

  /**
   * Generate text stream with automatic model fallback
   */
  private async *generateTextStreamWithFallback(
    prompt: string,
    modelName?: ModelName,
  ): AsyncIterable<string> {
    const startModel = modelName ?? MODELS[0];
    const startIndex = MODELS.indexOf(startModel);

    for (let i = startIndex; i < MODELS.length; i++) {
      const modelName = MODELS[i];
      const model = this.getModel(modelName);

      try {
        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) yield text;
        }

        return; // Success, exit generator
      } catch (error) {
        const err = error as RetryableError;
        this.logger.warn(
          `Stream model ${modelName} failed: ${err.message} (code: ${err.code ?? err.status})`,
        );

        if (this.isRetryableError(error) && i < MODELS.length - 1) {
          this.logger.log(`Trying fallback model for stream: ${MODELS[i + 1]}`);
          continue; // Try next model
        }

        // Non-retryable error or last model failed
        throw error;
      }
    }

    throw new Error('Todos los proveedores de IA fallaron. Intenta más tarde.');
  }

  // ==================== HELPER ====================

  private async generateText(prompt: string): Promise<string> {
    const { text } = await this.generateTextWithFallback(prompt);
    return text;
  }

  private cleanJson(raw: string): string {
    let cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      const start = Math.min(
        cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
        cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
      );
      if (start !== Infinity) cleaned = cleaned.substring(start);
    }
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (end !== -1) cleaned = cleaned.substring(0, end + 1);
    return cleaned;
  }

  private parseJson<T>(raw: string): T {
    const cleaned = this.cleanJson(raw);
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(
        `Formato JSON inválido. Respuesta: ${raw.substring(0, 200)}`,
      );
    }
  }

  // ==================== EXAM ====================

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
    const model = this.getModel(MODELS[0]);
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
  }
}
