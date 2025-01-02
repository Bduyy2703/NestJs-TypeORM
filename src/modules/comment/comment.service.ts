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
  import { PrismaService } from 'prisma/prisma.service';
  import { BlogsService } from '../blogs/blog.service';
  
  @Injectable()
  export class CommentsService {
    constructor(
      @Inject(forwardRef(() => BlogsService)) private blogsService: BlogsService,
      private prismaService: PrismaService,
    ) {}
  
    async findAllCommentsOfBlog(blogId: number) {
      return await this.prismaService.comment.findMany({
        where: { blogs: { some: { blogId: blogId } } },
      });
    }
  
    async findAllCommentsOfUser(userId: string) {
      return await this.prismaService.comment.findMany({
        where: { author: { id: userId } },
      });
    }
  
    async create(createCommentDto: CreateCommentDto): Promise<any> {
      const userComment = this.prismaService.comment.create({
        data: {
          content: createCommentDto.content,
          authorId: createCommentDto.authorId,
          parentId: null,
          
        },
      });
  
      const commentOnBlog = this.prismaService.commentsOnBlogs.create({
        data: {
          blogId: createCommentDto.id,
          commentId: (await userComment).id,
        },
      });
  
      const transaction = await this.prismaService.$transaction([
        userComment,
        commentOnBlog,
      ]);
  
      return {
        commentId: transaction[0].id,
        content: transaction[0].content,
        blogId: transaction[1].blogId,
      };
    }
  
    async reply(parentId: number, authorId: string) {
      if (!parentId) {
        throw new BadRequestException('Can not comment');
      }
  
      return this.prismaService.comment.create({
        data: {
          parentId,
          content: '123',
          authorId: authorId,
        },
      });
    }
  
    async deleteCommentsNotBelongToBlog() {
      const comments = await this.prismaService.commentsOnBlogs.findMany({
        select: { commentId: true },
      });
  
      const deleteCmt = comments.map((cmt) => {
        return {
          id: cmt.commentId,
        };
      });
  
      await this.prismaService.comment.deleteMany({
        where: { NOT: [...deleteCmt] },
      });
    }
  
    async delete(userId: string, id: number) {
      try {
        await this.prismaService.comment.delete({
          where: { id, authorId: userId },
        });
      } catch (err) {
        console.log(err);
        throw new BadGatewayException("Can't delete this comment");
      }
  
      return {
        message: 'Comment deleted !',
        statusCode: HttpStatus.OK,
      };
    }
  }
  