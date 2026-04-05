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
  ForbiddenException,
} from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';

function getNumericUserId(req: any): number {
  const userId = Number(req.user?.id);
  if (isNaN(userId)) {
    throw new ForbiddenException('Acceso no permitido');
  }
  return userId;
}

@UseGuards(JwtGuard)
@Controller('flash-cards')
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) { }

  // ==================== AI GENERATION ====================
  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard, RequireAuthGuard)
  generate(@Body() input: GenerateFlashCardsDto, @Req() req: any) {
    return this.flashCardsService.generateFrom(input, getNumericUserId(req));
  }

  // ==================== BASIC CRUD ====================
  @Get('public')
  findAllPublic(@Req() req: any) {
    return this.flashCardsService.findPublicCardsDeck(req?.user?.id);
  }

  @Get('private')
  @UseGuards(JwtGuard, RequireAuthGuard)
  findMyCards(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(getNumericUserId(req));
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

  @Get()
  @UseGuards(JwtGuard, RequireAuthGuard)
  findAllMine(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(getNumericUserId(req));
  }

  @Get('klek/:id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.getCardKlekById(+id, req?.user?.id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string, @Req() req: any) {
    return this.flashCardsService.getCardByCode(code, req?.user?.id);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.getCardById(+id, req?.user?.id);
  }

  @Post()
  @UseGuards(JwtGuard, RequireAuthGuard)
  create(@Body() body: any, @Req() req: any) {
    return this.flashCardsService.create(body, getNumericUserId(req));
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
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
