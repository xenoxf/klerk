import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuickQuizzesController } from './quick-quizzes.controller';
import { QuickQuizzesService } from './quick-quizzes.service';
import { QuickQuiz } from './entities/quick-quiz.entity';
import { QuickQuizQuestion } from './entities/quick-quiz-question.entity';
import { QuickQuizOption } from './entities/quick-quiz-option.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { CreditsModule } from '../credits/credits.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuickQuiz, QuickQuizQuestion, QuickQuizOption]),
    GeminiModule,
    CreditsModule,
    LikesModule,
  ],
  controllers: [QuickQuizzesController],
  providers: [QuickQuizzesService],
  exports: [QuickQuizzesService],
})
export class QuickQuizzesModule {}
