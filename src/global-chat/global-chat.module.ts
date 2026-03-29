import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalChatService } from './global-chat.service';
import { GlobalChatController } from './global-chat.controller';
import { GlobalChatMessage } from './entities/global-chat-message.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GlobalChatMessage]),
    UsersModule,
  ],
  controllers: [GlobalChatController],
  providers: [GlobalChatService],
  exports: [GlobalChatService],
})
export class GlobalChatModule {}
