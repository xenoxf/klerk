import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

import { Card } from './card.entity';

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

  @Column({ type: 'text' })
  difficulty: string;

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
  cardId: number;

  @ManyToOne(() => Card, (card) => card.flashcards, { onDelete: 'CASCADE' })
  card: Card;
}
