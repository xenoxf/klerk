import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from 'typeorm';

//import { Perfil } from '../../perfil/entities/perfil.entity';
import { Message } from '../../messages/entities/message.entity';
import { Flashcard } from '../../flash-cards/entities/flash-card.entity';
import { Note } from '../../notes/entities/note.entity';
import { Exam } from 'src/exams/entities/exam.entity';
import { Chat } from 'src/messages/entities/chat.entity';
import { Card } from 'src/flash-cards/entities/card.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({nullable: true})
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  provider: string;

  @Column({ unique: true, nullable: true })
  providerId: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  picture: string;

  @Column({ default: false })
  pendingDeletion: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletionDate: Date;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  //@OneToOne(() => Perfil, (perfil) => perfil.user)
  //perfiles: Perfil;

  @OneToMany(() => Card, (card) => card.user)
  cards: Card[];

  @OneToMany(() => Exam, (exam) => exam.user)
  exams: Exam[];

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];

  //@OneToMany(() => UserIp, (ip) => ip.user)
  //userIps: UserIp[];
}
