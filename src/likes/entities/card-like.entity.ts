import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
@Unique(['userId', 'cardType', 'cardId'])
export class CardLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  cardType: 'exam' | 'card' | 'note';

  @Column()
  cardId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
