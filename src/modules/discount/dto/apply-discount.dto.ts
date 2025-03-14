import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber } from "class-validator";

export class ApplyDiscountDto {
  @ApiProperty({ example: "SALE50", description: "Mã giảm giá" })
  @IsString()
  discountCode: string;

  @ApiProperty({ example: 1000000, description: "Tổng giá trị đơn hàng trước giảm giá" })
  @IsNumber()
  totalPrice: number;
}
