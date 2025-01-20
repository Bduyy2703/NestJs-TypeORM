import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { RoleDto } from "src/modules/role/dto/role.dto";
import { RightDto } from "src/modules/right/dto/right.dto";

export class RoleRightDto {
  @ApiProperty({
    example: 1,
    description: "Khóa chính của trạm",
    required: true,
  })
  @Expose()
  @IsInt({ message: "ID phải là một số nguyên" })
  id: number;

  @ApiProperty({
    example: 2,
    description: "ID của vai trò liên kết với quyền",
    required: true,
  })
  @Expose()
  @IsInt({ message: "roleid phải là một số nguyên" })
  roleId: number;

  @ApiPropertyOptional({ type: RoleDto })
  @Expose()
  @Type(() => RoleDto)
  role: RoleDto;

  @ApiProperty({
    example: 3,
    description: "ID của quyền liên kết với vai trò",
    required: true,
  })
  @Expose()
  @IsInt({ message: "rightid phải là một số nguyên" })
  rightId: number;

  @ApiPropertyOptional({ type: RightDto })
  @Expose()
  @Type(() => RightDto)
  right: RightDto;

  @IsOptional()
  @Expose()
  createdDate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người tạo vai trò",
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
    description: "Người cập nhật vai trò lần cuối",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "updatedby phải là một chuỗi" })
  updatedBy: string;

  @ApiProperty({
    example: true,
    description: "Trạng thái kích hoạt của vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isActive: boolean;
}
