import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';

import { ExamQuestion } from './examQuestion.entity';
import { User } from '../../users/entities/user.entity';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 })
  totalQuestions: number;

  @Column({ nullable: true })
  score?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  userId?: number;

  @ManyToOne(() => User, (user) => user.exams)
  user: User;

  @OneToMany(() => ExamQuestion, (exam) => exam.exam)
  questions: ExamQuestion[];
}
