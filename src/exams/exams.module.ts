import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/examQuestion.entity';
import { ExamOption } from './entities/exam-option.entity';
import { ExamContext } from './entities/exam-context.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { CreditsModule } from '../credits/credits.module';
import { LikesModule } from '../likes/likes.module';
import { ExamAttemptsModule } from '../exam-attempts/exam-attempts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamQuestion, ExamOption, ExamContext]),
    GeminiModule,
    CreditsModule,
    LikesModule,
    ExamAttemptsModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
