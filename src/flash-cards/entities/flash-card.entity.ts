import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Card } from './card.entity';

@Entity('flash_cards')
export class FlashCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column()
  answer: string;

  @Column({ nullable: true })
  hint?: string;

  @Column({ default: 'medium' })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  reviewDate?: Date;

  @Column()
  cardId: number;

  @Column({ nullable: true })
  userId?: number;

  @ManyToOne(() => Card, (card) => card.flashcards)
  card?: Card;
}
