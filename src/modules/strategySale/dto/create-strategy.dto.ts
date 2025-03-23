import { IsBoolean, IsDateString, IsDecimal, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateSaleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  discountPercent?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  isGlobalSale: boolean;

  @IsOptional()
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsInt({ each: true })
  productIds?: number[];
}
