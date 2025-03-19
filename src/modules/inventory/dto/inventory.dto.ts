import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { ProductDetailsDto } from "../../product-details/dto/product-details.dto";

export class InventoryDto {
  @ApiProperty({ example: 1, description: "ID của kho" })
  @Expose()
  id: number;

  @ApiProperty({ example: "Kho Hà Nội", description: "Tên kho" })
  @Expose()
  warehouseName: string;

  @ApiProperty({ example: "Hà Nội, Việt Nam", description: "Vị trí của kho" })
  @Expose()
  location: string;

  @ApiProperty({
    type: [ProductDetailsDto],
    description: "Danh sách các biến thể sản phẩm có trong kho",
  })
  @Expose()
  @Type(() => ProductDetailsDto)
  productDetails: ProductDetailsDto[];
}
