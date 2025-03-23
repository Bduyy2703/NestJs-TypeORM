import { IsInt } from "class-validator";

export class DeleteSaleDto {
  @IsInt()
  id: number;
}
