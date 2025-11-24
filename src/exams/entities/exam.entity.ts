import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { ExamQuestion } from './examQuestion.entity';
import { text } from 'stream/consumers';

@Entity()
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: 0 })
  nota: number;

  @Column({ type: 'text' })
  difficulty: string;

  @Column({ default: 1 })
  numberOfQuestions: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: false })
  userId: number;

  @ManyToOne(() => User, (user) => user.exams)
  user: User;

  @OneToMany(() => ExamQuestion, (q) => q.exam, { cascade: true })
  questions: ExamQuestion[];
}
