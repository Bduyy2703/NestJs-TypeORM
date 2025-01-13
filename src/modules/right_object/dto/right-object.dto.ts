import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { RightDto } from "src/modules/right/dto/right.dto";
import { ObjectDto } from "src/modules/object/dto/object.dto";

export class RightObjectDto {
  @ApiProperty({
    example: 1,
    description: "ID của quyền-đối tượng",
    required: true,
  })
  @Expose()
  @IsInt({ message: "ID phải là một số nguyên" })
  id: number;

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

  @ApiPropertyOptional({ type: RightDto })
  @Expose()
  @Type(() => RightDto)
  right?: RightDto;

  @ApiPropertyOptional({ type: ObjectDto })
  @Expose()
  @Type(() => ObjectDto)
  object?: ObjectDto;

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

  @Expose()
  @IsOptional()
  updateddDate: Date;

  @ApiProperty({
    example: "admin",
    description: "Người cập nhật bản ghi",
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString({ message: "updatedby phải là một chuỗi" })
  updatedBy: string;

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
