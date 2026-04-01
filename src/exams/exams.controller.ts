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
import { ExamsService } from './exams.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Exam } from './entities/exam.entity';

// letras mas usadas
// a & $ e & @ i & ! o & 0 u & v

@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  // ==================== BASIC CRUD ====================

  @Get()
  getAll(@Req() req: any) {
    return this.examsService.getPublicExamsDeck(req?.user?.id);
  }

  @Get('private')
  @UseGuards(JwtGuard)
  getMyExamsDeck(@Req() req: any) {
    return this.examsService.getMyExamsDeck(req.user.id);
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
  @Get('play/:id')
  @UseGuards(JwtGuard)
  getForPlay(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.examsService.getByIdForPlay(id, req.user.id);
  }

  @Get('deck')
  @UseGuards(JwtGuard)
  getExamsDeck(@Req() req: any) {
    return this.examsService.getMyExamsDeck(req.user.id);
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
  @UseGuards(JwtGuard)
  updateExamScore(@Query() query: UpdateExamDto, @Req() req: any) {
    return this.examsService.updateExamScore(query, req.user.id);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.examsService.getByIdWithAccess(id, req?.user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.examsService.delete(id, req.user.id);
  }

  // ==================== AI GENERATION ====================

  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard)
  generateFromTopic(@Body() input: GenerateExamDto, @Req() req: any) {
    return this.examsService.generateExam(input, req.user.id);
  }

  // ==================== CRUD OPERATIONS ====================

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() body: Partial<Exam>, @Req() req: any) {
    return this.examsService.create(body, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<Exam>,
    @Req() req: any,
  ) {
    return this.examsService.update(id, body, req.user.id);
  }
}
