// groq.service.ts
import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { AI_PROMPTS } from './AI_PROMPTS';

@Injectable()
export class GroqService {
  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // ==================== MÉTODOS ESPECÍFICOS USANDO PROMPTS MEJORADOS ====================

  async generateExamFromTopic(
    topic: string,
    numberOfQuestions: number,
    difficulty: string,
  ) {
    try {
      const prompt = AI_PROMPTS.generateExamFromTopic(
        topic,
        numberOfQuestions,
        difficulty,
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Responde EXCLUSIVAMENTE con JSON válido. Los campos de texto (question, text, explanation) DEBEN contener markdown formateado (**bold**, *italic*, `code`, etc.). El JSON debe ser válido y parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const cleaned = this.cleanJsonResponse(raw);
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        error: true,
        message: 'Error generando examen',
        detail: error.message,
      };
    }
  }

  async generateExamFromReference(
    referenceText: string,
    numberOfQuestions: number,
    difficulty: string,
  ) {
    try {
      const prompt = AI_PROMPTS.generateExamFromReference(
        referenceText,
        numberOfQuestions,
        difficulty,
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Responde EXCLUSIVAMENTE con JSON válido. Los campos de texto (content, front, back, etc.) DEBEN contener markdown formateado (**bold**, *italic*, `code`, etc.). El JSON debe ser válido y parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const cleaned = this.cleanJsonResponse(raw);
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        error: true,
        message: 'Error generando examen desde referencia',
        detail: error.message,
      };
    }
  }

  async generateNoteFromTopic(
    topic: string,
    numberOfNotes: number,
    levelOfDetail: string,
  ) {
    try {
      const prompt = AI_PROMPTS.generateNoteFromTopic(
        topic,
        numberOfNotes,
        levelOfDetail,
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Responde EXCLUSIVAMENTE con JSON válido. Los campos de texto (content, front, back, etc.) DEBEN contener markdown formateado (**bold**, *italic*, `code`, etc.). El JSON debe ser válido y parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const cleaned = this.cleanJsonResponse(raw);
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        error: true,
        message: 'Error generando notas',
        detail: error.message,
      };
    }
  }

  async generateNoteFromReference(
    referenceText: string,
    numberOfNotes: number,
    levelOfDetail: string,
  ) {
    try {
      const prompt = AI_PROMPTS.generateNoteFromReference(
        referenceText,
        numberOfNotes,
        levelOfDetail,
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Responde EXCLUSIVAMENTE con JSON válido. Los campos de texto (content, front, back, etc.) DEBEN contener markdown formateado (**bold**, *italic*, `code`, etc.). El JSON debe ser válido y parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const cleaned = this.cleanJsonResponse(raw);
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        error: true,
        message: 'Error generando notas desde referencia',
        detail: error.message,
      };
    }
  }

  async generateFlashcardsFromTopic(topic: string, numberOfCards: number) {
    try {
      const prompt = AI_PROMPTS.generateFlashcardsFromTopic(
        topic,
        numberOfCards,
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Responde EXCLUSIVAMENTE con JSON válido. Los campos de texto (content, front, back, etc.) DEBEN contener markdown formateado (**bold**, *italic*, `code`, etc.). El JSON debe ser válido y parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const cleaned = this.cleanJsonResponse(raw);
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        error: true,
        message: 'Error generando flashcards',
        detail: error.message,
      };
    }
  }

  async generateFlashcardsFromReference(
    referenceText: string,
    numberOfCards: number,
  ) {
    try {
      const prompt = AI_PROMPTS.generateFlashcardsFromReference(
        referenceText,
        numberOfCards,
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Responde EXCLUSIVAMENTE con JSON válido. Los campos de texto (content, front, back, etc.) DEBEN contener markdown formateado (**bold**, *italic*, `code`, etc.). El JSON debe ser válido y parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const cleaned = this.cleanJsonResponse(raw);
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        error: true,
        message: 'Error generando flashcards desde referencia',
        detail: error.message,
      };
    }
  }

  // ==================== EDUCATIONAL CHAT METHODS ====================

  async generateEducationalChatResponse(
    userMessage: string,
    conversationContext?: string,
  ) {
    try {
      const userContent = conversationContext
        ? `Contexto previo:\n${conversationContext}\n\nMensaje del usuario: ${userMessage}`
        : userMessage;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: AI_PROMPTS.SYSTEM_PROMPT(), // 👈 El prompt largo va aquí
          },
          {
            role: 'user',
            content: userContent, // 👈 Solo el mensaje del usuario
          },
        ],
        temperature: 0.7, // Un poco más alto para respuestas naturales
        max_tokens: 2048,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return { response: raw };
    } catch (error) {
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
            content: `"${firstMessage}"`, // 👈 Solo el mensaje, sin instrucciones mezcladas
          },
        ],
        temperature: 0.3,
        max_tokens: 50, // 👈 Títulos cortos, no necesita más
      });

      const title =
        completion.choices[0]?.message?.content
          ?.trim()
          ?.replace(/^["']|["']$/g, '') // Elimina comillas si el modelo las añade
          ?.replace(/\.$/g, '') || 'Nuevo Chat'; // Elimina punto final si lo añade

      return title;
    } catch {
      return 'Nuevo Chat';
    }
  }

  // ==================== MÉTODOS ====================

  private async generateShortText(
    prompt: string,
    fallback: string,
    maxTokens = 50,
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
          { role: 'user', content: prompt },
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
      80,
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
      80,
    );
  }

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
