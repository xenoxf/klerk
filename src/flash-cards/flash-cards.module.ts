import { Module } from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { FlashCardsController } from './flash-cards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flashcard } from './entities/flash-card.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard]), AuthModule],
  controllers: [FlashCardsController],
  providers: [FlashCardsService],
})
export class FlashCardsModule {}
