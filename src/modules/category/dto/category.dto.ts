import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Điện tử', description: 'Tên danh mục' })
  name: string;

  @ApiProperty({ example: 'dien-tu', description: 'Slug của danh mục (URL thân thiện)' })
  slug: string;

  @ApiPropertyOptional({ example: 1, description: 'ID của danh mục cha (nếu có)' })
  parentId?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Công nghệ', description: 'Tên danh mục mới' })
  name?: string;

  @ApiPropertyOptional({ example: 'cong-nghe', description: 'Slug mới' })
  slug?: string;

  @ApiPropertyOptional({ example: 2, description: 'ID của danh mục cha mới (nếu cần thay đổi)' })
  parentId?: number;
}
