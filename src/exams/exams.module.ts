import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamOption } from './entities/exam-option.entity';
import { ExamQuestion } from './entities/examQuestion.entity';
import { AuthModule } from '../auth/auth.module';
import { GroqModule } from '../groq/groq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamOption, ExamQuestion]),
    AuthModule,
    GroqModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}
