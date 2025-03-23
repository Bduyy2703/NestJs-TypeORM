import { IsBoolean, IsOptional } from "class-validator";

export class GetSaleDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isGlobalSale?: boolean;
}
