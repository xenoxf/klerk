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

  async generateExamFromTopic(topic: string, numberOfQuestions: number, difficulty: string) {
    try {
      const prompt = AI_PROMPTS.generateExamFromTopic(topic, numberOfQuestions, difficulty);
      
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return JSON.parse(raw);
      
    } catch (error) {
      return {
        error: true,
        message: 'Error generando examen',
        detail: error.message,
      };
    }
  }

  async generateExamFromReference(referenceText: string, numberOfQuestions: number, difficulty: string) {
    try {
      const prompt = AI_PROMPTS.generateExamFromReference(referenceText, numberOfQuestions, difficulty);
      
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return JSON.parse(raw);
      
    } catch (error) {
      return {
        error: true,
        message: 'Error generando examen desde referencia',
        detail: error.message,
      };
    }
  }

  async generateNoteFromTopic(topic: string, numberOfNotes: number, levelOfDetail: string) {
    try {
      const prompt = AI_PROMPTS.generateNoteFromTopic(topic, numberOfNotes, levelOfDetail);
      
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return JSON.parse(raw);
      
    } catch (error) {
      return {
        error: true,
        message: 'Error generando notas',
        detail: error.message,
      };
    }
  }

  async generateNoteFromReference(referenceText: string, numberOfNotes: number, levelOfDetail: string) {
    try {
      const prompt = AI_PROMPTS.generateNoteFromReference(referenceText, numberOfNotes, levelOfDetail);
      
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return JSON.parse(raw);
      
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
      const prompt = AI_PROMPTS.generateFlashcardsFromTopic(topic, numberOfCards);
      
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return JSON.parse(raw);
      
    } catch (error) {
      return {
        error: true,
        message: 'Error generando flashcards',
        detail: error.message,
      };
    }
  }

  async generateFlashcardsFromReference(referenceText: string, numberOfCards: number) {
    try {
      const prompt = AI_PROMPTS.generateFlashcardsFromReference(referenceText, numberOfCards);
      
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Responde EXCLUSIVAMENTE con JSON válido. Sin markdown, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      return JSON.parse(raw);
      
    } catch (error) {
      return {
        error: true,
        message: 'Error generando flashcards desde referencia',
        detail: error.message,
      };
    }
  }

  // ==================== MÉTODOS EXISTENTES (MANTENIDOS) ====================

  async chatMessage(prompt: string) {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente útil. Responde de forma clara.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const raw = completion.choices[0].message.content;

      try {
        return JSON.parse(raw);
      } catch (err) {
        return {
          type: 'answer',
          success: false,
          content: {
            explanation: 'El modelo devolvió un JSON inválido.',
            code: null,
            raw,
          },
        };
      }
    } catch (error) {
      return {
        type: 'answer',
        success: false,
        content: {
          explanation: 'Error llamando a Groq.',
          code: null,
          error: error.message,
        },
      };
    }
  }

  async generateFlashcards(prompt: string) {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `
Eres un asistente experto en generar flashcards.
Responde SIEMPRE con JSON válido y limpio.

FORMATO OBLIGATORIO:
{
  "cards": [
    {
      "front": "pregunta corta",
      "back": "respuesta larga",
      "difficulty": "fácil" | "medio" | "difícil"
    }
  ]
}

REGLAS:
- Nada fuera del JSON.
- Prohibido usar markdown.
- Prohibido usar backticks.
- Prohibido agregar mensajes adicionales.
`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.25,
        max_tokens: 4096,
      });

      const raw = completion.choices[0].message.content?.trim() ?? '';

      try {
        return JSON.parse(raw);
      } catch (err) {}

      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (err) {}
      }

      return {
        error: true,
        message: 'La IA devolvió un JSON inválido.',
        raw,
      };
    } catch (error) {
      return {
        error: true,
        message: 'Error llamando a Groq para flashcards.',
        detail: error.message,
      };
    }
  }

  async chat(prompt: string) {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Haras caso a las cosas que te ordenen ok?',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });

      const raw = completion.choices[0].message.content;

      try {
        return JSON.parse(raw);
      } catch (err) {
        return {
          type: 'answer',
          success: false,
          content: {
            explanation: 'El modelo devolvió un JSON inválido.',
            code: null,
            raw,
          },
        };
      }
    } catch (error) {
      return {
        type: 'answer',
        success: false,
        content: {
          explanation: 'Error llamando a Groq.',
          code: null,
          error: error.message,
        },
      };
    }
  }

  async chatWithHistory(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string,
  ): Promise<string> {
    const allMessages: any[] = [];

    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt });
    }

    allMessages.push(...messages);

    try {
      const response = await this.groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}