import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Import model User

@Entity()
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  title: string;  

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @Column({ type: 'varchar' })
  authorId: string;

  @ManyToOne(() => User, user => user.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

}
