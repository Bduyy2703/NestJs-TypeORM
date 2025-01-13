import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CreateRoleDto {
  @ApiProperty({
    example: "Adm",
    description: "Tên của vai trò",
    required: true,
  })
  @Expose()
  @IsString({ message: "name phải là một chuỗi" })
  name: string;

  @ApiProperty({
    example: "ADMIN",
    description: "Mã định danh của vai trò",
    required: true,
  })
  @Expose()
  @IsString({ message: "code phải là một chuỗi" })
  code: string;

  @ApiProperty({
    example: "admin",
    description: "Người tạo vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "createdby phải là một chuỗi" })
  createdBy: string;

  @ApiProperty({
    example: true,
    description: "Trạng thái kích hoạt của vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isActive: boolean;

  @IsOptional()
  @Expose()
  createdAt: Date;
}
