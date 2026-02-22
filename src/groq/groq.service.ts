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
      const prompt = AI_PROMPTS.generateEducationalChatResponse(
        userMessage,
        conversationContext,
      );

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Eres un tutor educativo experto. Responde EXCLUSIVAMENTE con JSON válido. El campo "response" DEBE contener markdown formateado (usa **bold**, *italic*, `code`, listas, etc.). Los demás campos pueden ser texto plano.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';

      try {
        const cleaned = this.cleanJsonResponse(raw);
        const parsed = JSON.parse(cleaned);
        // Asegurar que el campo response existe y contiene markdown
        if (parsed.response && typeof parsed.response === 'string') {
          return parsed;
        }
        // Si viene como texto plano, intentar parsearlo como markdown
        return {
          response: parsed.response || raw,
          keyPoints: parsed.keyPoints || [],
          suggestedFollowUp: parsed.suggestedFollowUp || '',
          difficulty: parsed.difficulty || 'intermediate',
          relevantTopics: parsed.relevantTopics || [],
        };
      } catch (e) {
        // Si no es JSON válido, devolver como markdown directo
        return {
          response: raw,
          keyPoints: [],
          suggestedFollowUp: '',
          difficulty: 'intermediate',
          relevantTopics: [],
        };
      }
    } catch (error) {
      return {
        response: 'Lo siento, hubo un error procesando tu pregunta.',
        keyPoints: [],
        suggestedFollowUp: '',
        difficulty: 'intermediate',
        relevantTopics: [],
        error: error.message,
      };
    }
  }

  async generateChatTitleFromMessage(firstMessage: string): Promise<string> {
    try {
      const prompt = AI_PROMPTS.generateChatTitle(firstMessage);

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente conciso. Responde SOLO con el título solicitado, sin comillas ni explicación.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 100,
      });

      const title =
        completion.choices[0]?.message?.content?.trim() || 'Nuevo Chat';
      return title;
    } catch (error) {
      return 'Nuevo Chat';
    }
  }

  async generateExamTitle(topicOrReference: string): Promise<string> {
    try {
      const prompt = `Genera un título corto y descriptivo (máximo 8 palabras) para un examen sobre: "${topicOrReference}"

El título debe ser:
- Conciso y claro
- Descriptivo del tema
- Atractivo para estudiantes
- Sin comillas ni explicación adicional

Responde SOLO con el título, nada más.`;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente que genera títulos concisos. Responde SOLO con el título solicitado, sin comillas ni explicación.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 50,
      });

      const title =
        completion.choices[0]?.message?.content?.trim() ||
        `Examen sobre ${topicOrReference.substring(0, 30)}`;
      // Limpiar comillas si las tiene
      return title.replace(/^["']|["']$/g, '');
    } catch (error) {
      return `Examen sobre ${topicOrReference.substring(0, 30)}`;
    }
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
