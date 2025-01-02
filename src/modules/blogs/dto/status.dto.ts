import { IsIn } from 'class-validator';
import { StatusEnum } from 'src/common/enums/blog-status.enum';

export class StatusDto {
  @IsIn([
    StatusEnum.PENDING_APPROVAL,
    StatusEnum.PENDING_DELETION,
    StatusEnum.APPROVED,
    StatusEnum.DELETED,
    StatusEnum.ALL,
  ])
  status: StatusEnum;
}
