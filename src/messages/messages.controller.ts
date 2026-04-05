import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';

function getNumericUserId(req: any): number {
  const userId = Number(req.user?.id);
  if (isNaN(userId)) {
    throw new ForbiddenException('Acceso no permitido');
  }
  return userId;
}

@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send')
  sendWithAIResponse(
    @Body() input: { prompt: string; chatId?: number },
    @Req() req,
  ) {
    return this.messagesService.sendMessageWithAIResponse(input, getNumericUserId(req));
  }

  @Post('chats')
  createChat(@Body() input: { title?: string }, @Req() req: any) {
    return this.messagesService.createChat(getNumericUserId(req), input.title);
  }

  @Get('chats')
  getUserChats(@Req() req: any) {
    return this.messagesService.getUserChats(getNumericUserId(req));
  }

  @Get('chat/:chatId')
  getChatMessages(@Param('chatId') chatId: string, @Req() req: any) {
    return this.messagesService.getChatMessages(+chatId, getNumericUserId(req));
  }

  @Delete('chat/:chatId')
  deleteChat(@Param('chatId') chatId: string, @Req() req: any) {
    return this.messagesService.deleteChat(+chatId, getNumericUserId(req));
  }
}
