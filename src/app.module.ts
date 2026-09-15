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
import { AiModule } from './ai/ai.module';
import { AgentModule } from './agent/agent.module';
import { SearchModule } from './search/search.module';
import { GroqModule } from './groq/groq.module';
import { GeminiModule } from './gemini/gemini.module';
import { GlobalChatModule } from './global-chat/global-chat.module';
import { CreditsModule } from './credits/credits.module';
import { LikesModule } from './likes/likes.module';
import { ExamAttemptsModule } from './exam-attempts/exam-attempts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
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
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ExamsModule,
    FlashCardsModule,
    NotesModule,
    MessagesModule,
    AiModule,
    AgentModule,
    SearchModule,
    GroqModule,
    GeminiModule,
    GlobalChatModule,
    CreditsModule,
    LikesModule,
    ExamAttemptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
