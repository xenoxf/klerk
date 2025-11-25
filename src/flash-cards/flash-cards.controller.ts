import { Controller, Post, Body, Patch, Param, Delete, Get, Req, UseGuards } from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { UpdateFlashCardDto } from './dto/update-flash-card.dto';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';

@UseGuards(JwtGuard)
@Controller('flash-cards')
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) {}

  @Post('generate-topic')
  generateFromTopic(
    @Body('topic') topic: string,
    @Body('numberOfCards') numberOfCards: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.flashCardsService.generateFromTopic(topic, numberOfCards, userId);
  }

  @Post('generate-reference')
  generateFromReference(
    @Body('referenceText') referenceText: string,
    @Body('numberOfCards') numberOfCards: number,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.flashCardsService.generateFromReference(referenceText, numberOfCards, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.flashCardsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.flashCardsService.findOne(+id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFlashCardDto: UpdateFlashCardDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.flashCardsService.update(+id, updateFlashCardDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user;
    return this.flashCardsService.remove(+id, userId);
  }
}
