import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { CreateFlashCardDto, UpdateFlashCardDto } from './dto/create-flash-card.dto';
import { FlashCardFiltersDto, CardFiltersDto } from './dto/filters.dto';

@Controller('flash-cards')
@UseGuards(JwtGuard)
export class FlashCardsController {
  constructor(private flashCardsService: FlashCardsService) {}

  // ==================== CARDS ====================

  @Post('cards')
  async createCard(@Body() input: { title: string; description?: string }, @Req() req: any) {
    return this.flashCardsService.createCard(input, req.user.id);
  }

  @Get('cards')
  async getAllCards(@Query() filters: CardFiltersDto, @Req() req: any) {
    return this.flashCardsService.getAllCards(filters, req.user.id);
  }

  @Get('cards/:id')
  async getCardById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.getCardById(id, req.user.id);
  }

  @Patch('cards/:id')
  async updateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: { title?: string; description?: string },
    @Req() req: any
  ) {
    return this.flashCardsService.updateCard(id, input, req.user.id);
  }

  @Delete('cards/:id')
  async deleteCard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.deleteCard(id, req.user.id);
  }

  @Get('cards/:id/stats')
  async getCardStats(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.getCardStats(id, req.user.id);
  }

  // ==================== FLASHCARDS ====================

  @Post('flashcards')
  async createFlashcard(@Body() input: CreateFlashCardDto, @Req() req: any) {
    return this.flashCardsService.createFlashcard(input, req.user.id);
  }

  @Get('cards/:cardId/flashcards')
  async getFlashcardsByCard(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Query() filters: FlashCardFiltersDto,
    @Req() req: any
  ) {
    return this.flashCardsService.getFlashcardsByCard(cardId, filters, req.user.id);
  }

  @Get('flashcards/:id')
  async getFlashcardById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.getFlashcardById(id, req.user.id);
  }

  @Patch('flashcards/:id')
  async updateFlashcard(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateFlashCardDto,
    @Req() req: any
  ) {
    return this.flashCardsService.updateFlashcard(id, input, req.user.id);
  }

  @Delete('flashcards/:id')
  async deleteFlashcard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.deleteFlashcard(id, req.user.id);
  }

  @Patch('flashcards/:id/review')
  async markFlashcardAsReviewed(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.markFlashcardAsReviewed(id, req.user.id);
  }

  // ==================== AI GENERATION ====================

  @Post('generate/topic')
  async generateFromTopic(
    @Body() input: { topic: string; numberOfCards: number; cardId: number },
    @Req() req: any
  ) {
    return this.flashCardsService.generateFromTopic(input, req.user.id);
  }

  @Post('generate/reference')
  async generateFromReference(
    @Body() input: { referenceText: string; numberOfCards: number; cardId: number },
    @Req() req: any
  ) {
    return this.flashCardsService.generateFromReference(input, req.user.id);
  }
}
