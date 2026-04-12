import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  Index,
} from 'typeorm';
import { FlashCard } from './flash-card.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  code: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  @Index()
  userId?: number;

  @OneToMany(() => FlashCard, (cards) => cards.card)
  flashcards: FlashCard[];

  @ManyToOne(() => User, (user) => user.cards)
  user: User;
}
