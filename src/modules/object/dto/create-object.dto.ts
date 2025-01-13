import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CreateObjectDto {
  @ApiProperty({
    description: "Tên đối tượng",
    example: "Object",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "name phải là một chuỗi" })
  name: string;

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
    example: "admin",
    description: "Người tạo đối tượng",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "createdby phải là một chuỗi" })
  createdBy: string;

  @ApiProperty({
    example: true,
    description: "Trạng thái kích hoạt của quyền",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isActive: boolean;

  @Expose()
  @IsOptional()
  createdDate: Date;
}
