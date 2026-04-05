// groq.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { AI_PROMPTS } from './AI_PROMPTS';
import { raw } from 'express';

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

  // ==================== MÉTODOS ESPECÍFICOS USANDO PROMPTS MEJORADOS ====================

  async generateExam(
    topic: string,
    numberOfQuestions: number,
    difficulty: string,
  ) {
    try {
      const prompt = AI_PROMPTS.generateExam(numberOfQuestions, difficulty);

      let completion;
      try {
        completion = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: prompt,
            },
            {
              role: 'user',
              content: topic,
            },
          ],
          temperature: 0.2,
          max_tokens: 300, // Optimizado: de 400 a 300 (suficiente para exámenes JSON)
        });
      } catch (groqError) {
        this.handleGroqError(groqError, 'generateExam');
      }

      const raw: string = completion.choices[0]?.message?.content?.trim() || '';

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

        // Validar estructura básica de la respuesta
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

        // Validar que las preguntas tengan la estructura correcta
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
          parseError + raw,
          'Raw response:',
          raw.substring(0, 500),
        );
        throw new GroqApiError(
          'INVALID_JSON',
          `Formato JSON inválido: ${parseError.message}+raw`,
          raw,
        );
      }
    } catch (error) {
      console.error('Groq exam error:', error);
      // Si ya es un GroqApiError, relanzarlo
      if (error instanceof GroqApiError) {
        throw error;
      }
      // Error inesperado
      throw new GroqApiError(
        'UNEXPECTED_ERROR',
        'Ocurrió un error inesperado al generar el examen.' + raw,
      );
    }
  }
  async generateNote(
    topic: string,
    numberOfNotes: number,
    levelOfDetail: string,
  ) {
    try {
      const prompt = AI_PROMPTS.generateNote(numberOfNotes, levelOfDetail);

      let completion;
      try {
        completion = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: prompt,
            },
            {
              role: 'user',
              content: topic,
            },
          ],
          temperature: 0.2,
          max_tokens: 500, // Optimizado: de 650 a 500 (suficiente para notas)
        });
      } catch (groqError) {
        this.handleGroqError(groqError, 'generateNote');
      }

      const raw = completion.choices[0]?.message?.content?.trim() || '';

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

        // Validar estructura básica de la respuesta
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
          parseError,
          'Raw response:',
          raw.substring(0, 500),
        );
        throw new GroqApiError(
          'INVALID_JSON',
          `Formato JSON inválido: ${parseError.message}`,
          raw,
        );
      }
    } catch (error) {
      console.error('Groq note error:', error);
      if (error instanceof GroqApiError) {
        throw error;
      }
      throw new GroqApiError(
        'UNEXPECTED_ERROR',
        'Ocurrió un error inesperado al generar las notas.',
      );
    }
  }
  async generateFlashcards(topic: string, numberOfCards: number) {
    try {
      const prompt = AI_PROMPTS.generateFlashcards(numberOfCards);

      let completion;
      try {
        completion = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: prompt,
            },
            {
              role: 'user',
              content: topic,
            },
          ],
          temperature: 0.2,
          max_tokens: 250, // Optimizado: de 300 a 250 (suficiente para flashcards)
        });
      } catch (groqError) {
        this.handleGroqError(groqError, 'generateFlashcards');
      }

      const raw = completion.choices[0]?.message?.content?.trim() || '';

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

        // Validar estructura básica de la respuesta
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
          parseError,
          'Raw response:',
          raw.substring(0, 500),
        );
        throw new GroqApiError(
          'INVALID_JSON',
          `Formato JSON inválido: ${parseError.message}`,
          raw,
        );
      }
    } catch (error) {
      console.error('Groq flashcards error:', error);
      if (error instanceof GroqApiError) {
        throw error;
      }
      throw new GroqApiError(
        'UNEXPECTED_ERROR',
        'Ocurrió un error inesperado al generar las flashcards.',
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
    try {
      // Construir mensajes optimizados - solo últimos 2 mensajes para ahorrar tokens
      const messages: any[] = [
        {
          role: 'system',
          content: AI_PROMPTS.SYSTEM_PROMPT({
            previousTopics: [],
            messageCount: conversationHistory?.length || 0,
          }),
        },
      ];

      // Agregar solo últimos 2 mensajes de historial (optimización de tokens)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-2);
        recentHistory.forEach((msg) => {
          messages.push({
            role: 'user',
            content: msg.prompt.substring(0, 500), // Limitar input a 500 chars
          });
          messages.push({
            role: 'assistant',
            content: msg.response.substring(0, 500), // Limitar contexto a 500 chars
          });
        });
      }

      // Agregar el mensaje actual del usuario (limitado)
      const truncatedMessage = userMessage.substring(0, 500);
      messages.push({
        role: 'user',
        content: truncatedMessage,
      });

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 200, // Reducido: de 300 a 200 (respuestas más cortas y económicas)
        stream: false,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return { response: raw };
    } catch (error) {
      console.error('Chat response error:', error);
      return { response: `Error al generar respuesta: ${error.message}` };
    }
  }
  async generateChatTitleFromMessage(firstMessage: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: AI_PROMPTS.CHAT_TITLE_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: firstMessage.substring(0, 100).trim(), // Limitado a 100 chars
          },
        ],
        temperature: 0.3,
        max_tokens: 30, // Optimizado: de 50 a 30
      });

      const title =
        completion.choices[0]?.message?.content
          ?.trim()
          ?.replace(/^["']|["']$/g, '')
          ?.replace(/\.$/g, '') || 'Nuevo Chat';

      return title;
    } catch {
      return 'Nuevo Chat';
    }
  }

  // ==================== MÉTODOS ====================

  private async generateShortText(
    prompt: string,
    fallback: string,
    maxTokens = 40, // Optimizado: de 50 a 40
  ): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Responde SOLO con el texto solicitado. Sin comillas, sin puntos al final, sin explicaciones.',
          },
          { role: 'user', content: prompt.substring(0, 200) }, // Limitado a 200 chars
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      });
      const result = completion.choices[0]?.message?.content?.trim();
      return result
        ? result.replace(/^["']|["']$/g, '').replace(/\.$/g, '')
        : fallback;
    } catch {
      return fallback;
    }
  }

  async generateExamTitle(topic: string): Promise<string> {
    return this.generateShortText(
      AI_PROMPTS.generateExamTitle(topic),
      `Examen sobre ${topic.substring(0, 30)}`,
    );
  }

  async generateFlashcardTitle(topic: string): Promise<string> {
    return this.generateShortText(
      AI_PROMPTS.generateFlashcardTitle(topic),
      `Flashcards sobre ${topic.substring(0, 25)}`,
    );
  }

  async generateFlashcardDescription(
    topic: string,
    numberOfCards: number,
  ): Promise<string> {
    return this.generateShortText(
      AI_PROMPTS.generateFlashcardDescription(topic, numberOfCards),
      `${numberOfCards} flashcards sobre ${topic.substring(0, 20)}`,
      50, // Optimizado: de 80 a 50
    );
  }

  async generateNoteTitle(topic: string): Promise<string> {
    return this.generateShortText(
      AI_PROMPTS.generateNoteTitle(topic),
      `Notas sobre ${topic.substring(0, 28)}`,
    );
  }

  async generateNoteDescription(
    topic: string,
    levelOfDetail: string,
  ): Promise<string> {
    return this.generateShortText(
      AI_PROMPTS.generateNoteDescription(topic, levelOfDetail),
      `Notas (${levelOfDetail}) sobre ${topic.substring(0, 18)}`,
      50, // Optimizado: de 80 a 50
    );
  }

  // ==================== HELPER METHODS ====================

  /**
   * Detecta errores de la API de Groq y los convierte en errores personalizados
   */
  private handleGroqError(
    error: any,
    operation: string,
    rawResponse?: string,
  ): never {
    // Detectar error de límite de tokens/créditos
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      throw new GroqApiError(
        'GROQ_RATE_LIMIT',
        'Se ha alcanzado el límite de uso de la IA. Por favor, intenta de nuevo en unos minutos.',
        rawResponse,
      );
    }

    // Detectar error de tokens agotados
    if (
      error.message?.includes('insufficient_quota') ||
      error.message?.includes('rate limit') ||
      error.message?.includes('quota exceeded')
    ) {
      throw new GroqApiError(
        'GROQ_TOKEN_LIMIT',
        'Se han agotado los tokens de la IA. Por favor, espera unos minutos antes de intentar de nuevo.',
        rawResponse,
      );
    }

    // Error genérico de la API
    throw new GroqApiError(
      'GROQ_API_ERROR',
      `Error en el servicio de IA: ${error.message || 'Error desconocido'}`,
      rawResponse,
    );
  }

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
