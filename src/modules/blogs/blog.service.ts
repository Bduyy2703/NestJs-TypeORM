import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Blog } from '.prisma/client';
import { Status as StatusPrisma } from '@prisma/client';
import { StatusEnum } from 'src/common/enums/blog-status.enum';
import { CommentsService } from '../comment/comment.service';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role } from 'src/common/enums/env.enum';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    @Inject(forwardRef(() => CommentsService))
    private commentService: CommentsService,
    private prismaService: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

  async findById(blogId: number) {
    return await this.prismaService.blog.findFirst({ where: { id: blogId } });
  }

  async allCommentsOfBlog(id: number) {
    const blogComments = await this.prismaService.blog.findUnique({
      where: { id },
      include: {
        comments: {
          select: {
            comment: {
              select: {
                content: true,
                createAt: true,
                author: {
                  select: { username: true, id: true },
                },
              },
            },
          },
        },
      },
    });

    const refactorComments = blogComments.comments.map((comment) => {
      return {
        ...comment.comment,
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
    const blog = await this.prismaService.blog.create({
      data: { ...createBlogDto, authorId: userId },
    });

    if (!blog) {
      throw new BadRequestException('Can not create blog');
    }

    return blog;
  }

  async commentOnBlog(createCommentDto: CreateCommentDto) {
    if (!createCommentDto.id) {
      throw new NotFoundException('Blog not found');
    }
    console.log("ABC")
    const comment = await this.commentService.create(createCommentDto);
    console.log("ABDDC")
    if (!comment) throw new BadRequestException('Can not on this blog');

    this.eventEmitter.emit('comment', {
      authorComment: createCommentDto.authorId,
      content: createCommentDto.content,
      blogId: createCommentDto.id,
      authorBlog: (await this.findById(createCommentDto.id)).authorId,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Commented',
    };
  }

  async findAllByStatus(status: StatusEnum): Promise<Blog[]> {
    if (status == StatusEnum.ALL) {
      return await this.prismaService.blog.findMany();
    }

    return await this.prismaService.blog.findMany({
      where: {
        status,
      },
    });
  }
  async findAllByUserId(userId: string) {
    // Logic để lấy tất cả bài viết theo ID user
    return this.prismaService.blog.findMany({
      where: { authorId: userId },
    });
  }

  async findApprovedBlogs(): Promise<any[]> {
    const blogs = await this.prismaService.blog.findMany({
      select: {
        title: true,
        content: true,
        createAt: true,
        author: {
          select: {
            username: true,
          },
        },
        comments: {
          select: {
            comment: {
              select: {
                author: {
                  select: {
                    username: true,
                  },
                },
                createAt: true,
                content: true,
              },
            },
          },
        },
      },
      where: { status: StatusEnum.APPROVED },
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
        ...blog,
        comments: cmts,
      };
    });
  }

  async blogActions(blogId: number, action: StatusPrisma) {
    const blog = await this.prismaService.blog.update({
      where: { id: blogId },
      data: {
        status: action,
      },
    });

    if (!blog) {
      throw new BadRequestException("Can't approve blog");
    }

    return {
      message: 'Approved !',
      statusCode: HttpStatus.OK,
    };
  }

  async requestDelete(blogId: number, userId: string) {
    return await this.prismaService.blog.update({
      where: {
        id: blogId,
        authorId: userId,
      },
      data: {
        status: StatusPrisma.PENDING_DELETION,
      },
    });
  }

  async delete(blogId: number) {
    try {
      const blog = await this.prismaService.blog.delete({
        where: {
          id: blogId,
          status: StatusPrisma.PENDING_DELETION,
        },
      });

      if (!blog) {
        throw new BadRequestException('Blog is not in pending deletion');
      }

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
    const blog = await this.prismaService.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // 2. Kiểm tra quyền truy cập
    if (role !== Role.ADMIN && blog.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this blog',
      );
    }

    // 3. Cập nhật bài viết với trạng thái mặc định
    const updatedBlog = await this.prismaService.blog.update({
      where: { id: blogId },
      data: {
        ...data,
        status: "PENDING_APPROVAL", // Trạng thái mặc định
      },
    });

    return {
      message: 'Blog successfully updated',
      updatedBlog,
    };
  }

}
