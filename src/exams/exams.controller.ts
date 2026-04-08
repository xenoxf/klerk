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
  ForbiddenException,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam } from './entities/exam.entity';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';

// letras mas usadas
// a & $ e & @ i & ! o & 0 u & v

function getNumericUserId(req: any): number {
  const userId = Number(req.user?.id);
  if (isNaN(userId)) {
    throw new ForbiddenException('Acceso no permitido');
  }
  return userId;
}

@UseGuards(JwtGuard)
@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) { }

  // ==================== BASIC CRUD ====================

  @Get()
  getAll(@Req() req: any) {
    return this.examsService.getPublicExamsDeck(req?.user?.id);
  }

  @UseGuards(JwtGuard, RequireAuthGuard)
  @Get('private')
  getMyExamsDeck(@Req() req: any) {
    return this.examsService.getMyExamsDeck(getNumericUserId(req));
  }

  @Get('public')
  getPublicExamsDeck(@Req() req: any) {
    return this.examsService.getPublicExamsDeck(req?.user?.id);
  }

  @Get('code/:code')
  getByCode(@Param('code') code: string, @Req() req: any) {
    return this.examsService.getExamByCode(code, req?.user?.id);
  }

  /**
   * Get exam for playing (klek format) - includes questions
   * Different from :id endpoint which may return deck format
   */
  @Get('play/:id') getForPlay(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.examsService.getByIdForPlay(id, getNumericUserId(req));
  }

  /**
   * Get exam in locked format - ONLY for owner
   */
  @Get('locked/:id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  getLocked(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.examsService.getLockedExam(id, getNumericUserId(req));
  }

  @Get('deck') getExamsDeck(@Req() req: any) {
    return this.examsService.getMyExamsDeck(getNumericUserId(req));
  }

  @Get('search')
  searchExams(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('searchInQuestions') searchInQuestions: string = 'true',
    @Req() req: any,
  ) {
    return this.examsService.searchExams(
      query,
      req?.user?.id,
      limit,
      offset,
      searchInQuestions === 'true',
    );
  }

  @Get('score')
  updateExamScore(@Query() query: UpdateExamDto, @Req() req: any) {
    return this.examsService.updateExamScore(query, getNumericUserId(req));
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.examsService.getByIdWithAccess(id, req?.user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.examsService.delete(id, getNumericUserId(req));
  }

  // ==================== AI GENERATION ====================

  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard, RequireAuthGuard)
  generateFromTopic(@Body() input: GenerateExamDto, @Req() req: any) {
    return this.examsService.generateExam(input, getNumericUserId(req));
  }

  // ==================== CRUD OPERATIONS ====================

  @Post()
  @UseGuards(JwtGuard, RequireAuthGuard)
  create(@Body() body: Partial<Exam>, @Req() req: any) {
    return this.examsService.create(body, getNumericUserId(req));
  }

  @Put(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<Exam>,
    @Req() req: any,
  ) {
    return this.examsService.update(id, body, getNumericUserId(req));
  }

  @UseGuards(JwtGuard, RequireAuthGuard)
  @Delete('all')
  deleteAll(@Req() req: any) {
    return this.examsService.deleteAll(getNumericUserId(req));
  }
}
