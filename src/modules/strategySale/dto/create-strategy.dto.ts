import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsNumber, IsInt, IsOptional, IsString, Min, ArrayNotEmpty } from "class-validator";

export class CreateSaleDto {
  @ApiProperty({ description: "Tên chương trình giảm giá", example: "Khuyến mãi mùa hè" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Phần trăm giảm giá (nếu có)", example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: "Số tiền giảm giá (nếu có)", example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: "Ngày bắt đầu chương trình giảm giá", example: "2024-03-25T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({ description: "Ngày kết thúc chương trình giảm giá", example: "2024-04-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({ description: "Giảm giá toàn hệ thống hay không", example: true })
  @IsBoolean()
  isGlobalSale: boolean;

  @ApiPropertyOptional({
    description: "Danh sách ID danh mục áp dụng (chỉ khi `isGlobalSale = false`)",
    example: [1, 2, 3]
  })
  @IsOptional()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  categories?: number[];

  @ApiPropertyOptional({
    description: "Danh sách ID sản phẩm áp dụng (chỉ khi `isGlobalSale = false`)",
    example: [10, 20, 30]
  })
  @IsOptional()
  @IsInt({ each: true })
  @ArrayNotEmpty()
  products?: number[];
}