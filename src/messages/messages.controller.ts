import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { MessagesService } from './messages.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';
import { AuthenticatedRequest } from '../common/types/request.type';

@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send')
  sendWithAIResponse(
    @Body() input: { prompt: string; chatId?: number },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.sendMessageWithAIResponse(
      input,
      getNumericUserId(req),
    );
  }

  @Post('send/stream')
  async sendStream(
    @Body() input: { prompt: string; chatId?: number },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await this.messagesService.sendMessageStream(
      input,
      getNumericUserId(req),
    );

    try {
      for await (const chunk of stream) {
        res.write(chunk);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error en el stream';
      if (!res.headersSent) {
        res.status(500).json({ message: errorMessage });
      } else {
        res.write(
          JSON.stringify({
            type: 'error',
            content: errorMessage,
          }),
        );
      }
    }

    res.end();
  }

  @Post('chats')
  createChat(
    @Body() input: { title?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.createChat(getNumericUserId(req), input.title);
  }

  @Get('chats')
  getUserChats(@Req() req: AuthenticatedRequest) {
    return this.messagesService.getUserChats(getNumericUserId(req));
  }

  @Get('chat/:chatId')
  getChatMessages(
    @Param('chatId') chatId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.getChatMessages(+chatId, getNumericUserId(req));
  }

  @Delete('chat/:chatId')
  deleteChat(
    @Param('chatId') chatId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagesService.deleteChat(+chatId, getNumericUserId(req));
  }
}
