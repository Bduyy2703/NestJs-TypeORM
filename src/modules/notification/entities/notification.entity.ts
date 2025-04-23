import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  message: string;

  @Column()
  type: string;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ enum: ['ADMIN', 'USER'], default: 'USER' })
  source: 'ADMIN' | 'USER';
}