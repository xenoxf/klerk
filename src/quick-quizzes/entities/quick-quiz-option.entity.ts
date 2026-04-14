import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

import { QuickQuizQuestion } from './quick-quiz-question.entity';

@Entity('quick_quiz_options')
export class QuickQuizOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @ManyToOne(() => QuickQuizQuestion, (q) => q.options, { onDelete: 'CASCADE' })
  question: QuickQuizQuestion;
}
