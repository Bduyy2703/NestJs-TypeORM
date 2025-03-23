import { IsNumber } from "class-validator";

export class AddSaleCategoryDto {
  @IsNumber()
  categoryId: number;

  @IsNumber()
  discountPercentage: number;
}
