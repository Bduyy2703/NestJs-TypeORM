import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBlogDto } from './dto/create-blog.dto';
import { Blog } from '../blogs/entities/blog.entity';
import { StatusEnum } from 'src/common/enums/blog-status.enum';
import { CommentsService } from '../comment/comment.service';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from 'src/common/enums/env.enum';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { throwError } from 'rxjs';

@Injectable()
export class BlogsService {
  constructor(
    @Inject(forwardRef(() => CommentsService))
    private commentService: CommentsService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
  ) { }

  async findById(blogId: number): Promise<Blog> {
    const blog = await this.blogRepository.findOne({
      where: { id: blogId },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }

    return blog;
  }

  async allCommentsOfBlog(id: number) {
    const blogComments = await this.blogRepository.findOne({
      where: { id },
      relations: ['comments', 'comments.author'], // Load comments and their authors
    });

    if (!blogComments) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    const refactorComments = blogComments.comments.map((comment) => {
      return {
        content: comment.comment.content,
        createAt: comment.comment.createAt,
        author: {
          username: comment.comment.author.username,
          id: comment.comment.author.id,
        },
      };
    });

    return {
      ...blogComments,
      comments: refactorComments,
    };
  }

  async requestCreate(
    userId: string,
    createBlogDto: CreateBlogDto,
  ): Promise<Blog> {
    try {
      const blog = this.blogRepository.create({
        ...createBlogDto,
        authorId: userId, // Assuming the Blog entity has an author relation
      });
      const savedBlog = await this.blogRepository.save(blog);
      if (!savedBlog) {
        throw new BadRequestException('Cannot create blog');
      }
      return savedBlog;
    } catch (error) {
      console.log('error nè : ', error)
    }
  }

  async commentOnBlog(createCommentDto: CreateCommentDto) {
    const blog = await this.findById(createCommentDto.id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    try {
      let comment = await this.commentService.create(createCommentDto);
    } catch (error) {
      console.error('Error creating comment:', error.message);
      throw new BadRequestException('Cannot comment on this blog');
    }

    this.eventEmitter.emit('comment', {
      authorComment: createCommentDto.authorId,
      content: createCommentDto.content,
      blogId: createCommentDto.id,
      authorBlog: blog.authorId,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Commented',
    };
  }


  async findAllByStatus(status: StatusEnum): Promise<Blog[]> {
    if (status == StatusEnum.ALL) {
      return await this.blogRepository.find();
    }

    return await this.blogRepository.find({
      where: {
        status,
      },
    });
  }
  async findAllByUserId(userId: string) {
    // Logic để lấy tất cả bài viết theo ID user
    return this.blogRepository.find({
      where: { authorId: userId },
    });
  }

  async findApprovedBlogs(): Promise<any[]> {
    const blogs = await this.blogRepository.find({
      relations: ['author', 'comments', 'comments.author'], // Load related entities
      where: { status: StatusEnum.APPROVED }, // Filter by approved status
      select: {
        id: true,
        title: true,
        content: true,
        createAt: true,
      },
    });

    return blogs.map((blog) => {
      const cmts = blog.comments.map((cmt) => {
        return {
          author: cmt.comment.author.username,
          content: cmt.comment.content,
          createAt: cmt.comment.createAt,
        };
      });

      return {
        id: blog.id,
        title: blog.title,
        content: blog.content,
        createAt: blog.createAt,
        author: blog.author?.username,
        comments: cmts,
      };
    });
  }

  async blogActions(blogId: number, action: StatusEnum) {
    const blog = await this.blogRepository.findOne({ where: { id: blogId } });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    blog.status = action;

    try {
      await this.blogRepository.save(blog);
    } catch (error) {
      throw new BadRequestException("Can't update blog status");
    }

    return {
      message: 'Status updated successfully!',
      statusCode: HttpStatus.OK,
    };
  }


  async requestDelete(blogId: number, userId: string) {
    const blog = await this.blogRepository.findOne({
      where: {
        id: blogId,
        authorId: userId,
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found or you are not the author');
    }

    blog.status = StatusEnum.PENDING_DELETION;

    try {
      await this.blogRepository.save(blog);
    } catch (error) {
      throw new BadRequestException("Couldn't request blog deletion");
    }

    return {
      message: 'Blog deletion requested successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async delete(blogId: number) {
    try {
      const blog = await this.blogRepository.findOne({
        where: { id: blogId, status: StatusEnum.PENDING_DELETION },
      });

      if (!blog) {
        throw new BadRequestException('Blog is not in pending deletion');
      }
      // Delete the blog
      await this.blogRepository.delete(blogId);
      await this.commentService.deleteCommentsNotBelongToBlog();

      return {
        message: 'Delete successful',
        statusCode: HttpStatus.OK,
      };
    } catch (err) {
      console.log(err)
      throw new BadRequestException('Something went wrong when delete');
    }
  }


  async update(
    blogId: number,
    userId: string,
    role: Role,
    data: UpdateBlogDto,
  ) {
    // 1. Kiểm tra bài viết có tồn tại
    const blog = await this.blogRepository.findOne({ where: { id: blogId } });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // 2. Kiểm tra quyền truy cập
    if (role !== Role.ADMIN && blog.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this blog',
      );
    }

    try {
      const updatedBlog = await this.blogRepository.save({
        ...blog,
        ...data,
        status: StatusEnum.PENDING_APPROVAL, // Trạng thái mặc định
      });

      return {
        message: 'Blog successfully updated',
        updatedBlog,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Something went wrong while updating the blog');
    }
  }
}
