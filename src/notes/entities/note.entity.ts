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
import { NoteContent } from './note-content.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  tema: string;

  @Column({ nullable: true })
  area: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'publico' })
  acceso: string;

  @Column({ nullable: true })
  levelOfDetail?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @Index()
  userId: number;

  @OneToMany(() => NoteContent, (noteContent) => noteContent.note, {
    cascade: true,
  })
  noteContents: NoteContent[];

  @ManyToOne(() => User, (user) => user.notes)
  user: User;
}
