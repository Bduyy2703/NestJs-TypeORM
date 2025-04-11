import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBlogDto {
  @ApiProperty({
    description: 'Tiêu đề của bài viết',
    example: 'Cách học lập trình hiệu quả',
    required: false,
  })
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Mô tả ngắn của bài viết',
    example: 'Bài viết này chia sẻ các phương pháp học lập trình một cách hiệu quả...',
    required: false,
  })
  @IsOptional()
  excerpt?: string;

  @ApiProperty({
    description: 'Nội dung chi tiết của bài viết',
    example: 'Bài viết này chia sẻ các phương pháp học lập trình một cách hiệu quả...',
    required: false,
  })
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'URL hoặc tên file của hình ảnh đại diện (thumbnail)',
    example: 'https://minio-url/blog-1/123-image1.jpg',
    required: false,
  })
  @IsOptional()
  thumbnail?: string; // URL hoặc tên file của hình ảnh đại diện
}