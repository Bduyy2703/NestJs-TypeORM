import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateInventoryDto {
  @ApiProperty({ example: "Kho Hà Nội", description: "Tên kho" })
  @IsString()
  @Length(3, 255)
  warehouseName: string;

  @ApiProperty({ example: "Số 1, Đường ABC, Hà Nội", description: "Địa chỉ kho" })
  @IsString()
  @Length(5, 255)
  location: string;
}
