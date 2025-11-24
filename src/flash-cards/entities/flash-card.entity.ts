import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity()
export class Flashcard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({ nullable: true })
  hint: string;

  @Column()
  difficulty: number;

  @Column('simple-array')
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  reviewDate: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column()
  numCard: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.flashcards)
  user: User;
}
