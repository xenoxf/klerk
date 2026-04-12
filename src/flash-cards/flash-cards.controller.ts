import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';
import { CreateFlashCardDto } from './dto/create-flash-card.dto';
import { UpdateFlashCardDto } from './dto/update-flash-card.dto';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';

@Controller('flash-cards')
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) {}

  // ==================== PUBLIC ENDPOINTS (no auth required) ====================

  @Get('public')
  findAllPublic(@Req() req: any) {
    return this.flashCardsService.findPublicCardsDeck(req?.user?.id);
  }

  @Get('search')
  searchFlashCards(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('searchInCards') searchInCards: string = 'true',
    @Req() req: any,
  ) {
    return this.flashCardsService.searchFlashCards(
      query,
      req?.user?.id,
      limit,
      offset,
      searchInCards === 'true',
    );
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string, @Req() req: any) {
    return this.flashCardsService.getCardByCode(code, req?.user?.id);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.getCardById(+id, req?.user?.id);
  }

  @Get('klek/:id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.getCardKlekById(+id, req?.user?.id);
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  @Get()
  @UseGuards(JwtGuard)
  findAllMine(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(getNumericUserId(req));
  }

  @Get('private')
  @UseGuards(JwtGuard, RequireAuthGuard)
  findMyCards(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(getNumericUserId(req));
  }

  @UseGuards(JwtGuard)
  @Get('deck')
  getDeck(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(getNumericUserId(req));
  }

  /**
   * Get card in locked format - ONLY for owner
   */
  @Get('locked/:id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  findLocked(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.getLockedCard(+id, getNumericUserId(req));
  }

  // ==================== AI GENERATION & CRUD ====================

  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard, RequireAuthGuard)
  generate(@Body() input: GenerateFlashCardsDto, @Req() req: any) {
    return this.flashCardsService.generateFrom(input, getNumericUserId(req));
  }

  @Post()
  @UseGuards(JwtGuard, RequireAuthGuard)
  create(@Body() body: CreateFlashCardDto, @Req() req: any) {
    return this.flashCardsService.create(body, getNumericUserId(req));
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  update(@Param('id') id: string, @Body() body: UpdateFlashCardDto, @Req() req: any) {
    return this.flashCardsService.update(+id, body, getNumericUserId(req));
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.remove(+id, getNumericUserId(req));
  }

  @Delete('all')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async deleteAll(@Req() req: any) {
    return this.flashCardsService.deleteAll(getNumericUserId(req));
  }
}
