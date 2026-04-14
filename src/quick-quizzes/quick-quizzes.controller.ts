import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { QuickQuizzesService } from './quick-quizzes.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateQuickQuizDto } from './dto/generate-quick-quiz.dto';
import { CreateQuickQuizDto } from './dto/create-quick-quiz.dto';
import { UpdateQuickQuizDto } from './dto/update-quick-quiz.dto';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';

@UseGuards(JwtGuard)
@Controller('quick-quizzes')
export class QuickQuizzesController {
  constructor(private quickQuizzesService: QuickQuizzesService) {}

  // ==================== BASIC CRUD ====================

  @Get()
  getAll(@Req() req: any) {
    return this.quickQuizzesService.getPublicQuizzesDeck(req?.user?.id);
  }

  @UseGuards(JwtGuard, RequireAuthGuard)
  @Get('private')
  getMyQuizzesDeck(@Req() req: any) {
    return this.quickQuizzesService.getMyQuizzesDeck(getNumericUserId(req));
  }

  @Get('public')
  getPublicQuizzesDeck(@Req() req: any) {
    return this.quickQuizzesService.getPublicQuizzesDeck(req?.user?.id);
  }

  @Get('code/:code')
  getByCode(@Param('code') code: string, @Req() req: any) {
    return this.quickQuizzesService.getQuizByCode(code, req?.user?.id);
  }

  @Get('play/:id')
  getForPlay(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.quickQuizzesService.getByIdForPlay(id, getNumericUserId(req));
  }

  @Get('locked/:id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  getLocked(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.quickQuizzesService.getLockedQuiz(id, getNumericUserId(req));
  }

  @Get('deck')
  getQuizzesDeck(@Req() req: any) {
    return this.quickQuizzesService.getMyQuizzesDeck(getNumericUserId(req));
  }

  @Get('search')
  searchQuizzes(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('searchInQuestions') searchInQuestions: string = 'true',
    @Req() req: any,
  ) {
    return this.quickQuizzesService.searchQuizzes(
      query,
      req?.user?.id,
      limit,
      offset,
      searchInQuestions === 'true',
    );
  }

  @Get('score')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async updateQuizScore(@Query() query: UpdateQuickQuizDto, @Req() req: any) {
    const userId = getNumericUserId(req);
    return this.quickQuizzesService.updateQuizScore(query, userId);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.quickQuizzesService.getByIdWithAccess(id, req?.user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.quickQuizzesService.delete(id, getNumericUserId(req));
  }

  // ==================== AI GENERATION ====================

  @Post('generate')
  @UseGuards(JwtGuard, RequireAuthGuard)
  generateFromTopic(@Body() input: GenerateQuickQuizDto, @Req() req: any) {
    return this.quickQuizzesService.generateQuickQuiz(
      input,
      getNumericUserId(req),
    );
  }

  // ==================== CRUD OPERATIONS ====================

  @Post()
  @UseGuards(JwtGuard, RequireAuthGuard)
  create(@Body() body: CreateQuickQuizDto, @Req() req: any) {
    return this.quickQuizzesService.create(body, getNumericUserId(req));
  }

  @Put(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateQuickQuizDto,
    @Req() req: any,
  ) {
    return this.quickQuizzesService.update(id, body, getNumericUserId(req));
  }

  @UseGuards(JwtGuard, RequireAuthGuard)
  @Delete('all')
  deleteAll(@Req() req: any) {
    return this.quickQuizzesService.deleteAll(getNumericUserId(req));
  }
}
