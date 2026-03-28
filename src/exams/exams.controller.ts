import {
  Controller,
  Get,
  Post,
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

// letras mas usadas
// a & $ e & @ i & ! o & 0 u & v

@Controller('exams')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  // ==================== BASIC CRUD ====================

  @Get()
  getAll() {
    return this.examsService.getPublicExamsDeck();
  }

  @Get('private')
  @UseGuards(JwtGuard)
  getMyExamsDeck(@Req() req: any) {
    return this.examsService.getMyExamsDeck(req.user.id);
  }

  @Get('public')
  getPublicExamsDeck() {
    return this.examsService.getPublicExamsDeck();
  }

  @Get('code/:code')
  getByCode(@Param('code') code: string) {
    return this.examsService.getExamByCode(code);
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
}
