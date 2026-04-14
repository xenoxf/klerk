import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exam } from './exam.entity';
import { ExamQuestion } from './examQuestion.entity';

@Entity('exam_contexts')
export class ExamContext {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string;

  @ManyToOne(() => Exam, (exam) => exam.contexts, { onDelete: 'CASCADE' })
  exam: Exam;

  @OneToMany(() => ExamQuestion, (q) => q.contextGroup)
  questions: ExamQuestion[];
}
