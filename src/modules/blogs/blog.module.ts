import { Module } from '@nestjs/common';
import { BlogsService } from './blog.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { User } from '../users/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Blog, User])],
  controllers: [BlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule { }
