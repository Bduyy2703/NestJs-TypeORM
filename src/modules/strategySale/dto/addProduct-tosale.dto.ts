import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class AddSaleProductDto {
  @ApiProperty({ description: "ID sản phẩm cần thêm vào chương trình giảm giá", example: 10 })
  @IsInt()
  @IsNotEmpty()
  productId: number;
}
