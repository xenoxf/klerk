import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { QuickQuiz } from './quick-quiz.entity';
import { QuickQuizOption } from './quick-quiz-option.entity';

@Entity('quick_quiz_questions')
export class QuickQuizQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @ManyToOne(() => QuickQuiz, (qq) => qq.questions, { onDelete: 'CASCADE' })
  quickQuiz: QuickQuiz;

  @OneToMany(() => QuickQuizOption, (opt) => opt.question)
  options: QuickQuizOption[];
}
