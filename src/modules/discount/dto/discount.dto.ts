import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsEnum, IsOptional, IsDate, IsBoolean } from "class-validator";
import { Type, Expose } from "class-transformer";

export class CreateDiscountDto {
  @ApiProperty({ example: "SALE50", description: "Tên mã giảm giá" })

  @Expose()
  name: string;

  @ApiProperty({ example: "Giảm 50k cho đơn từ 500k", description: "Điều kiện áp dụng", required: false })
  @IsOptional()
  @Expose()
  condition?: string;

  @ApiProperty({ example: 50000, description: "Giá trị giảm giá" })
  @IsNumber()
  @Expose()
  discountValue: number;

  @ApiProperty({ example: "FIXED", description: "Loại giảm giá (PERCENTAGE hoặc FIXED)" })
  @IsEnum(["PERCENTAGE", "FIXED"])
  @Expose()
  discountType: "PERCENTAGE" | "FIXED";

  @ApiProperty({ example: 100, description: "Số lượng mã giảm giá" })
  @IsNumber()
  @Expose()
  quantity: number;

  @ApiProperty({ example: "2024-03-10T00:00:00.000Z", description: "Ngày bắt đầu áp dụng", required: false })
  @IsOptional()
  @Type(() => Date) // ✅ Chuyển đổi chuỗi thành Date
  @IsDate()
  @Expose()
  startDate?: Date;

  @ApiProperty({ example: "2024-04-01T00:00:00.000Z", description: "Ngày hết hạn", required: false })
  @IsOptional()
  @Type(() => Date) // ✅ Chuyển đổi chuỗi thành Date
  @IsDate()
  @Expose()
  endDate?: Date;

  @ApiProperty({ example: true, description: "Trạng thái mã giảm giá (Còn hiệu lực hay không)" })
  @IsBoolean()
  @Expose()
  isActive: boolean;
}

export class UpdateDiscountDto extends CreateDiscountDto {}
