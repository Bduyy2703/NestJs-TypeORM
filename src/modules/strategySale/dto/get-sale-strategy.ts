import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDateString, IsOptional } from "class-validator";

export class GetSaleDto {
  @ApiPropertyOptional({ description: "Giảm giá toàn hệ thống hay không", example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true") // Chuyển từ string => boolean
  isGlobalSale?: boolean;

  @ApiPropertyOptional({ description: "Chương trình đang hoạt động hay không", example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true") // Chuyển từ string => boolean
  isActive?: boolean; 

  @ApiPropertyOptional({ description: "Lọc theo ngày bắt đầu từ", example: "2024-03-25T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: "Lọc theo ngày kết thúc đến", example: "2024-04-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
