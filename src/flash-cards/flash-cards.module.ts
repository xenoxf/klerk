import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashCardsController } from './flash-cards.controller';
import { FlashCardsService } from './flash-cards.service';
import { FlashCard } from './entities/flash-card.entity';
import { Card } from './entities/card.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { CreditsModule } from '../credits/credits.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FlashCard, Card]),
    GeminiModule,
    CreditsModule,
    LikesModule,
  ],
  controllers: [FlashCardsController],
  providers: [FlashCardsService],
  exports: [FlashCardsService],
})
export class FlashCardsModule {}
