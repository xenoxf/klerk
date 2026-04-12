import { Controller, Get } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Get('health')
  async getHealth() {
    return {
      status: 'OK',
      service: 'GeminiService',
      model: 'gemini-2.0-flash',
      timestamp: new Date().toISOString(),
    };
  }
}
