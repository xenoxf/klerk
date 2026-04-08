import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamAttemptsController } from './exam-attempts.controller';
import { ExamAttemptsService } from './exam-attempts.service';
import { ExamAttempt } from './entities/exam-attempt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamAttempt])],
  controllers: [ExamAttemptsController],
  providers: [ExamAttemptsService],
  exports: [ExamAttemptsService],
})
export class ExamAttemptsModule {}
