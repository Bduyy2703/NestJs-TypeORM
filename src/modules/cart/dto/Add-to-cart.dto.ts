import { IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddToCartDto {
  @ApiProperty({ example: 1, description: "ID của sản phẩm" })
  @IsInt()
  productDetailsId: number;

  @ApiProperty({ example: 2, description: "Số lượng sản phẩm", minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
