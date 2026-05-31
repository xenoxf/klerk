import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { CreditsModule } from '../credits/credits.module';
import { FileStorageService } from '../common/file-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, Message]),
    GeminiModule,
    CreditsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, FileStorageService],
  exports: [MessagesService],
})
export class MessagesModule {}
