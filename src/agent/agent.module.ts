import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CreditsModule } from '../credits/credits.module';
import { AgentService } from './agent.service';

@Module({
  imports: [AiModule, CreditsModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
