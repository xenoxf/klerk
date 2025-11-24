// groq.service.ts
import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { CreateExamDto } from 'src/exams/dto/create-exam.dto';
import { GenerateExamDto } from './dto/generate-exam.dto';

@Injectable()
export class GroqService {
  private groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  async chat(prompt: string) {
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
}
