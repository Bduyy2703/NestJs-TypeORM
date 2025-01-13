import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean } from "class-validator";
import { Expose } from "class-transformer";

export class UpdateRoleDto {
  @ApiProperty({
    example: "Adm",
    description: "Tên của vai trò",
    required: false,
  })
  @IsOptional()
  @Expose()
  @IsString({ message: "name phải là một chuỗi" })
  name?: string;

  @ApiProperty({
    example: "ADMIN",
    description: "Mã định danh của vai trò",
    required: false,
  })
  @IsOptional()
  @Expose()
  @IsString({ message: "code phải là một chuỗi" })
  code?: string;

  @ApiProperty({
    example: "admin",
    description: "Người cập nhật vai trò lần cuối",
    required: false,
  })
  @IsOptional()
  @Expose()
  @IsString({ message: "updatedby phải là một chuỗi" })
  updatedby?: string;

  @ApiProperty({
    example: true,
    description: "Trạng thái kích hoạt của vai trò",
    required: false,
  })
  @IsOptional()
  @Expose()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isactive?: boolean;

  @IsOptional()
  @Expose()
  updateddate?: Date;
}
