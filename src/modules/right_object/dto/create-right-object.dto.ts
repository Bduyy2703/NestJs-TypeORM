import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CreateRightObjectDto {
  @ApiProperty({
    example: 1,
    description: "ID của quyền",
    required: true,
  })
  @Expose()
  @IsInt({ message: "rightid phải là một số nguyên" })
  rightId: number;

  @ApiProperty({
    example: 2,
    description: "ID của đối tượng",
    required: true,
  })
  @Expose()
  @IsInt({ message: "objectid phải là một số nguyên" })
  objectId: number;

  @ApiProperty({
    description: "Quyền tạo (create)",
    example: true,
    default: true,
  })
  @Expose()
  @IsBoolean({ message: "createyn phải là kiểu boolean" })
  createYn: boolean;

  @ApiProperty({
    description: "Quyền đọc (read)",
    example: true,
    default: true,
  })
  @Expose()
  @IsBoolean({ message: "readyn phải là kiểu boolean" })
  readYn: boolean;

  @ApiProperty({
    description: "Quyền cập nhật (update)",
    example: false,
    default: false,
  })
  @Expose()
  @IsBoolean({ message: "updateyn phải là kiểu boolean" })
  updateYn: boolean;

  @ApiProperty({
    description: "Quyền xóa (delete)",
    example: true,
    default: true,
  })
  @Expose()
  @IsBoolean({ message: "deleteyn phải là kiểu boolean" })
  deleteYn: boolean;

  @ApiProperty({
    description: "Quyền thực thi (execute)",
    example: true,
    default: true,
  })
  @Expose()
  @IsBoolean({ message: "executeyn phải là kiểu boolean" })
  executeYn: boolean;

  @Expose()
  @IsOptional()
  createdDate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người tạo bản ghi",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "createdby phải là một chuỗi" })
  createdBy: string;

  @ApiProperty({
    description: "Trạng thái hoạt động",
    example: true,
    default: true,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isActive: boolean;
}
