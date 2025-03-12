import { Module } from '@nestjs/common';
import { BlogsService } from './blog.service';
import { BlogsController } from './blogs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { User } from '../users/entities/user.entity';
import { File } from '../files/file.entity';
import { MinioModule } from '../files/minio/minio.module';
import { FileRepository } from '../files/file.repository';
@Module({
  imports: [TypeOrmModule.forFeature([Blog, File]), MinioModule],
  controllers: [BlogsController],
  providers: [BlogsService,FileRepository],
  exports: [BlogsService],
})
export class BlogsModule { }
