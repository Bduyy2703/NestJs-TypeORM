import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { BlogsService } from '../blogs/blog.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Blog } from '../blogs/entities/blog.entity';
import { User } from '../users/entities/user.entity';
import { Comment } from './entities/comment.entity';
import { CommentsOnBlogs } from '../comment-on-blog/entities/commentOnBlog.entity';
@Injectable()
export class CommentsService {
  constructor(
    @Inject(forwardRef(() => BlogsService)) private blogsService: BlogsService,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,

    @InjectRepository(CommentsOnBlogs)
    private readonly commentsOnBlogsRepository: Repository<CommentsOnBlogs>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async findAllCommentsOfBlog(blogId: number): Promise<Comment[]> {
    const blog = await this.blogRepository.findOne({ where: { id: blogId } });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    const comments = await this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin('comment.blogs', 'commentsOnBlogs')
      .innerJoin('commentsOnBlogs.blog', 'blog')
      .where('blog.id = :blogId', { blogId })
      .getMany();

    return comments;
  }

  async findAllCommentsOfUser(userId: string): Promise<Comment[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const comments = await this.commentRepository.find({
      where: { authorId: userId },
      relations: ['author'],
    });

    return comments;
  }

  async create(createCommentDto: CreateCommentDto): Promise<any> {

    const { content, authorId, id: blogId } = createCommentDto;

    const comment = this.commentRepository.create({
      content,
      authorId,
      parentId: null,
    });

    const savedComment = await this.commentRepository.save(comment);

    const commentOnBlog = this.commentsOnBlogsRepository.create({
      blogId,
      commentId: savedComment.id,
    });

    const savedCommentOnBlog = await this.commentsOnBlogsRepository.save(
      commentOnBlog,
    );

    return {
      commentId: savedComment.id,
      content: savedComment.content,
      blogId: savedCommentOnBlog.blogId,
    };
  }


  async reply(parentId: number, authorId: string, content: string): Promise<Comment> {
    if (!parentId) {
      throw new BadRequestException('Cannot comment without a parent comment');
    }
    const parentComment = await this.commentRepository.findOne({
      where: { id: parentId },
    });

    if (!parentComment) {
      throw new BadRequestException('Parent comment not found');
    }

    const newComment = this.commentRepository.create({
      parentId,
      content,
      authorId,
    });

    return await this.commentRepository.save(newComment);
  }


  async deleteCommentsNotBelongToBlog() {
    const commentsOnBlogs = await this.commentsOnBlogsRepository.find({
      select: ['commentId'],
    });
    const commentIds = commentsOnBlogs.map((cmt) => cmt.commentId);

    await this.commentRepository.delete({
      id: Not(In(commentIds)), // Sử dụng Not và In từ TypeORM
    });

  }

  async delete(userId: string, id: number): Promise<{ message: string; statusCode: number }> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id, authorId: userId },
      });
      if (!comment) {
        throw new BadRequestException("Comment not found or you don't have permission to delete it.");
      }

      // Xóa comment
      await this.commentRepository.delete({ id });
      return {
        message: 'Comment deleted!',
        statusCode: HttpStatus.OK,
      };
    } catch (err) {
      console.log('Lỗi nè baaaaaa',err);
      throw new BadGatewayException("Can't delete this comment");
    }
  }
}
