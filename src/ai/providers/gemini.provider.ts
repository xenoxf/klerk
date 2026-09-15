import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../../gemini/gemini.service';
import {
  AiProvider,
  CardResponse,
  ChatResponse,
  ChatStreamChunk,
  Content,
  ExamResponse,
  FileInput,
  NoteResponse,
} from '../ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly providerId = 'gemini';
  modelName: string;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly configService: ConfigService,
  ) {
    this.modelName =
      configService.get<string>('AI_DEFAULT_GEMINI_MODEL') ||
      'gemini-2.5-flash-lite';
  }

  supportsVision(): boolean {
    return true;
  }

  isAvailable(): boolean {
    return this.geminiService.hasUsableKeys();
  }

  async chat(msg: string, history?: Content[]): Promise<ChatResponse> {
    const result = await this.geminiService.generateEducationalChatResponse(
      msg,
      undefined,
      history as any,
    );
    return {
      response: result.response,
      model: this.modelName,
      provider: this.providerId,
    };
  }

  async *chatStream(
    msg: string,
    history?: Content[],
  ): AsyncGenerator<ChatStreamChunk> {
    const gen = this.geminiService.generateEducationalChatResponseStream(
      msg,
      history as any,
    );
    for await (const chunk of gen) {
      yield { content: chunk, model: this.modelName, provider: this.providerId };
    }
  }

  async chatWithFile(
    msg: string,
    fileBase64: string,
    mimeType: string,
    history?: Content[],
  ): Promise<ChatResponse> {
    const result =
      await this.geminiService.generateEducationalChatResponseWithFile(
        msg,
        fileBase64,
        mimeType,
        history as any,
      );
    return {
      response: result.response,
      model: this.modelName,
      provider: this.providerId,
    };
  }

  async *chatWithFileStream(
    msg: string,
    files: FileInput[],
    history?: Content[],
  ): AsyncGenerator<ChatStreamChunk> {
    const gen =
      this.geminiService.generateEducationalChatResponseStreamWithFile(
        msg,
        files,
        history as any,
      );
    for await (const chunk of gen) {
      yield { content: chunk, model: this.modelName, provider: this.providerId };
    }
  }

  async generateExam(
    topic: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const r = await this.geminiService.generateExam(topic, num, diff);
    return r as unknown as ExamResponse;
  }

  async generateIcfesExam(
    topic: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const r = await this.geminiService.generateIcfesExam(topic, num, diff);
    return r as unknown as ExamResponse;
  }

  async generateNote(
    topic: string,
    num: number,
    detail: string,
  ): Promise<NoteResponse> {
    const r = await this.geminiService.generateNote(topic, num, detail);
    return r as unknown as NoteResponse;
  }

  async generateFlashcards(topic: string, num: number): Promise<CardResponse> {
    const r = await this.geminiService.generateFlashcards(topic, num);
    return r as unknown as CardResponse;
  }

  async generateTitle(msg: string): Promise<string> {
    return this.geminiService.generateChatTitleFromMessage(msg);
  }
}
