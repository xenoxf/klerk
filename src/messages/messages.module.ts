import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { SharedModule } from '../shared/shared.module';
import { CreditsModule } from '../credits/credits.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message]),
    GeminiModule,
    SharedModule,
    CreditsModule,
    JwtModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
