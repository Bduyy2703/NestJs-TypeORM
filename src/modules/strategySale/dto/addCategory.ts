import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class AddSaleCategoryDto {
  @ApiProperty({ description: "ID danh mục cần thêm vào chương trình giảm giá", example: 10 })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;
}
