import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { FlashCard } from './flash-card.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 })
  totalCards: number;

  @Column({ default: 0 })
  reviewedCards: number;

  @Column({ nullable: true })
  lastReviewDate?: Date;

  @CreateDateColumn()
  createdAt: Date;


  @Column({ nullable: true })
  userId?: number;

  @OneToMany(() => FlashCard, (cards) => cards.card)
  flashcards: FlashCard[];

  @ManyToOne(() => User, (user) => user.cards)
  user: User;
}
