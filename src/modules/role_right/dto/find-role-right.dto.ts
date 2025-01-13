import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsInt, IsString, Min } from "class-validator";

export class FindRoleRightDto {
  @ApiProperty({
    description:
      "Từ khóa tìm kiếm cho tên vai trò, mã quyền hoặc giá trị bản ghi tùy chọn",
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    description: "Chỉ số trang cho phân trang (mặc định là 1)",
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: "Kích thước trang cho phân trang (mặc định là 20)",
    required: false,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  size: number = 20;
}
