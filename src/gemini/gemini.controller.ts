import { Controller, Get, Sse } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
