import { User } from 'src/users/entities/user.entity';
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

  @Column({ nullable: true })
  userId?: number;

  @OneToMany(() => NoteContent, (note) => note.note)
  noteContents?: NoteContent[];
  @ManyToOne(() => User, (user) => user.notes)
  user: User;
}
