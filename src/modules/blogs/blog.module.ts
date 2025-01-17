import { Module } from '@nestjs/common';
import { BlogsService } from './blog.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Comment } from '../comment/entities/comment.entity';
import { CommentsService } from '../comment/comment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Blog, Comment])],
  controllers: [BlogsController],
  providers: [BlogsService, CommentsService],
  exports: [BlogsService],
})
export class BlogsModule {}
