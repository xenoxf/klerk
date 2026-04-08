import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { NoteContent } from './entities/note-content.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { SharedModule } from '../shared/shared.module';
import { CreditsModule } from '../credits/credits.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, NoteContent]),
    GeminiModule,
    SharedModule,
    CreditsModule,
    LikesModule,
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
