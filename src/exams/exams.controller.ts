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
  Request,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { GenerateExamDto } from './dto/generate-exam.dto';

@Controller('exams')
@UseGuards(JwtGuard)
@UseGuards(ApiKeyGuard)
export class ExamsController {
  constructor(private examsService: ExamsService) { }

  // ==================== BASIC CRUD ====================

  @Post()
  create(@Body() createExamDto: CreateExamDto, @Req() req) {
    return this.examsService.create(createExamDto, req.user.id);
  }

  @Get()
  getAll(@Req() req) {
    return this.examsService.getAll(req.user.id);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.examsService.getById(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateExamDto: UpdateExamDto, @Req() req) {
    return this.examsService.update(id, updateExamDto, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.examsService.delete(id, req.user.id);
  }

  @Post(':examId/questions')
  addQuestion(@Param('examId', ParseIntPipe) examId: number, @Body() input: any, @Req() req) {
    return this.examsService.addQuestion(examId, input, req.user.id);
  }

  @Post('generate')
  generate(@Body() input: any, @Req() req) {
    return this.examsService.generate(input, req.user.id);
  }

  // ==================== AI GENERATION ====================

  @Post('generate/topic_or_referencia')
  generateFromTopic(@Body() input: GenerateExamDto, @Req() req) {
    return this.examsService.generateExamFromTopic(input as any, req.user.id);
  }

}
