import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqService } from '../../groq/groq.service';
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
export class GroqProvider implements AiProvider {
  readonly providerId = 'groq';
  modelName: string;
  private readonly logger = new Logger(GroqProvider.name);

  constructor(
    private readonly groqService: GroqService,
    private readonly configService: ConfigService,
  ) {
    this.modelName =
      configService.get<string>('GROQ_MODEL') || 'openai/gpt-oss-20b';
  }

  supportsVision(): boolean {
    return true;
  }

  isAvailable(): boolean {
    return this.groqService.hasUsableKeys();
  }

  async chat(msg: string, history?: Content[]): Promise<ChatResponse> {
    const result = await this.groqService.generateEducationalChatResponse(
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
    const gen = this.groqService.generateEducationalChatResponseStream(
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
      await this.groqService.generateEducationalChatResponseWithFile(
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
      this.groqService.generateEducationalChatResponseStreamWithFile(
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
    const r = await this.groqService.generateExam(topic, num, diff);
    return r as unknown as ExamResponse;
  }

  async generateIcfesExam(
    topic: string,
    num: number,
    diff: string,
  ): Promise<ExamResponse> {
    const r = await this.groqService.generateIcfesExam(topic, num, diff);
    return r as unknown as ExamResponse;
  }

  async generateNote(
    topic: string,
    num: number,
    detail: string,
  ): Promise<NoteResponse> {
    const r = await this.groqService.generateNote(topic, num, detail);
    return r as unknown as NoteResponse;
  }

  async generateFlashcards(topic: string, num: number): Promise<CardResponse> {
    const r = await this.groqService.generateFlashcards(topic, num);
    return r as unknown as CardResponse;
  }

  async generateTitle(msg: string): Promise<string> {
    return this.groqService.generateChatTitleFromMessage(msg);
  }
}
