import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ExamAttemptsService } from './exam-attempts.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';
import { RecordAttemptDto } from './dto/record-attempt.dto';

@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('exam-attempts')
export class ExamAttemptsController {
  constructor(private readonly service: ExamAttemptsService) {}

  @Post()
  async recordAttempt(
    @Body()
    body: RecordAttemptDto,
    @Req() req: any,
  ) {
    return this.service.recordAttempt(
      getNumericUserId(req),
      body.examId,
      body.correctAnswers,
      body.totalQuestions,
      body.examTitle,
    );
  }

  @Get()
  async getMyAttempts(@Req() req: any) {
    return this.service.getUserAttempts(getNumericUserId(req));
  }

  @Get('deck')
  async getMyAttemptsDeck(@Req() req: any) {
    return this.service.getUserAttemptsDeck(getNumericUserId(req));
  }

  @Get('stats')
  async getMyStats(@Req() req: any) {
    return this.service.getUserStats(getNumericUserId(req));
  }
}
