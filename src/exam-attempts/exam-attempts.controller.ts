import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ExamAttemptsService } from './exam-attempts.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';

function getNumericUserId(req: any): number {
  const userId = Number(req.user?.id);
  if (isNaN(userId)) throw new ForbiddenException('Acceso no permitido');
  return userId;
}

@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('exam-attempts')
export class ExamAttemptsController {
  constructor(private readonly service: ExamAttemptsService) {}

  @Post()
  async recordAttempt(
    @Body() body: { examId: number; correctAnswers: number; totalQuestions: number; examTitle: string },
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

  @Get('stats')
  async getMyStats(@Req() req: any) {
    return this.service.getUserStats(getNumericUserId(req));
  }
}
