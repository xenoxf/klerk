import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('user_ai_config')
export class UserAiConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  @Index()
  userId: number;

  @Column({ type: 'varchar', length: 20, default: 'auto' })
  provider: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  chatModel?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  genModel?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  visionModel?: string;

  @Column({ type: 'varchar', length: 20, default: 'ahorro' })
  mode: string;

  @Column({ default: true })
  fallbackEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  byokProvider?: string;

  @Column({ type: 'text', nullable: true })
  byokEncryptedKey?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
