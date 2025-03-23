import { PartialType } from "@nestjs/mapped-types";
import { CreateSaleDto } from "./create-strategy.dto";

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
