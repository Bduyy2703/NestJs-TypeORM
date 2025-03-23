import { IsNumber } from "class-validator";

export class AddSaleProductDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  discountPercentage: number;
}
