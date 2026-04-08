import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Chat } from './chat.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  response: string;

  @Column()
  prompt: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ nullable: true })
  @Index()
  userId?: number;

  @Column({ nullable: true })
  @Index()
  chatId?: number;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  chat: Chat;
}
