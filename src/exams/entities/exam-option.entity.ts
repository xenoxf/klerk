import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ExamQuestion } from '../../exams/entities/examQuestion.entity';

@Entity('exam_option')
export class ExamOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @ManyToOne(() => ExamQuestion, (q) => q.options, {
    onDelete: 'CASCADE', // 🔥 BORRAS QUESTION → BORRA OPTIONS
  })
  question: ExamQuestion;
}
