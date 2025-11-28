import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashCardsService } from './flash-cards.service';
import { FlashCardsController } from './flash-cards.controller';
import { Card } from './entities/card.entity';
import { FlashCard } from './entities/flash-card.entity';
import { AuthModule } from 'src/auth/auth.module';
import { GroqService } from 'src/groq/groq.service';
import { GroqModule } from 'src/groq/groq.module';

@Module({
  imports: [TypeOrmModule.forFeature([Card, FlashCard]), AuthModule, GroqModule],
  controllers: [FlashCardsController],
  providers: [FlashCardsService],
  exports: [FlashCardsService],
})
export class FlashCardsModule { }
