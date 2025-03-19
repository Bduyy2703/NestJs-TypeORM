import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiSecurity } from "@nestjs/swagger";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";

@ApiTags("Inventory")
@Controller("inventory")
@ApiSecurity('JWT-auth')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get()
  @Actions('read')
  @Objectcode('INVENTORY01')
  @ApiOperation({ summary: "Lấy danh sách tất cả kho" })
  @ApiResponse({ status: HttpStatus.OK, description: "Thành công" })
  async getAllInventories() {
    const data = await this.inventoryService.findAll();
    return { statusCode: HttpStatus.OK, message: "Lấy danh sách kho thành công", data };
  }

  @Get(":id")
  @Actions('read')
  @Objectcode('INVENTORY01')
  @ApiOperation({ summary: "Lấy thông tin kho theo ID" })
  @ApiParam({ name: "id", type: "number", example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: "Thành công" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Không tìm thấy kho" })
  async getInventoryById(@Param("id") id: number) {
    const data = await this.inventoryService.findById(id);
    return { statusCode: HttpStatus.OK, message: "Lấy kho thành công", data };
  }

  @Post()
  @Actions('create')
  @Objectcode('INVENTORY01')
  @ApiOperation({ summary: "Tạo kho mới" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "Tạo kho thành công" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Dữ liệu không hợp lệ" })
  @HttpCode(HttpStatus.CREATED)
  async createInventory(@Body() createInventoryDto: CreateInventoryDto) {
    const data = await this.inventoryService.create(createInventoryDto);
    return { statusCode: HttpStatus.CREATED, message: "Tạo kho thành công", data };
  }

  @Put(":id")
  @Actions('update')
  @Objectcode('INVENTORY01')
  @ApiOperation({ summary: "Cập nhật kho theo ID" })
  @ApiParam({ name: "id", type: "number", example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: "Cập nhật thành công" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Không tìm thấy kho" })
  async updateInventory(@Param("id") id: number, @Body() updateInventoryDto: UpdateInventoryDto) {
    const data = await this.inventoryService.update(id, updateInventoryDto);
    return { statusCode: HttpStatus.OK, message: "Cập nhật kho thành công", data };
  }

  @Delete(":id")
  @Actions('delete')
  @Objectcode('INVENTORY01')
  @ApiOperation({ summary: "Xóa kho theo ID" })
  @ApiParam({ name: "id", type: "number", example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: "Xóa thành công" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Không tìm thấy kho" })
  async deleteInventory(@Param("id") id: number) {
    await this.inventoryService.delete(id);
    return { statusCode: HttpStatus.OK, message: "Xóa kho thành công" };
  }

  // Nhập hàng vào kho
  @Post(":id/add-stock")
  @Actions("update")
  @Objectcode("INVENTORY01")
  @ApiOperation({ summary: "Nhập hàng vào kho" })
  @ApiParam({ name: "id", type: "number", example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: "Nhập hàng thành công" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Không tìm thấy kho" })
  async addStock(@Param("id") id: number, @Body() body: { quantity: number }) {
    const data = await this.inventoryService.addStock(id, body.quantity);
    return { statusCode: HttpStatus.OK, message: "Nhập hàng thành công", data };
  }

  // Xuất hàng khỏi kho
  @Post(":id/remove-stock")
  @Actions("update")
  @Objectcode("INVENTORY01")
  @ApiOperation({ summary: "Xuất hàng khỏi kho" })
  @ApiParam({ name: "id", type: "number", example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: "Xuất hàng thành công" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Số lượng không đủ" })
  async removeStock(@Param("id") id: number, @Body() body: { quantity: number }) {
    const data = await this.inventoryService.removeStock(id, body.quantity);
    return { statusCode: HttpStatus.OK, message: "Xuất hàng thành công", data };
  }

  // Kiểm tra tồn kho
  @Get(":id/stock")
  @Actions("read")
  @Objectcode("INVENTORY01")
  @ApiOperation({ summary: "Kiểm tra số lượng tồn kho" })
  @ApiParam({ name: "id", type: "number", example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: "Lấy số lượng thành công" })
  async getStock(@Param("id") id: number) {
    const data = await this.inventoryService.getStock(id);
    return { statusCode: HttpStatus.OK, message: "Lấy số lượng tồn kho thành công", data };
  }
}
