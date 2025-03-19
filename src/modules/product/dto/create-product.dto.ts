import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max, IsInt } from "class-validator";
import { Type } from "class-transformer";
import { ProductDetailsDto } from "../../product-details/dto/product-details.dto";

export class CreateProductDto {
  @ApiProperty({ example: "Nhẫn Vàng 18K", description: "Tên sản phẩm" })
  @IsString()
  name: string;

  @ApiProperty({ example: 1000000, description: "Giá gốc" })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0, { message: "Giá gốc không thể nhỏ hơn 0" })
  originalPrice: number;

  @ApiProperty({ example: 1, description: "ID danh mục", required: false })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiProperty({ example: 1, description: "ID chiến lược giảm giá", required: false })
  @IsOptional()
  @IsInt()
  strategySaleId?: number;

  @ApiProperty({ type: [ProductDetailsDto], description: "Danh sách chi tiết sản phẩm", required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDetailsDto)
  productDetails?: ProductDetailsDto[];
}
