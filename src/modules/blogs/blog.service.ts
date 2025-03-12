import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async create(createBlogDto: CreateBlogDto): Promise<Blog> {
    const blog = this.blogRepository.create(createBlogDto);
    return await this.blogRepository.save(blog);
  }

  async findById(id: number): Promise<Blog> {
    const blog = await this.blogRepository.findOne({ where: { id } });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  async findAll(): Promise<Blog[]> {
    return await this.blogRepository.find();
  }

  async update(id: number, updateBlogDto: UpdateBlogDto): Promise<void> {
    const blog = await this.findById(id);
    Object.assign(blog, updateBlogDto);
    await this.blogRepository.save(blog);
  }

  async delete(id: number): Promise<void> {
    const blog = await this.findById(id);
    await this.blogRepository.remove(blog);
  }
}
