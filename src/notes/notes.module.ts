import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Note } from './entities/note.entity';
import { NoteContent } from './entities/note-content.entity';
import { GroqModule } from 'src/groq/groq.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note, NoteContent]),
    GroqModule,
    AuthModule,
  ],
  providers: [NotesService],
  controllers: [NotesController],
})
export class NotesModule {}
