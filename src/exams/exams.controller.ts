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
import { ExamsService } from './exams.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';

@Controller('exams')
@UseGuards(JwtGuard)
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post()
  async create(@Body() input: { title: string; description: string }, @Req() req: any) {
    return this.examsService.create(input, req.user.id);
  }

  @Get()
  async getAll(
    @Query() filters: { search?: string; sort?: 'newest' | 'oldest' | 'byScore'; page?: number; limit?: number },
    @Req() req: any
  ) {
    return this.examsService.getAll(filters, req.user.id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.examsService.getById(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: { title?: string; description?: string },
    @Req() req: any
  ) {
    return this.examsService.update(id, input, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.examsService.delete(id, req.user.id);
  }

  @Post(':examId/questions')
  async addQuestion(
    @Param('examId', ParseIntPipe) examId: number,
    @Body()
    input: {
      question: string;
      options: string[];
      correctOptionIndex: number;
      explanation?: string;
    },
    @Req() req: any
  ) {
    return this.examsService.addQuestion(examId, input, req.user.id);
  }
}
