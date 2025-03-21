import { IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, description: "Số lượng mới của sản phẩm", minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
