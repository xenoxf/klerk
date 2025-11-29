import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { NotesModule } from './notes/notes.module';
import { FlashCardsModule } from './flash-cards/flash-cards.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
//import { PerfilModule } from './perfil/perfil.module';
import { ExamsModule } from './exams/exams.module';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { JwtModule } from '@nestjs/jwt';
import { GroqModule } from './groq/groq.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: String(config.get('DB_HOST')),
        port: Number(config.get('DB_PORT')),
        username: String(config.get('DB_USER')),
        password: String(config.get('DB_PASS')),
        database: String(config.get('DB_NAME')),
        ssl:
          config.get('SSL') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: true, // ❗ solo en desarrollo
      }),
      inject: [ConfigService],
    }),

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
export class AppModule { }
