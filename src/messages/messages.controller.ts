import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';

@UseGuards(JwtGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send')
  @UseGuards(RequireAuthGuard)
  sendWithAIResponse(
    @Body() input: { prompt: string; chatId?: number },
    @Req() req,
  ) {
    return this.messagesService.sendMessageWithAIResponse(input, req.user.id);
  }

  @Post('chats')
  @UseGuards(RequireAuthGuard)
  createChat(@Body() input: { title?: string }, @Req() req: any) {
    return this.messagesService.createChat(req.user.id, input.title);
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
  @UseGuards(RequireAuthGuard)
  deleteChat(@Param('chatId') chatId: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.messagesService.deleteChat(+chatId, userId);
  }
}
