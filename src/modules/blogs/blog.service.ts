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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
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
  async findAllByUserId(userId: string) {
    // Logic để lấy tất cả bài viết theo ID user
    return this.blogRepository.find({
      where: { authorId: userId },
    });
  }

  async delete(blogId: number) {
    try {
      const blog = await this.blogRepository.findOne({
        where: { id: blogId},
      });

      if (!blog) {
        throw new BadRequestException('Blog is not in pending deletion');
      }
      // Delete the blog
      await this.blogRepository.delete(blogId);

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
    data: UpdateBlogDto,
  ) {
    // 1. Kiểm tra bài viết có tồn tại
    const blog = await this.blogRepository.findOne({ where: { id: blogId } });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    try {
      const updatedBlog = await this.blogRepository.save({
        ...blog,
        ...data, // Trạng thái mặc định
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
