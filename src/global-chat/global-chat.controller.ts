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
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';

@Controller('global-chat')
export class GlobalChatController {
  constructor(private readonly globalChatService: GlobalChatService) {}

  // ==================== PUBLIC ====================

  @Get('messages')
  async findAll() {
    return this.globalChatService.findAll();
  }

  // ==================== AUTHENTICATED ====================

  @Post('message')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async create(@Body() createDto: CreateGlobalChatMessageDto, @Req() req: any) {
    return this.globalChatService.create(createDto, getNumericUserId(req));
  }

  @Get('user/messages')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async findByUser(@Req() req: any) {
    return this.globalChatService.findByUser(getNumericUserId(req));
  }

  @Delete('message/:id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.globalChatService.remove(id, getNumericUserId(req));
  }
}
