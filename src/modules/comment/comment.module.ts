import { forwardRef, Module } from '@nestjs/common';
import { CommentsService } from './comment.service';
import { CommentsController } from './comment.controller';
import { BlogsModule } from '../blogs/blog.module';
import { BlogsService } from '../blogs/blog.service';
import { UsersModule } from '../users/user.module';
import { UsersService } from '../users/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from '../blogs/entities/blog.entity';
import {Comment} from './entities/comment.entity'
import { CommentsOnBlogs } from '../comment-on-blog/entities/commentOnBlog.entity';
import { User } from '../users/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Blog, Comment , CommentsOnBlogs , User]), BlogsModule , forwardRef(() => UsersModule)],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
