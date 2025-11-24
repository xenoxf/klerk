import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ExamQuestion } from '../../exams/entities/examQuestion.entity';

@Entity()
export class ExamOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ default: false })
  isCorrect: boolean;

  @ManyToOne(() => ExamQuestion, (q) => q.options)
  question: ExamQuestion;
}
