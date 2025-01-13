import { IsString, IsOptional, IsInt, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class RightDto {
  @ApiProperty({
    example: 1,
    description: "Khóa chính của quyền",
    required: true,
  })
  @Expose()
  @IsInt({ message: "ID phải là một số nguyên" })
  id: number;

  @ApiProperty({
    example: "Manage Users",
    description: "Tên của quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "name phải là một chuỗi" })
  name: string;

  @ApiProperty({
    example: "MANAGE_USERS",
    description: "Mã định danh của quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "code phải là một chuỗi" })
  code: string;

  @IsOptional()
  @Expose()
  createdDate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người tạo quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "createdby phải là một chuỗi" })
  createdBy: string;

  @IsOptional()
  @Expose()
  updatedDate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người cập nhật quyền lần cuối",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "updatedby phải là một chuỗi" })
  updatedBy: string;

  @ApiProperty({
    example: true,
    description: "Trạng thái kích hoạt của quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isActive: boolean;
}
