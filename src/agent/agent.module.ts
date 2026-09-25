import { Module } from '@nestjs/common';
import { GroqModule } from '../groq/groq.module';
import { CreditsModule } from '../credits/credits.module';
import { ExamsModule } from '../exams/exams.module';
import { FlashCardsModule } from '../flash-cards/flash-cards.module';
import { NotesModule } from '../notes/notes.module';
import { AgentService } from './agent.service';

@Module({
  imports: [GroqModule, CreditsModule, ExamsModule, FlashCardsModule, NotesModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
