import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateRightObjectDto {
  @ApiPropertyOptional({
    example: 1,
    description: "ID của quyền",
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "rightid phải là một số nguyên" })
  rightid?: number;

  @ApiPropertyOptional({
    example: 2,
    description: "ID của đối tượng",
  })
  @Expose()
  @IsOptional()
  @IsInt({ message: "objectid phải là một số nguyên" })
  objectid?: number;

  @ApiPropertyOptional({
    description: "Quyền tạo (create)",
    example: true,
    default: true,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "createyn phải là kiểu boolean" })
  createyn?: boolean;

  @ApiPropertyOptional({
    description: "Quyền đọc (read)",
    example: true,
    default: true,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "readyn phải là kiểu boolean" })
  readyn?: boolean;

  @ApiPropertyOptional({
    description: "Quyền cập nhật (update)",
    example: false,
    default: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "updateyn phải là kiểu boolean" })
  updateyn?: boolean;

  @ApiPropertyOptional({
    description: "Quyền xóa (delete)",
    example: true,
    default: true,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "deleteyn phải là kiểu boolean" })
  deleteyn?: boolean;

  @ApiPropertyOptional({
    description: "Quyền thực thi (execute)",
    example: true,
    default: true,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "executeyn phải là kiểu boolean" })
  executeyn?: boolean;

  @Expose()
  @IsOptional()
  updateddate: Date;

  @ApiPropertyOptional({
    example: "admin",
    description: "Người cập nhật bản ghi",
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "updatedby phải là một chuỗi" })
  updatedby?: string;

  @ApiPropertyOptional({
    description: "Trạng thái hoạt động",
    example: true,
    default: true,
  })
  @Expose()
  @IsOptional()
  @IsBoolean({ message: "isactive phải là kiểu boolean" })
  isactive?: boolean;
}
