import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';

@UseGuards(JwtGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('chats/findAll')
  getAllChats(@Req() req: any) {
    return this.messagesService.getAllChats(req.user.id);
  }

  @Get('findAll/:chatId')
  getChatById(@Req() req: any, @Param('chatId') chatId: number) {
    const userId = req.user.id;
    return this.messagesService.getChatById(userId, chatId);
  }

  @Post('send')
  async sendMessage(@Body('prompt') prompt: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.messagesService.sendMessage(prompt, userId);
  }

  @Delete('chat/:id')
  removeChat(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.messagesService.removeChat(+id, userId);
  }
}
