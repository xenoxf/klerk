import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqService } from './groq.service';

@Controller('groq')
export class GroqController {
  constructor(
    private readonly groqService: GroqService,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  async getHealth() {
    return {
      status: 'OK',
      service: 'GroqService',
      provider: 'groq',
      model:
        this.configService.get<string>('GROQ_MODEL') ||
        'openai/gpt-oss-20b',
      visionModel:
        this.configService.get<string>('GROQ_VISION_MODEL') ||
        'qwen/qwen3.6-27b',
      timestamp: new Date().toISOString(),
    };
  }
}
