import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Import model User
import { CommentsOnBlogs } from '../../comment-on-blog/entities/commentOnBlog.entity'; // Import model CommentsOnBlogs
import { StatusEnum } from '../../../common/enums/blog-status.enum'; // Enum Status

@Entity()
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.PENDING_APPROVAL })
  status: StatusEnum;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @Column({ type: 'varchar' })
  authorId: string;

  @ManyToOne(() => User, user => user.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => CommentsOnBlogs, commentsOnBlogs => commentsOnBlogs.blog)
  comments: CommentsOnBlogs[];
}
