import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { NotesModule } from './notes/notes.module';
import { FlashCardsModule } from './flash-cards/flash-cards.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExamsModule } from './exams/exams.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroqModule } from './groq/groq.module';

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
        logging: true, // Agrega logging para ver las consultas SQL
      }),
      inject: [ConfigService],
    }),

    // Tus módulos
    UsersModule,
    AuthModule,
    MessagesModule,
    NotesModule,
    FlashCardsModule,
    ExamsModule,
    GroqModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
