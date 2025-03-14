import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateInventoryDto } from "./create-inventory.dto";

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {
  @ApiProperty({ example: "Kho miền Nam", description: "Tên kho (Cập nhật)" })
  warehouseName?: string;

  @ApiProperty({ example: "123 Nguyễn Văn B, TP HCM", description: "Địa chỉ kho (Cập nhật)" })
  location?: string;
}
