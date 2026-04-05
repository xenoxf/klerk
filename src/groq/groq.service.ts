// groq.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { AI_PROMPTS } from './AI_PROMPTS';

// Custom error class for Groq API errors
export class GroqApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly rawResponse?: string,
  ) {
    super(message);
    this.name = 'GroqApiError';
  }
}

@Injectable()
export class GroqService {
  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // ==================== TOKEN CALCULATION ====================

  private calculateExamTokens(numberOfQuestions: number, difficulty: string): number {
    const baseTokensPerQuestion = difficulty === 'hard' ? 200 : difficulty === 'medium' ? 160 : 120;
    return numberOfQuestions * baseTokensPerQuestion;
  }

  private calculateNoteTokens(numberOfNotes: number, levelOfDetail: string): number {
    const tokensPerNote = levelOfDetail === 'detallado' ? 500 : levelOfDetail === 'medio' ? 350 : 200;
    return numberOfNotes * tokensPerNote;
  }

  private calculateFlashcardTokens(numberOfCards: number): number {
    return numberOfCards * 120;
  }

  // ==================== MÉTODOS ESPECÍFICOS USANDO PROMPTS MEJORADOS ====================

  async generateExam(
    topic: string,
    numberOfQuestions: number,
    difficulty: string,
  ) {
    const prompt = AI_PROMPTS.generateExam(numberOfQuestions, difficulty);
    const maxTokens = this.calculateExamTokens(numberOfQuestions, difficulty);

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: topic },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    });

    const raw: string = completion.choices[0].message.content.trim();

    if (!raw) {
      throw new GroqApiError(
        'EMPTY_AI_RESPONSE',
        'La IA no generó contenido. Intenta con un tema más específico.',
        raw,
      );
    }

    const cleaned = this.cleanJsonResponse(raw);

    try {
      const parsed = JSON.parse(cleaned);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new GroqApiError(
          'INVALID_RESPONSE_FORMAT',
          'La IA respondió con un formato inválido. Asegúrate de que el tema sea claro.',
          raw,
        );
      }

      if (!parsed.metadata || typeof parsed.metadata !== 'object') {
        throw new GroqApiError(
          'MISSING_METADATA',
          'La IA no incluyó metadatos en la respuesta.',
          raw,
        );
      }

      for (const q of parsed.questions) {
        if (!q.question || !q.options || !Array.isArray(q.options)) {
          throw new GroqApiError(
            'INVALID_QUESTION_FORMAT',
            'Las preguntas generadas tienen formato inválido. Falta el texto o las opciones.',
            raw,
          );
        }
      }

      return parsed;
    } catch (parseError) {
      console.error(
        'JSON parse error:',
        parseError.message,
        'Raw response:',
        raw.substring(0, 500),
      );
      throw new GroqApiError(
        'INVALID_JSON',
        `Formato JSON inválido: ${parseError.message}`,
        raw,
      );
    }
  }
  async generateNote(
    topic: string,
    numberOfNotes: number,
    levelOfDetail: string,
  ) {
    const prompt = AI_PROMPTS.generateNote(numberOfNotes, levelOfDetail);
    const maxTokens = this.calculateNoteTokens(numberOfNotes, levelOfDetail);

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: topic },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    });

    const raw = completion.choices[0].message.content.trim();

    if (!raw) {
      throw new GroqApiError(
        'EMPTY_AI_RESPONSE',
        'La IA no generó contenido. Intenta con un tema más específico.',
        raw,
      );
    }

    const cleaned = this.cleanJsonResponse(raw);

    try {
      const parsed = JSON.parse(cleaned);

      if (!parsed.notes || !Array.isArray(parsed.notes)) {
        throw new GroqApiError(
          'INVALID_RESPONSE_FORMAT',
          'La IA respondió con un formato inválido. Asegúrate de que el tema sea claro.',
          raw,
        );
      }

      if (!parsed.metadata || typeof parsed.metadata !== 'object') {
        throw new GroqApiError(
          'MISSING_METADATA',
          'La IA no incluyó metadatos en la respuesta.',
          raw,
        );
      }

      return parsed;
    } catch (parseError) {
      console.error(
        'JSON parse error:',
        parseError.message,
        'Raw response:',
        raw.substring(0, 500),
      );
      throw new GroqApiError(
        'INVALID_JSON',
        `Formato JSON inválido: ${parseError.message}`,
        raw,
      );
    }
  }
  async generateFlashcards(topic: string, numberOfCards: number) {
    const prompt = AI_PROMPTS.generateFlashcards(numberOfCards);
    const maxTokens = this.calculateFlashcardTokens(numberOfCards);

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: topic },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    });

    const raw = completion.choices[0].message.content.trim();

    if (!raw) {
      throw new GroqApiError(
        'EMPTY_AI_RESPONSE',
        'La IA no generó contenido. Intenta con un tema más específico.',
        raw,
      );
    }

    const cleaned = this.cleanJsonResponse(raw);

    try {
      const parsed = JSON.parse(cleaned);

      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new GroqApiError(
          'INVALID_RESPONSE_FORMAT',
          'La IA respondió con un formato inválido. Asegúrate de que el tema sea claro.',
          raw,
        );
      }

      if (!parsed.metadata || typeof parsed.metadata !== 'object') {
        throw new GroqApiError(
          'MISSING_METADATA',
          'La IA no incluyó metadatos en la respuesta.',
          raw,
        );
      }

      return parsed;
    } catch (parseError) {
      console.error(
        'JSON parse error:',
        parseError.message,
        'Raw response:',
        raw.substring(0, 500),
      );
      throw new GroqApiError(
        'INVALID_JSON',
        `Formato JSON inválido: ${parseError.message}`,
        raw,
      );
    }
  }
  // ==================== EDUCATIONAL CHAT METHODS - OPTIMIZADO ====================

  async generateEducationalChatResponse(
    userMessage: string,
    conversationContext?: string,
    conversationHistory?: Array<{
      prompt: string;
      response: string;
      createdAt: string;
    }>,
  ) {
    const messages: any[] = [
      {
        role: 'system',
        content: AI_PROMPTS.SYSTEM_PROMPT({
          previousTopics: [],
          messageCount: conversationHistory?.length || 0,
        }),
      },
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-2);
      recentHistory.forEach((msg) => {
        messages.push({
          role: 'user',
          content: msg.prompt.substring(0, 500),
        });
        messages.push({
          role: 'assistant',
          content: msg.response.substring(0, 500),
        });
      });
    }

    messages.push({
      role: 'user',
      content: userMessage.substring(0, 500),
    });

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 300,
      stream: false,
    });

    const raw = completion.choices[0].message.content.trim();

    return { response: raw };
  }
  async generateChatTitleFromMessage(firstMessage: string): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: AI_PROMPTS.CHAT_TITLE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: firstMessage.substring(0, 100).trim(),
        },
      ],
      temperature: 0.3,
      max_tokens: 30,
    });

    return completion.choices[0].message.content
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\.$/g, '');
  }

  // ==================== MÉTODOS ====================

  // ==================== HELPER METHODS ====================

  private cleanJsonResponse(response: string): string {
    // Eliminar markdown code blocks
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Eliminar espacios y saltos de línea al inicio/final
    cleaned = cleaned.trim();

    // Si empieza con comillas, quitar la primera línea si es texto
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      const firstBraceIndex = cleaned.indexOf('{');
      const firstBracketIndex = cleaned.indexOf('[');
      const startIndex = Math.min(
        firstBraceIndex === -1 ? Infinity : firstBraceIndex,
        firstBracketIndex === -1 ? Infinity : firstBracketIndex,
      );
      if (startIndex !== Infinity) {
        cleaned = cleaned.substring(startIndex);
      }
    }

    // Eliminar texto después del último } o ]
    const lastBraceIndex = cleaned.lastIndexOf('}');
    const lastBracketIndex = cleaned.lastIndexOf(']');
    const endIndex = Math.max(lastBraceIndex, lastBracketIndex);
    if (endIndex !== -1) {
      cleaned = cleaned.substring(0, endIndex + 1);
    }

    return cleaned;
  }
}
