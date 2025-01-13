import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity'; // Import model Blog
import { Comment } from '../../comment/entities/comment.entity'; // Import model Comment

@Entity()
export class CommentsOnBlogs {
  @PrimaryColumn()
  blogId: number;

  @PrimaryColumn()
  commentId: number;

  @ManyToOne(() => Blog, blog => blog.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @ManyToOne(() => Comment, comment => comment.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;
}
