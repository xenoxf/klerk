import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chat } from './chat.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numberMessageOfChat: number;

  @Column()
  mensaje: string;

  @Column()
  response: string;

  @CreateDateColumn()
  fechaDeEnvioUser: Date;

  @CreateDateColumn()
  fechaDeEnvioBot: Date;

  @Column()
  userId: number;

  @Column()
  chatId: number;

  @ManyToOne(() => User, (user) => user.messages)
  user: User;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;
}
