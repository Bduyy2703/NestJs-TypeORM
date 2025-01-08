import { IsIn } from 'class-validator';
import { Status } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';


export class BlogActionsDto {
    @IsOptional()
    @IsIn([Status.APPROVED, Status.PENDING_APPROVAL])
    @ApiPropertyOptional({
        required: false,
        enum: Status,
        example: Status.PENDING_APPROVAL
    })
    action: Status;
}
