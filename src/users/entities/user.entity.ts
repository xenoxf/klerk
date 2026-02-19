import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Note } from '../../notes/entities/note.entity';
import { Exam } from '../../exams/entities/exam.entity';
import { Chat } from '../../messages/entities/chat.entity';
import { Card } from '../../flash-cards/entities/card.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // 👉 CAMBIO CLAVE AQUÍ (para evitar tu error)
  @Column({ nullable: true, unique: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken?: string;

  // 👉 provider por defecto
  @Column({ default: 'local' })
  provider: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  providerId: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ default: false })
  pendingDeletion: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletionDate: Date;

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];

  @OneToMany(() => Card, (card) => card.user)
  cards: Card[];

  @OneToMany(() => Exam, (exam) => exam.user)
  exams: Exam[];

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];
}
