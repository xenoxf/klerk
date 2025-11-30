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
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';

@Controller('messages')
@UseGuards(JwtGuard)
@UseGuards(ApiKeyGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) { }

  @Post()
  async sendMessage(@Body() input: { content: string }, @Req() req: any) {
    return this.messagesService.sendMessage(input.content, req.user.id);
  }

  @Get()
  async getMessages(
    @Query()
    filters: {
      chatId?: number;
      role?: 'user' | 'bot';
      search?: string;
      page?: number;
      limit?: number;
    },
    @Req() req: any,
  ) {
    return this.messagesService.getMessages(filters, req.user.id);
  }

  @Delete(':id')
  async deleteMessage(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.messagesService.deleteMessage(id, req.user.id);
  }

  @Delete('chat/:chatId')
  async deleteChat(@Param('chatId', ParseIntPipe) chatId: number, @Req() req: any) {
    return this.messagesService.deleteChat(chatId, req.user.id);
  }

  @Get('search')
  async searchMessages(
    @Req() req: any,
    @Query('q') query: string,
    @Query('chatId') chatId?: number
  ) {
    return this.messagesService.searchMessages(query, { chatId }, req.user.id);
  }
}
