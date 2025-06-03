// src/modules/product/dto/search-product.dto.ts
import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchProductDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm (tên sản phẩm)',
    example: 'nhẫn bạc',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: 'Danh sách ID danh mục sản phẩm',
    example: [4],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @ApiProperty({
    description: 'Giá tối thiểu của sản phẩm',
    example: 200000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  priceMin?: number;

  @ApiProperty({
    description: 'Giá tối đa của sản phẩm',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  priceMax?: number;

  @ApiProperty({
    description: 'Sắp xếp kết quả: finalPrice.asc, finalPrice.desc, totalSold.desc, name.asc',
    example: 'finalPrice.asc',
    required: false,
    enum: ['finalPrice.asc', 'finalPrice.desc', 'totalSold.desc', 'name.asc'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Số trang (mặc định: 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  page: number = 1;

  @ApiProperty({
    description: 'Số sản phẩm mỗi trang (mặc định: 10)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  limit: number = 10;
}