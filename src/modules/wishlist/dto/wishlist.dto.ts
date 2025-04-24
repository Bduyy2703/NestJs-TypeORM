import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateWishlistDto {
    @ApiProperty({
      description: 'Id của biến thể sản phẩm',
      example: 1,
    })
  @IsNumber()
  productDetailId: number;
}