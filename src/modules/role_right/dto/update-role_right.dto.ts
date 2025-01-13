import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateRoleRightDto {
  @ApiProperty({
    example: 2,
    description: "ID của vai trò liên kết với quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "roleid phải là một số nguyên" })
  roleid?: number;

  @ApiProperty({
    example: 3,
    description: "ID của quyền liên kết với vai trò",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "rightid phải là một số nguyên" })
  rightid?: number;

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
