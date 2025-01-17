import { IsIn } from 'class-validator';
import { StatusEnum } from 'src/common/enums/blog-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';


export class BlogActionsDto {
    @IsOptional()
    @IsIn([StatusEnum.APPROVED, StatusEnum.PENDING_APPROVAL])
    @ApiPropertyOptional({
        required: false,
        enum: StatusEnum,
        example: StatusEnum.PENDING_APPROVAL
    })
    action: StatusEnum;
}
