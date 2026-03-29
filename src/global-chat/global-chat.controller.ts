import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { GlobalChatService } from './global-chat.service';
import { CreateGlobalChatMessageDto } from './dto/create-global-chat-message.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';

@Controller('global-chat')
export class GlobalChatController {
  constructor(private readonly globalChatService: GlobalChatService) {}

  @Get('messages')
  async findAll() {
    return this.globalChatService.findAll();
  }

  @Post('message')
  @UseGuards(JwtGuard)
  async create(
    @Body() createDto: CreateGlobalChatMessageDto,
    @Req() req: any,
  ) {
    return this.globalChatService.create(createDto, req.user.id);
  }

  @Get('user/messages')
  @UseGuards(JwtGuard)
  async findByUser(@Req() req: any) {
    return this.globalChatService.findByUser(req.user.id);
  }

  @Delete('message/:id')
  @UseGuards(JwtGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.globalChatService.remove(id, req.user.id);
  }
}
