import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
import { GroqModule } from '../groq/groq.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Chat]), GroqModule, AuthModule],
  providers: [MessagesService],
  controllers: [MessagesController],
})
export class MessagesModule {}
