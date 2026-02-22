import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Note } from "./note.entity";

@Entity('note_contents')
export class NoteContent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', nullable: true })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'int', nullable: true })
    order: number;

    @Column()
    noteId: number;

    @Column({ nullable: true })
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Note, (note) => note.noteContents, { onDelete: 'CASCADE' })
    note: Note;
}
