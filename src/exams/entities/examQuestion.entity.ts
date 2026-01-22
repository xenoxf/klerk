import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ExamOption } from "./exam-option.entity";
import { Exam } from "./exam.entity";

@Entity('exam_questions')
export class ExamQuestion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    question: string;

    @Column({ type: 'text', nullable: true })
    explanation?: string;

    @ManyToOne(() => Exam, (exam) => exam.questions, { onDelete: 'CASCADE' })
    exam: Exam;

    @OneToMany(() => ExamOption, (option) => option.question, { cascade: true, onDelete: 'CASCADE' })
    options: ExamOption[];
}