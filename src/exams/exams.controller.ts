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
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ExamsService } from './exams.service';
import { ExamAttemptsService } from '../exam-attempts/exam-attempts.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import {
  getNumericUserId,
  getOptionalNumericUserId,
} from '../common/utils/shared.utils';
import { AuthenticatedRequest } from '../common/types/request.type';
import { UploadedFile as FileUpload } from '../common/types/upload.type';

@UseGuards(JwtGuard)
@Controller('exams')
export class ExamsController {
  constructor(
    private examsService: ExamsService,
    private examAttemptsService: ExamAttemptsService,
  ) { }

  // ==================== BASIC CRUD ====================

  @Get()
  getAll(@Req() req: AuthenticatedRequest) {
    return this.examsService.getPublicExamsDeck(getOptionalNumericUserId(req));
  }

  @UseGuards(RequireAuthGuard)
  @Get('private')
  getMyExamsDeck(@Req() req: AuthenticatedRequest) {
    return this.examsService.getMyExamsDeck(getNumericUserId(req));
  }

  @Get('public')
  getPublicExamsDeck(@Req() req: AuthenticatedRequest) {
    return this.examsService.getPublicExamsDeck(getOptionalNumericUserId(req));
  }

  @Get('code/:code')
  getByCode(@Param('code') code: string, @Req() req: AuthenticatedRequest) {
    return this.examsService.getExamByCode(code, getOptionalNumericUserId(req));
  }

  /**
   * Get exam for playing (klek format) - includes questions
   * Different from :id endpoint which may return deck format
   */
  @Get('play/:id') getForPlay(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.examsService.getByIdForPlay(id, getOptionalNumericUserId(req));
  }

  /**
   * Get exam in locked format - ONLY for owner
   */
  @Get('locked/:id')
  @UseGuards(RequireAuthGuard)
  getLocked(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.examsService.getLockedExam(id, getNumericUserId(req));
  }

  @Get('deck') getExamsDeck(@Req() req: AuthenticatedRequest) {
    return this.examsService.getMyExamsDeck(getNumericUserId(req));
  }

  @Get('search')
  searchExams(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('offset', ParseIntPipe) offset: number = 0,
    @Query('searchInQuestions') searchInQuestions: string = 'true',
    @Req() req: AuthenticatedRequest,
  ) {
    return this.examsService.searchExams(
      query,
      getOptionalNumericUserId(req),
      limit,
      offset,
      searchInQuestions === 'true',
    );
  }

  @Get('score')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async updateExamScore(
    @Query() query: UpdateExamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getNumericUserId(req);
    const decks = await this.examsService.updateExamScore(query, userId);

    // Auto-record exam attempt when score is updated
    if (query.score !== undefined && query.id) {
      const examResult = await this.examsService.getById(query.id, userId);
      // examResult can be single exam or array, handle both
      const exam = Array.isArray(examResult) ? examResult[0] : examResult;
      if (exam && 'totalQuestions' in exam && 'title' in exam) {
        const examAny = exam as any;
        const correctAnswers = Math.round(
          (query.score / 100) * examAny.totalQuestions,
        );
        await this.examAttemptsService.recordAttempt(
          userId,
          query.id,
          correctAnswers,
          examAny.totalQuestions,
          examAny.title || 'Unknown Exam',
          query.userAnswers,
        );
      }
    }

    return decks;
  }

  @Get(':id')
  getById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.examsService.getByIdWithAccess(id, getOptionalNumericUserId(req));
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.examsService.delete(id, getNumericUserId(req));
  }

  // ==================== AI GENERATION ====================

  @Post('generate/topic_or_reference')
  @UseGuards(JwtGuard, RequireAuthGuard)
  generateFromTopic(
    @Body() input: GenerateExamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.examsService.generateExam(input, getNumericUserId(req));
  }

  @Post('generate/from-file')
  @UseGuards(JwtGuard, RequireAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: any) => {
      const allowed = [
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'application/pdf',
      ];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de archivo no soportado. Solo imágenes (PNG, JPG, WEBP, GIF) y PDF'), false);
      }
    },
  }))
  async generateFromFile(
    @UploadedFiles() files: FileUpload[],
    @Body() input: {
      reference?: string;
      numberOfQuestions?: number;
      difficulty?: string;
      type?: 'quiz' | 'icfes';
      acceso?: string;
    },
    @Req() req: AuthenticatedRequest,
  ) {
    if (!files || files.length === 0) {
      throw new Error('Archivo requerido');
    }
    const filePayloads = files.map(f => ({
      fileBase64: f.buffer.toString('base64'),
      mimeType: f.mimetype,
    }));
    return this.examsService.generateExamFromFile(
      {
        files: filePayloads,
        reference: input.reference || '',
        numberOfQuestions: input.numberOfQuestions || 10,
        difficulty: input.difficulty || 'medium',
        type: input.type || 'quiz',
        acceso: input.acceso || 'public',
      },
      getNumericUserId(req),
    );
  }

  // ==================== CRUD OPERATIONS ====================

  @Post()
  @UseGuards(JwtGuard, RequireAuthGuard)
  create(@Body() body: CreateExamDto, @Req() req: AuthenticatedRequest) {
    return this.examsService.create(body, getNumericUserId(req));
  }

  @Put(':id')
  @UseGuards(JwtGuard, RequireAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateExamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.examsService.update(id, body, getNumericUserId(req));
  }

  @UseGuards(JwtGuard, RequireAuthGuard)
  @Delete('all')
  deleteAll(@Req() req: AuthenticatedRequest) {
    return this.examsService.deleteAll(getNumericUserId(req));
  }
}
