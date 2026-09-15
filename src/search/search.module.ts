import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Exam } from '../exams/entities/exam.entity';
import { Note } from '../notes/entities/note.entity';
import { Card } from '../flash-cards/entities/card.entity';
import { Chat } from '../messages/entities/chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, Note, Card, Chat]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
