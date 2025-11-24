import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { NoteContent } from './note-content.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tittle: string;

  //@Column('text')
  //content: string;

  @Column({ default: 'breve'})
  levelOfDetail: string;

  //@Column({ type: 'datetime', nullable: true })
  //reviewDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.notes)
  user: User;

  @OneToMany(() => NoteContent, (note) => note.note)
  noteContents: NoteContent[];
}
