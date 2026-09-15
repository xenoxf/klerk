import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiRouterService } from './ai-router.service';
import { UserAiConfig } from './entities/user-ai-config.entity';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqModule } from '../groq/groq.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAiConfig]),
    GroqModule,
    GeminiModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiRouterService, GroqProvider, GeminiProvider],
  exports: [AiRouterService, AiService, GroqProvider, GeminiProvider],
})
export class AiModule {}
