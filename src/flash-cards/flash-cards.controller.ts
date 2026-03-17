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
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';

@UseGuards(JwtGuard)
//@UseGuards(ApiKeyGuard)
@Controller('flash-cards')
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) { }

  // ==================== AI GENERATION ====================
  @Post('generate/topic_or_reference')
  generate(@Body() input: GenerateFlashCardsDto, @Req() req: any) {
    if (!input.topic && !input.referenceText) {
      throw new BadRequestException(
        'Debe proporcionar un "topic" o "referenceText" para generar tarjetas.',
      );
    }
    if (input.topic && input.referenceText)
      throw new BadRequestException(
        'No puede proporcionar ambos "topic" y "referenceText". Por favor, elija uno :).',
      );
    if (!input.referenceText) {
      return this.flashCardsService.generateFromTopic(input, req.user.id);
    }
    return this.flashCardsService.generateFromReference(input, req.user.id);
  }

  // ==================== BASIC CRUD ====================
  @Get('public')
  findAll() {
    return this.flashCardsService.findPublicCardsDeck();
  }

  @Get()
  findMyCards(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.findCardById(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.remove(id, req.user.id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.flashCardsService.getCardByCode(code);
  }
}
