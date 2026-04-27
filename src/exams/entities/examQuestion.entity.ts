import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExamOption } from './exam-option.entity';
import { Exam } from './exam.entity';

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ nullable: true })
  contextId?: string;

  @Column({ type: 'text', nullable: true })
  contextContent?: string;

  @ManyToOne(() => Exam, (exam) => exam.questions, {
    onDelete: 'CASCADE', // 🔥 BORRAS EXAM → BORRA QUESTIONS
  })
  exam: Exam;

  @OneToMany(() => ExamOption, (option) => option.question)
  options: ExamOption[];
}
