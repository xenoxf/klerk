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
import { GeminiModule } from './gemini/gemini.module';
import { GlobalChatModule } from './global-chat/global-chat.module';
import { CreditsModule } from './credits/credits.module';
import { LikesModule } from './likes/likes.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // Configuración del módulo de configuración
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Especifica explícitamente el archivo .env
    }),

    // Rate Limiting con Throttler (seguridad adicional)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 10, // 10 peticiones por minuto por IP
      },
    ]),

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

    AuthModule,
    UsersModule,
    ExamsModule,
    FlashCardsModule,
    NotesModule,
    MessagesModule,
    GeminiModule,
    GlobalChatModule,
    CreditsModule,
    LikesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
