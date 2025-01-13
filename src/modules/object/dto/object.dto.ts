import { IsString, IsOptional, IsBoolean, IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ObjectDto {
  @ApiProperty({
    example: 1,
    description: "Khóa chính của đối tượng",
    required: true,
  })
  @Expose()
  @IsInt({ message: "ID phải là một số nguyên" })
  id: number;

  @ApiProperty({
    description: "Mã đối tượng",
    example: "OBJ001",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "code phải là một chuỗi" })
  code: string;

  @ApiProperty({
    description: "Tên đối tượng",
    example: "Object Name",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "name phải là một chuỗi" })
  name: string;

  @IsOptional()
  @Expose()
  createdDate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người tạo đối tượng",
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
