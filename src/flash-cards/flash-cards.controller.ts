import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FlashCardsService } from './flash-cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Controller('flash-cards')
@UseGuards(AuthGuard('jwt'))
export class FlashCardsController {
  constructor(private readonly flashCardsService: FlashCardsService) {}

  // ==================== AI GENERATION ENDPOINTS ====================

  @Post('generate/topic')
  @HttpCode(HttpStatus.CREATED)
  generateFromTopic(
    @Body() body: { topic: string; numberOfCards: number; cardId: number },
    @Req() req: any,
  ) {
    return this.flashCardsService.generateFromTopic(
      body.topic,
      body.numberOfCards,
      body.cardId,
      req.user.id,
    );
  }

  @Post('generate/reference')
  @HttpCode(HttpStatus.CREATED)
  generateFromReference(
    @Body() body: { referenceText: string; numberOfCards: number; cardId: number },
    @Req() req: any,
  ) {
    return this.flashCardsService.generateFromReference(
      body.referenceText,
      body.numberOfCards,
      body.cardId,
      req.user.id,
    );
  }

  // ==================== CARD ENDPOINTS ====================

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  createCard(@Body() createCardDto: CreateCardDto, @Req() req: any) {
    return this.flashCardsService.createCard(createCardDto, req.user.id);
  }

  @Get('cards')
  getAllCards(@Req() req: any) {
    return this.flashCardsService.getAllCards(req.user.id);
  }

  @Get('cards/:id')
  getCardById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.getCardById(id, req.user.id);
  }

  @Patch('cards/:id')
  updateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCardDto: UpdateCardDto,
    @Req() req: any,
  ) {
    return this.flashCardsService.updateCard(id, updateCardDto, req.user.id);
  }

  @Delete('cards/:id')
  deleteCard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.deleteCard(id, req.user.id);
  }

  @Patch('cards/:id/archive')
  archiveCard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.archiveCard(id, req.user.id);
  }

  @Patch('cards/:id/restore')
  restoreCard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.restoreCard(id, req.user.id);
  }

  @Get('cards/:id/stats')
  getCardStats(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.getCardStats(id, req.user.id);
  }

  @Get('cards/archived/all')
  getArchivedCards(@Req() req: any) {
    return this.flashCardsService.getArchivedCards(req.user.id);
  }

  // ==================== FLASHCARD ENDPOINTS ====================

  @Post('flashcards')
  @HttpCode(HttpStatus.CREATED)
  createFlashcard(@Body() createFlashcardDto: CreateFlashcardDto, @Req() req: any) {
    return this.flashCardsService.createFlashcard(
      createFlashcardDto,
      req.user.id,
    );
  }

  @Get('cards/:cardId/flashcards')
  getFlashcardsByCard(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Req() req: any,
  ) {
    return this.flashCardsService.getFlashcardsByCard(cardId, req.user.id);
  }

  @Get('flashcards/:id')
  getFlashcardById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.getFlashcardById(id, req.user.id);
  }

  @Patch('flashcards/:id')
  updateFlashcard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFlashcardDto: UpdateFlashcardDto,
    @Req() req: any,
  ) {
    return this.flashCardsService.updateFlashcard(
      id,
      updateFlashcardDto,
      req.user.id,
    );
  }

  @Delete('flashcards/:id')
  deleteFlashcard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.deleteFlashcard(id, req.user.id);
  }

  @Patch('flashcards/:id/archive')
  archiveFlashcard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.archiveFlashcard(id, req.user.id);
  }

  @Patch('flashcards/:id/review')
  reviewFlashcard(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.flashCardsService.reviewFlashcard(id, req.user.id);
  }
}
