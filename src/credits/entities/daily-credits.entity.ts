import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
@Index(['userId', 'date'], { unique: true }) // Único por usuario por día
export class DailyCredits {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Fecha (solo date, sin hora)
  @Column({ type: 'date' })
  date: string;

  // Créditos totales asignados para este día
  @Column({ type: 'int', default: 30 })
  totalCredits: number;

  // Créditos consumidos
  @Column({ type: 'int', default: 0 })
  usedCredits: number;

  // Créditos restantes
  @Column({ type: 'int', default: 30 })
  remainingCredits: number;

  // Desglose de uso
  @Column({ type: 'int', default: 0 })
  examGenerations: number;

  @Column({ type: 'int', default: 0 })
  noteGenerations: number;

  @Column({ type: 'int', default: 0 })
  flashcardGenerations: number;

  @Column({ type: 'int', default: 0 })
  chatMessages: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
