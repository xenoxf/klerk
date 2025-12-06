import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Req,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { CreateFlashCardDto, UpdateFlashCardDto } from './dto/create-flash-card.dto';
import { FlashCardFiltersDto, CardFiltersDto } from './dto/filters.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';

@UseGuards(JwtGuard)
@UseGuards(ApiKeyGuard)
@Controller('flash-cards')
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) { }

  // ==================== AI GENERATION ====================
  @Post('generate/topic_or_reference')
  generate(@Body() input: any, @Req() req: any) {
    if (!input.topic && !input.referenceText) {
      throw new BadRequestException('Debe proporcionar un "topic" o "referenceText" para generar tarjetas.');
    }
    if (!input.referenceText) {
      return this.flashCardsService.generateFromTopic(input, req.user.id);
    }
    return this.flashCardsService.generateFromReference(input, req.user.id);
  }

  // ==================== BASIC CRUD ====================
  @Get()
  findAll(@Req() req: any) {
    return this.flashCardsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.remove(id, req.user.id);
  }
}
