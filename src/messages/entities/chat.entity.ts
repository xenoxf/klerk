import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt?: Date;

  @Column({ nullable: true })
  userId?: number;

  @ManyToOne(() => User, (user) => user.chats)
  user: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}
