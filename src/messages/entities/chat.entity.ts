import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ nullable: true })
  @Index()
  updatedAt?: Date;

  @Column({ nullable: true })
  @Index()
  userId?: number;

  @ManyToOne(() => User, (user) => user.chats)
  user: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}
