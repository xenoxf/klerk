import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Card } from './card.entity';

@Entity('flash_cards')
export class FlashCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', default: '' })
  front: string;

  @Column({ type: 'text', default: '' })
  back: string;

  @Column({ nullable: true })
  hint?: string;

  @ManyToOne(() => Card, (card) => card.flashcards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardId' })
  card: Card;

  @Column()
  userId: number;
}
