import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashCardsService } from './flash-cards.service';
import { FlashCardsController } from './flash-cards.controller';
import { Flashcard } from './entities/flash-card.entity';
import { GroqModule } from 'src/groq/groq.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard]), GroqModule, AuthModule],
  providers: [FlashCardsService],
  controllers: [FlashCardsController],
})
export class FlashCardsModule {}
