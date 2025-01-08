
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { StatusEnum } from 'src/common/enums/blog-status.enum';

export class StatusDto {
  @IsOptional()
  @IsEnum(StatusEnum)
  @ApiPropertyOptional({
    required: false,
    enum: StatusEnum,
    example: StatusEnum.PENDING_APPROVAL
  })
  status: StatusEnum;
}
