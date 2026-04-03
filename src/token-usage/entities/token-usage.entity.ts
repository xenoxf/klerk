import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
@Index(['userId', 'date'], { unique: true }) // Índice único por usuario por día
export class TokenUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Fecha del uso (solo date, sin hora para agrupar por día)
  @Column({ type: 'date' })
  date: string;

  // Tokens usados en peticiones de generación (exams, notes, flashcards)
  @Column({ type: 'int', default: 0 })
  generationTokens: number;

  // Tokens usados en chat
  @Column({ type: 'int', default: 0 })
  chatTokens: number;

  // Total de tokens del día
  @Column({ type: 'int', default: 0 })
  totalTokens: number;

  // Número de peticiones de generación
  @Column({ type: 'int', default: 0 })
  generationRequests: number;

  // Número de peticiones de chat
  @Column({ type: 'int', default: 0 })
  chatRequests: number;

  // Total de peticiones
  @Column({ type: 'int', default: 0 })
  totalRequests: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
