import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ExamService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtGuard } from 'src/auth/jwt/jwt.guard';

@UseGuards(JwtGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examService: ExamService) {}

  @Post("create")
  create(@Body() createExamDto: CreateExamDto, @Req() req) {
    const userId = req.user.id;
    return this.examService.generateExam(userId,  createExamDto);
  }

  @Delete("delete/:id")
  remove(@Param('id') id: number, @Req() req) {
    const userId = req.user.id;
    return this.examService.remove(id, userId);
  }

  @Get("all")
  findAll(@Req() req ){
    const userId = req.user.id;
    return this.examService.findAll(userId);
  }

  @Get(":id")
  findExamById(@Param('id') id: number, @Req() req) {
    const userId = req.user.id;
    const exam = this.examService.findExamById(id, userId);
    return exam;
  }
}
