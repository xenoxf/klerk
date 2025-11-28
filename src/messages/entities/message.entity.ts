import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, ManyToOne } from 'typeorm';
import { Chat } from './chat.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  response: string;

  @Column()
  prompt:string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  userId?: number;

  @Column({ nullable: true })
  chatId?: number;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;
}
