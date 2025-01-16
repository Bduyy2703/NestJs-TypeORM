
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBlogDto {
    @ApiProperty({
        description: 'Tiêu đề của bài viết',
        example: 'Cách học lập trình hiệu quả',
      })
      @IsNotEmpty()
      title: string;
    
      @ApiProperty({
        description: 'Nội dung chi tiết của bài viết',
        example: 'Bài viết này chia sẻ các phương pháp học lập trình một cách hiệu quả...',
      })
      @IsNotEmpty()
      content: string;
}
