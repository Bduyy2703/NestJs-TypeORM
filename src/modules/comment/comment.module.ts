import { Module } from '@nestjs/common';
import { CommentsService } from './comment.service';
import { CommentsController } from './comment.controller';
import { BlogsModule } from '../blogs/blog.module';
import { BlogsService } from '../blogs/blog.service';
import { UsersModule } from '../users/user.module';
import { UsersService } from '../users/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from '../blogs/entities/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog, Comment]), BlogsModule , UsersModule],
  controllers: [CommentsController],
  providers: [CommentsService, BlogsService , UsersService],
  exports: [CommentsService],
})
export class CommentsModule {}
