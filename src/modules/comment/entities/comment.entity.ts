import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Import model User
import { CommentsOnBlogs } from '../../comment-on-blog/entities/commentOnBlog.entity'; // Import model CommentsOnBlogs

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  parentId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createAt: Date;

  @Column({ type: 'varchar' })
  authorId: string;

  @ManyToOne(() => User, user => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => CommentsOnBlogs, commentsOnBlogs => commentsOnBlogs.comment)
  blogs: CommentsOnBlogs[];
}
