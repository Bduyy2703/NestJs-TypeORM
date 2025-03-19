import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ProductDetailsDto {
  @ApiProperty({ example: 101, description: "ID của biến thể sản phẩm" })
  @Expose()
  id: number;

  @ApiProperty({ example: "M", description: "Size của sản phẩm" })
  @Expose()
  size: string;

  @ApiProperty({ example: "Đỏ", description: "Màu sắc của sản phẩm" })
  @Expose()
  color: string;

  @ApiProperty({ example: 100, description: "Số lượng sản phẩm còn lại trong kho" })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 50, description: "Số lượng sản phẩm đã bán" })
  @Expose()
  sold: number;

  @ApiProperty({ example: "Vàng 18K", description: "Chất liệu sản phẩm", required: false })
  @Expose()
  material?: string;

  @ApiProperty({ example: "40cm + 5cm", description: "Chiều dài sản phẩm", required: false })
  @Expose()
  length?: string;

  @ApiProperty({ example: "Rửa bằng nước ấm", description: "Hướng dẫn bảo quản", required: false })
  @Expose()
  care_instructions?: string;

  @ApiProperty({ example: "1.5x8 mm", description: "Kích thước viên đá", required: false })
  @Expose()
  stone_size?: string;

  @ApiProperty({ example: "CZ", description: "Loại đá quý", required: false })
  @Expose()
  stone_type?: string;

  @ApiProperty({ example: "Trendy", description: "Phong cách thiết kế", required: false })
  @Expose()
  design_style?: string;

  @ApiProperty({ example: "Dây chuyền vàng 18K với thiết kế hiện đại", description: "Mô tả chi tiết sản phẩm", required: false })
  @Expose()
  description?: string;
}
