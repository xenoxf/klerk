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
  Res,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Post('send/stream')
  async sendStream(
    @Body() input: { prompt: string; chatId?: number },
    @Req() req,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await this.messagesService.sendMessageStream(input, getNumericUserId(req));

    try {
      for await (const chunk of stream) {
        res.write(chunk);
      }
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || 'Error en el stream' });
      } else {
        res.write(JSON.stringify({ type: 'error', content: error.message || 'Error en el stream' }));
      }
    }

    res.end();
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
