import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashCardsController } from './flash-cards.controller';
import { FlashCardsService } from './flash-cards.service';
import { FlashCard } from './entities/flash-card.entity';
import { Card } from './entities/card.entity';
import { GroqModule } from '../groq/groq.module';
import { SharedModule } from '../shared/shared.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashCard, Card]),
    GroqModule,
    SharedModule,
    CreditsModule,
  ],
  controllers: [FlashCardsController],
  providers: [FlashCardsService],
  exports: [FlashCardsService],
})
export class FlashCardsModule {}
