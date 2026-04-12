import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  Index,
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
  tema: string;

  @Column({ nullable: true })
  area: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'publico' })
  acceso: string;

  @Column({ nullable: true })
  code: string;

  @Column({ default: 0 })
  totalQuestions: number;

  @Column({ nullable: true })
  difficulty?: string;

  @Column({ nullable: true })
  score?: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  @Index()
  userId?: number;

  @ManyToOne(() => User, (user) => user.exams)
  user: User;

  @OneToMany(() => ExamQuestion, (eq) => eq.exam)
  questions: ExamQuestion[];
}
