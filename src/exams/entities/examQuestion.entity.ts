import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ExamOption } from "./exam-option.entity";
import { Exam } from "./exam.entity";

// q a @

@Entity()
export class ExamQuestion {
    @PrimaryGeneratedColumn()
    id:  number;

    @Column({type: 'text'})
    question: string;

    @ManyToOne(() => Exam, (exam) => exam.questions)
    exam: Exam;

    @OneToMany(() => ExamOption, (option) => option.question, { cascade: true })
    options: ExamOption[];
}