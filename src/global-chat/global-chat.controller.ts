import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { GlobalChatService } from './global-chat.service';
import { CreateGlobalChatMessageDto } from './dto/create-global-chat-message.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';

@Controller('global-chat')
export class GlobalChatController {
  constructor(private readonly globalChatService: GlobalChatService) {}

  @Get('messages')
  async findAll(@Query('limit', ParseIntPipe) limit?: number, @Query('offset', ParseIntPipe) offset?: number) {
    return this.globalChatService.findAll(limit, offset);
  }

  @Post('message')
  @UseGuards(JwtGuard)
  async create(@Body() createDto: CreateGlobalChatMessageDto, @Req() req: any) {
    return this.globalChatService.create(createDto, req.user.id);
  }

  @Get('user/messages')
  @UseGuards(JwtGuard)
  async findByUser(@Req() req: any, @Query('limit', ParseIntPipe) limit?: number, @Query('offset', ParseIntPipe) offset?: number) {
    return this.globalChatService.findByUser(req.user.id, limit, offset);
  }

  @Delete('message/:id')
  @UseGuards(JwtGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.globalChatService.remove(id, req.user.id);
  }
}
