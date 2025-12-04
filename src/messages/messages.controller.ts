import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';

@UseGuards(JwtGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  sendMessage(@Body('prompt') prompt: string, @Req() req: any, @Param('chatId') chatId: string) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.messagesService.sendMessage(prompt, userId, +chatId);
  }

  @Post('send')
  sendWithAIResponse(@Body() input: { prompt: string; chatId?: number }, @Req() req) {
    return this.messagesService.sendMessageWithAIResponse(input, req.user.id);
  }

  @Post('chat/create')
  createChat(@Body() input: { title?: string }, @Req() req) {
    return this.messagesService.createChatWithTitle(input, req.user.id);
  }

  @Get('chats')
  getUserChats(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.messagesService.getUserChats(userId);
  }

  @Get('chat/:chatId')
  getChatMessages(@Param('chatId') chatId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.messagesService.getChatMessages(+chatId, userId);
  }

  @Delete('chat/:chatId')
  deleteChat(@Param('chatId') chatId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.messagesService.deleteChat(+chatId, userId);
  }
}
