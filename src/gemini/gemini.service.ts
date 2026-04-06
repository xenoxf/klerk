import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AI_PROMPTS } from './AI_PROMPTS';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // ==================== HELPER ====================

  private async generateText(prompt: string): Promise<string> {
    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('La IA no gener\u00f3 contenido. Intenta de nuevo.');
    }
    return text.trim();
  }

  private cleanJson(raw: string): string {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
      throw new Error(`Formato JSON inv\u00e1lido. Respuesta: ${raw.substring(0, 200)}`);
    }
  }

  // ==================== EXAM ====================

  async generateExam(topic: string, numberOfQuestions: number, difficulty: string) {
    const prompt = AI_PROMPTS.generateExam(numberOfQuestions, difficulty);
    const raw = await this.generateText(`${prompt}\n\nTema: ${topic}`);
    const parsed = this.parseJson<any>(raw);

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('No se generaron preguntas v\u00e1lidas. Intenta con otro tema.');
    }
    if (!parsed.metadata || typeof parsed.metadata !== 'object') {
      throw new Error('Faltan metadatos en la respuesta del examen.');
    }
    for (const q of parsed.questions) {
      if (!q.question || !q.options || !Array.isArray(q.options)) {
        throw new Error('Las preguntas generadas tienen formato inv\u00e1lido.');
      }
    }
    return parsed;
  }

  // ==================== NOTE ====================

  async generateNote(topic: string, numberOfNotes: number, levelOfDetail: string) {
    const prompt = AI_PROMPTS.generateNote(numberOfNotes, levelOfDetail);
    const raw = await this.generateText(`${prompt}\n\nTema: ${topic}`);
    const parsed = this.parseJson<any>(raw);

    if (!parsed.notes || !Array.isArray(parsed.notes) || parsed.notes.length === 0) {
      throw new Error('No se generaron notas v\u00e1lidas. Intenta con otro tema.');
    }
    if (!parsed.metadata || typeof parsed.metadata !== 'object') {
      throw new Error('Faltan metadatos en la respuesta de notas.');
    }
    return parsed;
  }

  // ==================== FLASHCARDS ====================

  async generateFlashcards(topic: string, numberOfCards: number) {
    const prompt = AI_PROMPTS.generateFlashcards(numberOfCards);
    const raw = await this.generateText(`${prompt}\n\nTema: ${topic}`);
    const parsed = this.parseJson<any>(raw);

    if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      throw new Error('No se generaron flashcards v\u00e1lidas. Intenta con otro tema.');
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
    conversationHistory?: Array<{ prompt: string; response: string; createdAt: string }>,
  ) {
    let historyText = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-5);
      historyText = recent.map((m) => `Usuario: ${m.prompt}\nJunior: ${m.response}`).join('\n\n---\n\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: conversationHistory?.length || 0,
    });

    const fullPrompt = `${systemPrompt}\n\n${historyText ? `Historial reciente:\n${historyText}\n\n---\n\n` : ''}Usuario: ${userMessage}`;

    const raw = await this.generateText(fullPrompt);
    return { response: raw };
  }

  async *generateEducationalChatResponseStream(
    userMessage: string,
    conversationHistory?: Array<{ prompt: string; response: string; createdAt: string }>,
  ): AsyncIterable<string> {
    let historyText = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-5);
      historyText = recent.map((m) => `Usuario: ${m.prompt}\nJunior: ${m.response}`).join('\n\n---\n\n');
    }

    const systemPrompt = AI_PROMPTS.SYSTEM_PROMPT({
      previousTopics: [],
      messageCount: conversationHistory?.length || 0,
    });

    const fullPrompt = `${systemPrompt}\n\n${historyText ? `Historial reciente:\n${historyText}\n\n---\n\n` : ''}Usuario: ${userMessage}`;

    const result = await this.model.generateContentStream(fullPrompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  // ==================== CHAT TITLE ====================

  async generateChatTitleFromMessage(firstMessage: string): Promise<string> {
    const raw = await this.model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: AI_PROMPTS.CHAT_TITLE_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Entendido. Solo devolver\u00e9 el t\u00edtulo.' }] },
        { role: 'user', parts: [{ text: firstMessage.substring(0, 100).trim() }] },
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
