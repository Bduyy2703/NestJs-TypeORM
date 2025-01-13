import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateObjectDto {
  @ApiProperty({
    description: "Tên đối tượng",
    example: "Object",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "name phải là một chuỗi" })
  name?: string;

  @ApiProperty({
    example: "USERS",
    description: "Mã định danh của quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "code phải là một chuỗi" })
  code?: string;

  @IsOptional()
  @Expose()
  updateddate?: Date;

  @ApiProperty({
    example: "admin",
    description: "Người cập nhật đối tượng lần cuối",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "updatedby phải là một chuỗi" })
  updatedby?: string;

  @ApiProperty({
    example: true,
    description: "Trạng thái kích hoạt của quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isactive?: boolean;
}
