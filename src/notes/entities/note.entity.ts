import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { NoteContent } from './note-content.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  content?: string;

  @Column({ nullable: true })
  color?: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ nullable: true })
  levelOfDetail?: 'breve' | 'medio' | 'alto';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: number;

  @OneToMany(() => NoteContent, (noteContent) => noteContent.note, { cascade: true })
  noteContents: NoteContent[];

  @ManyToOne(() => User, (user) => user.notes)
  user: User;
}
