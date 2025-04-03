import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class ProductDetailsDto {
  @ApiProperty({ example: 101, description: "ID của biến thể sản phẩm" })
  @Expose()
  @IsNumber()
  id: number;

  @ApiProperty({ example: "M", description: "Size của sản phẩm" })
  @Expose()
  @IsString()
  size: string;

  @ApiProperty({ example: "Đỏ", description: "Màu sắc của sản phẩm" })
  @Expose()
  @IsString()
  color: string;

  @ApiProperty({ example: 100, description: "Số lượng sản phẩm còn lại trong kho" })
  @Expose()
  @IsNumber()
  quantity: number; // Đổi từ "stock" thành "quantity" như trong DTO của bạn

  @ApiProperty({ example: 50, description: "Số lượng sản phẩm đã bán" })
  @Expose()
  @IsNumber()
  sold: number;

  @ApiProperty({ example: "Vàng 18K", description: "Chất liệu sản phẩm", required: false })
  @Expose()
  @IsString()
  @IsOptional()
  material?: string;

  @ApiProperty({ example: 45, description: "Chiều dài sản phẩm (cm)", required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  length?: number; // Chuẩn hóa thành số (cm)

  @ApiProperty({ example: 5, description: "Chiều rộng sản phẩm (cm)", required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  width?: number; // Thêm chiều rộng

  @ApiProperty({ example: 2, description: "Chiều cao sản phẩm (cm)", required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  height?: number; // Thêm chiều cao

  @ApiProperty({ example: 20, description: "Trọng lượng sản phẩm (gram)", required: false })
  @Expose()
  @IsNumber()
  @IsOptional()
  weight?: number; // Thêm trọng lượng

  @ApiProperty({ example: "Rửa bằng nước ấm", description: "Hướng dẫn bảo quản", required: false })
  @Expose()
  @IsString()
  @IsOptional()
  care_instructions?: string;

  @ApiProperty({ example: "1.5x8 mm", description: "Kích thước viên đá", required: false })
  @Expose()
  @IsString()
  @IsOptional()
  stone_size?: string;

  @ApiProperty({ example: "CZ", description: "Loại đá quý", required: false })
  @Expose()
  @IsString()
  @IsOptional()
  stone_type?: string;

  @ApiProperty({ example: "Trendy", description: "Phong cách thiết kế", required: false })
  @Expose()
  @IsString()
  @IsOptional()
  design_style?: string;

  @ApiProperty({ example: "Dây chuyền vàng 18K với thiết kế hiện đại", description: "Mô tả chi tiết sản phẩm", required: false })
  @Expose()
  @IsString()
  @IsOptional()
  description?: string;
}