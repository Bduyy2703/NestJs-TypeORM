import { Module } from '@nestjs/common';
import { CommentsService } from './comment.service';
import { CommentsController } from './comment.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { BlogsModule } from '../blogs/blog.module';
import { BlogsService } from '../blogs/blog.service';

@Module({
  imports: [PrismaModule, BlogsModule],
  controllers: [CommentsController],
  providers: [CommentsService, BlogsService],
  exports: [CommentsService],
})
export class CommentsModule {}
