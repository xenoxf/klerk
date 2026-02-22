import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExamsModule } from './exams/exams.module';
import { FlashCardsModule } from './flash-cards/flash-cards.module';
import { NotesModule } from './notes/notes.module';
import { MessagesModule } from './messages/messages.module';
import { GroqModule } from './groq/groq.module';
import { SharedModule } from './shared/shared.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { Exam } from './exams/entities/exam.entity';
import { ExamQuestion } from './exams/entities/examQuestion.entity';
import { ExamOption } from './exams/entities/exam-option.entity';
import { FlashCard } from './flash-cards/entities/flash-card.entity';
import { Card } from './flash-cards/entities/card.entity';
import { Note } from './notes/entities/note.entity';
import { NoteContent } from './notes/entities/note-content.entity';
import { Chat } from './messages/entities/chat.entity';
import { Message } from './messages/entities/message.entity';

@Module({
  imports: [
    // Configuración del módulo de configuración
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Especifica explícitamente el archivo .env
    }),

    // Configuración de TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        ssl:
          configService.get<string>('SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        synchronize: true, // ⚠️ Solo en desarrollo - cambiar a false en producción
        // logging: true, // Agrega logging para ver las consultas SQL
      }),
      inject: [ConfigService],
    }),

    SharedModule,
    AuthModule,
    UsersModule,
    ExamsModule,
    FlashCardsModule,
    NotesModule,
    MessagesModule,
    GroqModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
