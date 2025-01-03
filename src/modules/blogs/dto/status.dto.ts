import { IsEnum } from 'class-validator';
import { StatusEnum } from 'src/common/enums/blog-status.enum';

export class StatusDto {
  @IsEnum(StatusEnum, {
    message: `status must be one of the following values: ${Object.values(StatusEnum).join(', ')}`,
  })
  status: StatusEnum;
}
