import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, ValidateNested, Min, Max, IsInt } from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "Nhẫn Vàng 18K", description: "Tên sản phẩm" })
  @IsString()
  name: string;

  @ApiProperty({ example: 1000000, description: "Giá gốc" })
  originalPrice: number;

  @ApiProperty({ example: 1, description: "ID danh mục", required: false })
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ example: 1, description: "ID chiến lược giảm giá", required: false })
  @IsOptional()
  strategySaleId?: number;

}
