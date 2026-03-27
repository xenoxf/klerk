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
  BadRequestException,
} from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateFlashCardsDto } from './dto/generate-flash-cards.dto';

//@UseGuards(ApiKeyGuard)
@Controller('flash-cards')
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) { }

  // ==================== AI GENERATION ====================
  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard)
  generate(@Body() input: GenerateFlashCardsDto, @Req() req: any) {
    if (!input.reference) {
      throw new BadRequestException(
        'Debe proporcionar un "reference" (texto de referencia) para generar tarjetas.',
      );
    }
    return this.flashCardsService.generateFromReference(input, req.user.id);
  }

  // ==================== BASIC CRUD ====================
  @Get('public')
  findAllPublic() {
    return this.flashCardsService.findPublicCardsDeck();
  }

  @Get('private')
  @UseGuards(JwtGuard)
  findMyCards(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(req.user.id);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAllMine(@Req() req: any) {
    return this.flashCardsService.findMyCardsDeck(req.user.id);
  }

  @Get('klek/:id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.getCardKlekById(+id, req?.user?.id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.flashCardsService.getCardByCode(code);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.getCardById(+id, req?.user?.id);
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: any, @Req() req: any) {
    return this.flashCardsService.create(body, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.flashCardsService.update(+id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.flashCardsService.remove(+id, req.user.id);
  }
}
