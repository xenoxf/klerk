import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExamOption } from './exam-option.entity';
import { Exam } from './exam.entity';
import { ExamContext } from './exam-context.entity';

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  context?: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ nullable: true })
  contextGroupId?: number;

  @ManyToOne(() => ExamContext, { onDelete: 'SET NULL', nullable: true })
  contextGroup: ExamContext;

  @ManyToOne(() => Exam, (exam) => exam.questions, { onDelete: 'CASCADE' })
  exam: Exam;

  @OneToMany(() => ExamOption, (option) => option.question, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  options: ExamOption[];
}
