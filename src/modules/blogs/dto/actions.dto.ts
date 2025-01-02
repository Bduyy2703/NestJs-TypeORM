import { IsIn } from 'class-validator';
import { Status } from '@prisma/client';

export class BlogActionsDto {
    @IsIn([Status.APPROVED, Status.DELETED])
    action: Status;
}
