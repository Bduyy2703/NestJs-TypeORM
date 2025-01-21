import { Module } from '@nestjs/common';
import { BlogsService } from './blog.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Comment } from '../comment/entities/comment.entity';
import { CommentsService } from '../comment/comment.service';
import { CommentsOnBlogs } from '../comment-on-blog/entities/commentOnBlog.entity';
import { User } from '../users/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Blog, Comment , CommentsOnBlogs , User])],
  controllers: [BlogsController],
  providers: [BlogsService, CommentsService],
  exports: [BlogsService],
})
export class BlogsModule {}
