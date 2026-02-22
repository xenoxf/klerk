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
  BadRequestException,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ApiKeyGuard } from '../common/guards/api-key/api-key.guard';
import { GenerateExamDto } from './dto/generate-exam.dto';

// letras mas usadas
// a & $ e & @ i & ! o & 0 u & v

@Controller('exams')
@UseGuards(JwtGuard)
export class ExamsController {
  constructor(private examsService: ExamsService) { }

  // ==================== BASIC CRUD ====================

  @Get()
  getAll(@Req() req) {
    return this.examsService.getAll(req.user.id);
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.examsService.getById(id, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.examsService.delete(id, req.user.id);
  }

  // ==================== AI GENERATION ====================

  @Post('generate/topic_or_reference')
  generateFromTopic(@Body() input: GenerateExamDto, @Req() req) {
    if (!input.topic && !input.reference) {
      throw new BadRequestException(
        'Debe proporcionar un "topic" o "reference" para generar el examen.',
      );
    }
    if (input.topic && input.reference)
      throw new BadRequestException(
        'Debe proporcionar o un "topic"  una "reference" para generar el examen',
      );
    if (!input.topic) {
      return this.examsService.generateExamFromReference(input, req.user.id);
    }
    return this.examsService.generateExamFromTopic(input, req.user.id);
  }
}
