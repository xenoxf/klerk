import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashCardsService } from './flash-cards.service';
import { FlashCardsController } from './flash-cards.controller';
import { Card } from './entities/card.entity';
import { FlashCard } from './entities/flash-card.entity';
import { GroqModule } from '../groq/groq.module';

@Module({
  imports: [TypeOrmModule.forFeature([Card, FlashCard]), GroqModule],
  controllers: [FlashCardsController],
  providers: [FlashCardsService],
})
export class FlashCardsModule { }
