import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/examQuestion.entity';
import { ExamOption } from './entities/exam-option.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { SharedModule } from '../shared/shared.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamQuestion, ExamOption]),
    GeminiModule,
    SharedModule,
    CreditsModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
