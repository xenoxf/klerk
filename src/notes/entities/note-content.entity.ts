import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Note } from "./note.entity";

@Entity()
export class NoteContent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', nullable: true})
    title: string;

    @Column({type: 'text'})
    content: string;

    @Column({type: 'varchar', default: 'text'})
    type: string;

    @Column({type: 'int', nullable: true})
    order: number;

    @Column()
    noteId: number;

    @Column({ nullable: true })
    userId: number;

    @ManyToOne(() => Note, (note) => note.noteContents)
    note: Note;
}