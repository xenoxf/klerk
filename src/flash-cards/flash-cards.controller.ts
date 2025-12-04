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
} from '@nestjs/common';
import { FlashCardsService } from './flash-cards.service';
import { CreateFlashCardDto, UpdateFlashCardDto } from './dto/create-flash-card.dto';
import { FlashCardFiltersDto, CardFiltersDto } from './dto/filters.dto';
import { JwtGuard } from '../auth/jwt/jwt.guard';

@Controller('flash-cards')
@UseGuards(JwtGuard)
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) {}

  // ==================== CARDS ====================

  @Post('cards')
  createCard(@Body() input: { title: string; description?: string }, @Req() req) {
    return this.flashCardsService.createCard(input, req.user.id);
  }

  @Get('cards')
  getAllCards(@Body() filters: CardFiltersDto, @Req() req) {
    return this.flashCardsService.getAllCards(filters, req.user.id);
  }

  @Get('cards/:id')
  getCardById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.flashCardsService.getCardById(id, req.user.id);
  }

  @Patch('cards/:id')
  updateCard(@Param('id', ParseIntPipe) id: number, @Body() input: { title?: string; description?: string }, @Req() req) {
    return this.flashCardsService.updateCard(id, input, req.user.id);
  }

  @Delete('cards/:id')
  deleteCard(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.flashCardsService.deleteCard(id, req.user.id);
  }

  @Get('cards/:id/stats')
  getCardStats(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.flashCardsService.getCardStats(id, req.user.id);
  }

  // ==================== FLASHCARDS ====================

  @Post('flashcards')
  createFlashcard(@Body() input: CreateFlashCardDto, @Req() req) {
    return this.flashCardsService.createFlashcard(input, req.user.id);
  }

  @Get('cards/:cardId/flashcards')
  getFlashcardsByCard(@Param('cardId', ParseIntPipe) cardId: number, @Body() filters: FlashCardFiltersDto, @Req() req) {
    return this.flashCardsService.getFlashcardsByCard(cardId, filters, req.user.id);
  }

  @Get('flashcards/:id')
  getFlashcardById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.flashCardsService.getFlashcardById(id, req.user.id);
  }

  @Patch('flashcards/:id')
  updateFlashcard(@Param('id', ParseIntPipe) id: number, @Body() input: UpdateFlashCardDto, @Req() req) {
    return this.flashCardsService.updateFlashcard(id, input, req.user.id);
  }

  @Delete('flashcards/:id')
  deleteFlashcard(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.flashCardsService.deleteFlashcard(id, req.user.id);
  }

  @Patch('flashcards/:id/review')
  markAsReviewed(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.flashCardsService.markFlashcardAsReviewed(id, req.user.id);
  }

  // ==================== AI GENERATION ====================

  @Post('generate/topic')
  generateFromTopic(@Body() input: { topic: string; numberOfCards: number; cardId: number }, @Req() req) {
    return this.flashCardsService.generateFromTopic(input, req.user.id);
  }

  @Post('generate/reference')
  generateFromReference(@Body() input: { referenceText: string; numberOfCards: number; cardId: number }, @Req() req) {
    return this.flashCardsService.generateFromReference(input, req.user.id);
  }
}
