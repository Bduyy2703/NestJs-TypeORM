import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  Delete,
  Put,
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BlogsService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../cores/decorators/public.decorator';
import { Actions } from 'src/cores/decorators/action.decorator';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { MinioService } from '../files/minio/minio.service';
import { FileRepository } from '../files/file.repository';
import { Req } from '@nestjs/common';

@Controller('blogs')
@ApiTags('Blogs')
@ApiSecurity('JWT-auth')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService,
    private readonly minioService: MinioService,
    private readonly fileRepository: FileRepository
  ) { }

  /** 
   * 1 . api đăng bài viết , có thể up load nhiều hình ảnh , khi up thì gọi qua minio service hoặc api minio controller để đăng bài */
  @Post('create')
  @Actions('create')
  @Objectcode('BLOG01')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // Giới hạn file 100MB
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async createBlog(
    @Body() createBlogDto: CreateBlogDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new BadRequestException('Author ID is required');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No images found');
    }

    // Tạo blog mới trong database
    const blog = await this.blogsService.create({
      ...createBlogDto,
    });

    // Upload ảnh lên Minio
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const uuid = uuidv4();
        const objectName = `blog-${blog.id}/${uuid}-${file.originalname}`;

        await this.minioService.uploadFileFromBuffer(
          'public',
          objectName,
          file.buffer,
          file.mimetype,
        );

        const fileUrl = await this.minioService.getUrlByName('public', [objectName]);

        // Lưu vào bảng files
        return this.fileRepository.createFile({
          fileId: uuid,
          bucketName: 'public',
          fileName: objectName,
          fileUrl: fileUrl[0],
          targetId: blog.id,
          targetType: 'blog',
        });
      })
    );

    return {
      message: 'Blog created successfully',
      blog,
      images: uploadResults,
    };
  }


  /*
   * 2. lấy 1 bài viết ra thì phải lấy tất cả các ảnh mà bài viết đó có 
   */
  @Get(':id')
  @Public()
  async getBlog(@Param('id') id: number) {
    const blog = await this.blogsService.findById(id);
    if (!blog) {
      throw new BadRequestException('Blog not found');
    }

    const images = await this.fileRepository.findFilesByTarget(id, 'blog');

    return {
      blog,
      images,
    };
  }

  /*
   * 3. lấy tất cả các bài viết thì cũng lấy tất cả các ảnh mà mỗi bài viết có 
   */
  @Get()
  @Public()
  async getAllBlogs() {
    const blogs = await this.blogsService.findAll();

    const blogsWithImages = await Promise.all(
      blogs.map(async (blog) => {
        const images = await this.fileRepository.findFilesByTarget(blog.id, 'blog');
        return { ...blog, images };
      }),
    );

    return {
      blogs: blogsWithImages,
    };
  }

  /*
   * 4. cập nhật chỉnh sửa bài viết hay là hình ảnh trên bài viết thì gọi lại upload minio như thế nào (phần này chưa hiểu lắm)
   */
  @Put('update/:id')
  @Actions('update')
  @Objectcode('BLOG01')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn file 10MB
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        keepFiles: { // Danh sách file giữ lại với đủ thông tin
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileId: { type: 'string' },
              fileName: { type: 'string' },
              bucketName: { type: 'string' },
            },
            required: ['fileId', 'fileName', 'bucketName']
          }
        },
        files: { // Upload file mới
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async updateBlog(
    @Param('id') id: number,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('keepFiles') keepFiles: { fileId: string; fileName: string; bucketName: string }[],
  ) {
    const blog = await this.blogsService.findById(id);
    if (!blog) {
      throw new BadRequestException('Blog not found');
    }

    await this.blogsService.update(id, updateBlogDto);

    const oldImages = await this.fileRepository.findFilesByTarget(id, 'blog');
    if (keepFiles) {
      if (typeof keepFiles === 'string') {
        try {
          keepFiles = JSON.parse(keepFiles);
        } catch (error) {
          throw new BadRequestException('Invalid keepFiles format');
        }
      }
    
      // Nếu chỉ có một object, chuyển thành mảng
      if (!Array.isArray(keepFiles)) {
        keepFiles = [keepFiles];
      }
    } else {
      keepFiles = []; 
    }
    const keepFilesSet = new Set(keepFiles.map(file => file.fileId));

    const removedImages = oldImages.filter(img => !keepFilesSet.has(img.fileId));

    for (const image of removedImages) {
      await this.minioService.deleteFile(image.bucketName, image.fileName);
      await this.fileRepository.Delete(image.fileId);
    }

    const newUploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const uuid = uuidv4();
        const objectName = `blog-${id}/${uuid}-${file.originalname}`;

        await this.minioService.uploadFileFromBuffer(
          'public',
          objectName,
          file.buffer,
          file.mimetype,
        );

        const fileUrl = await this.minioService.getUrlByName('public', [objectName]);

        const fileData = await this.fileRepository.createFile({
          fileId: uuid,
          bucketName: 'public',
          fileName: objectName,
          fileUrl: fileUrl[0],
          targetId: id,
          targetType: 'blog',
        });

        newUploadedFiles.push(fileData.fileUrl);
      }
    }
    return {
      message: 'Blog updated successfully',
      updatedImages: [...keepFiles.map(f => f.fileName), ...newUploadedFiles], 
    };
  }

  /*
   * 5. xóa bài viết thì xóa cả phần hình ảnh của bài viết đó trên minio 
   */
  @Delete('delete/:id')
  @Actions('delete')
  @Objectcode('BLOG01')
  async deleteBlog(@Param('id') id: number) {
    const blog = await this.blogsService.findById(id);
    if (!blog) {
      throw new BadRequestException('Blog not found');
    }

    // Xóa ảnh trên Minio
    const images = await this.fileRepository.findFilesByTarget(id, 'blog');
    for (const image of images) {
      await this.minioService.deleteFile(image.bucketName, image.fileName);
      await this.fileRepository.Delete(image.fileId);
    }

    // Xóa bài viết
    await this.blogsService.delete(id);

    return { message: 'Blog deleted successfully' };
  }


}
