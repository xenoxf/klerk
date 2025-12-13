// groq.service.ts
import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
//import { CreateExamDto } from '../exams/dto/create-exam.dto';
//import { GenerateExamDto } from './dto/generate-exam.dto';

@Injectable()
export class GroqService {
  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  async chatMessage(prompt: string) {
    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',

        // Mensajes para obligar JSON limpio
        messages: [
          {
            role: 'system',
            content: `
Eres un asistente experto. SIEMPRE responde en JSON válido.
Nunca uses markdown, ni bloques con backticks.
El formato del JSON debe ser:

{
  "type": "answer",
  "success": true,
  "content": {
    "explanation": "texto",
    "code": {
      "language": "string",
      "source": "codigo aqui"
    }
  }
}

Reglas:
- "code" es opcional.
- Nunca incluyas comentarios tipo // o /* */ dentro del código.
- No escapes el JSON. No lo metas en strings.
- Nada fuera del JSON.
`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],

        // Hace que la salida sea JSON más limpio
        temperature: 0.3,
        max_tokens: 4096,
      });

      const raw = completion.choices[0].message.content;

      // Intentar parsear JSON
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
  // ============================================================
  // 🔥 FUNCIÓN ESPECIAL PARA FLASHCARDS
  // ============================================================
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
- Si no puedes generar JSON, devuelve un error (pero aún en JSON).
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

      // Intento de parseo directo
      try {
        return JSON.parse(raw);
      } catch (err) {}

      // Si viene con basura -> intento extraer el JSON interno
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (err) {}
      }

      // Último recurso -> retorno estandarizado
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

        // Mensajes para obligar JSON limpio
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

        // Hace que la salida sea JSON más limpio
        temperature: 0.3,
        max_tokens: 4096,
      });

      const raw = completion.choices[0].message.content;

      // Intentar parsear JSON
      try {
        return raw;
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

    const response = await this.groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return response.choices[0]?.message?.content || '';
  }
}
