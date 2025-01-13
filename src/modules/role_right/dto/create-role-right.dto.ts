import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { RoleDto } from "src/modules/role/dto/role.dto";
import { RightDto } from "src/modules/right/dto/right.dto";

export class CreateRoleRightDto {
  @ApiProperty({
    example: 2,
    description: "ID của vai trò liên kết với quyền",
    required: true,
  })
  @Expose()
  @IsInt({ message: "roleid phải là một số nguyên" })
  roleId: number;

  @ApiProperty({
    example: 3,
    description: "ID của quyền liên kết với vai trò",
    required: true,
  })
  @Expose()
  @IsInt({ message: "rightid phải là một số nguyên" })
  rightId: number;

  // @ApiProperty({
  //   description: "Thông tin vai trò của mối quan hệ này",
  //   type: RoleDto,
  //   required: false,
  // })
  // @Expose()
  // role?: RoleDto;

  // @ApiProperty({
  //   description: "Thông tin quyền của mối quan hệ này",
  //   type: RightDto,
  //   required: false,
  // })
  // @Expose()
  // right?: RightDto;

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
  createDdate: Date;
}
