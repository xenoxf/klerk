import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Exam } from '../../exams/entities/exam.entity';

@Entity('exam_attempts')
export class ExamAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  examId: number;

  @Column()
  correctAnswers: number;

  @Column()
  totalQuestions: number;

  @Column()
  examTitle: string;

  @CreateDateColumn()
  attemptedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  exam: Exam;
}
