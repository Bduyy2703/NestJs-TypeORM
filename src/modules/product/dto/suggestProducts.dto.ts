// src/modules/product/dto/suggest-product.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestProductDto {
  @ApiProperty({
    description: 'Từ khóa để gợi ý sản phẩm',
    example: 'nhẫn',
    required: false,
  })
  @IsString()
  @IsOptional()
  keyword?: string;
}