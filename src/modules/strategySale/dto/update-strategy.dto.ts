import { PartialType } from "@nestjs/mapped-types";
import { CreateSaleDto } from "./create-strategy.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateSaleDto extends PartialType(CreateSaleDto) {
    @ApiProperty({ description: "Trạng thái hoạt động của chương trình", example: false })
    @IsBoolean()
    isActive: boolean;
}
