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
}
