import { IsString, IsOptional, IsInt, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class RoleDto {
  @ApiProperty({
    example: 1,
    description: "Khóa chính của vai trò",
    required: true,
  })
  @Expose()
  @IsInt({ message: "ID phải là một số nguyên" })
  id: number;

  @ApiProperty({
    example: "Administrator",
    description: "Tên của vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "name phải là một chuỗi" })
  name: string;

  @ApiProperty({
    example: "ADMIN",
    description: "Mã định danh của vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "code phải là một chuỗi" })
  code: string;

  @IsOptional()
  @Expose()
  createddate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người tạo vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "createdby phải là một chuỗi" })
  createdby: string;

  @IsOptional()
  @Expose()
  updateddate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người cập nhật vai trò lần cuối",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "updatedby phải là một chuỗi" })
  updatedby: string;

  @ApiProperty({
    example: true,
    description: "Trạng thái kích hoạt của vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isactive: boolean;
}
