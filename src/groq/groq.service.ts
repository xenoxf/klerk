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
              'Eres un tutor educativo experto. Responde SOLO con markdown formateado. Sin JSON, sin campos adicionales. Solo la respuesta en markdown puro con **bold**, *italic*, `code`, listas, etc. cuando sea necesario.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      
      // Return markdown directly, no JSON parsing
      return {
        response: raw,
      };
    } catch (error) {
      return {
        response: `Error al generar respuesta: ${error.message}`,
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

  async generateFlashcardTitle(topicOrReference: string): Promise<string> {
    try {
      const prompt = `Genera un título corto y descriptivo (máximo 8 palabras) para un conjunto de flashcards sobre: "${topicOrReference}"

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
        `Flashcards sobre ${topicOrReference.substring(0, 25)}`;
      return title.replace(/^["']|["']$/g, '');
    } catch (error) {
      return `Flashcards sobre ${topicOrReference.substring(0, 25)}`;
    }
  }

  async generateFlashcardDescription(
    topicOrReference: string,
    numberOfCards: number,
  ): Promise<string> {
    try {
      const prompt = `Genera una descripción breve (máximo 15 palabras) para un conjunto de ${numberOfCards} flashcards sobre: "${topicOrReference}"

La descripción debe ser:
- Concisa y clara
- Explicar qué contienen las flashcards
- Indicar el tema principal
- Sin comillas ni explicación adicional

Responde SOLO con la descripción, nada más.`;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente que genera descripciones concisas. Responde SOLO con la descripción solicitada, sin comillas ni explicación.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 80,
      });

      const description =
        completion.choices[0]?.message?.content?.trim() ||
        `Conjunto de ${numberOfCards} flashcards sobre ${topicOrReference.substring(0, 20)}`;
      return description.replace(/^["']|["']$/g, '');
    } catch (error) {
      return `Conjunto de ${numberOfCards} flashcards sobre ${topicOrReference.substring(0, 20)}`;
    }
  }

  async generateNoteTitle(topicOrReference: string): Promise<string> {
    try {
      const prompt = `Genera un título corto y descriptivo (máximo 8 palabras) para notas de estudio sobre: "${topicOrReference}"

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
        `Notas sobre ${topicOrReference.substring(0, 28)}`;
      return title.replace(/^["']|["']$/g, '');
    } catch (error) {
      return `Notas sobre ${topicOrReference.substring(0, 28)}`;
    }
  }

  async generateNoteDescription(
    topicOrReference: string,
    levelOfDetail: string,
  ): Promise<string> {
    try {
      const prompt = `Genera una descripción breve (máximo 15 palabras) para notas de estudio (nivel: ${levelOfDetail}) sobre: "${topicOrReference}"

La descripción debe ser:
- Concisa y clara
- Explicar qué contienen las notas
- Indicar el nivel de detalle
- Sin comillas ni explicación adicional

Responde SOLO con la descripción, nada más.`;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente que genera descripciones concisas. Responde SOLO con la descripción solicitada, sin comillas ni explicación.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 80,
      });

      const description =
        completion.choices[0]?.message?.content?.trim() ||
        `Notas de estudio (${levelOfDetail}) sobre ${topicOrReference.substring(0, 18)}`;
      return description.replace(/^["']|["']$/g, '');
    } catch (error) {
      return `Notas de estudio (${levelOfDetail}) sobre ${topicOrReference.substring(0, 18)}`;
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
