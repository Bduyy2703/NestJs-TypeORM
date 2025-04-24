import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  HttpCode,
  ParseIntPipe,
} from "@nestjs/common";
import { SaleStrategyService } from "./sale.service";
import { CreateSaleDto } from "./dto/create-strategy.dto";
import { UpdateSaleDto } from "./dto/update-strategy.dto";
import { GetSaleDto } from "./dto/get-sale-strategy";
import { AddSaleProductDto } from "./dto/addProduct-tosale.dto";
import { AddSaleCategoryDto } from "./dto/addCategory";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";
import { Public } from "src/cores/decorators/public.decorator";

@ApiTags("Sale Strategies")
@Controller("sales")
@ApiSecurity("JWT-auth")
@ApiBearerAuth()
export class SaleStrategyController {
  constructor(private readonly saleService: SaleStrategyService) { }

  private async validateSale(id: number, allowActive = false) {
    const sale = await this.saleService.getSaleById(id);
    if (!sale) {
      throw new NotFoundException("Sale không tồn tại.");
    }
    if (sale.isActive && !allowActive) {
      throw new BadRequestException("Không thể thực hiện thao tác trên sale đang diễn ra.");
    }
    return sale;
  }

  @Get("/active")
  @Public()
  @ApiOperation({ summary: "Lấy chương trình giảm giá đang diễn ra" })
  @ApiResponse({ status: 200, description: "Lấy thành công." })
  @ApiResponse({ status: 404, description: "Không có chương trình giảm giá nào đang diễn ra." })
  async getActiveSale() {
    return await this.saleService.getActiveSale();
  }

  @Get()
  @Actions("read")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Lấy danh sách tất cả chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy danh sách thành công." })
  async getAllSales(@Query() query: GetSaleDto) {
    console.log(query)
    return await this.saleService.getAllSales(query);
  }

  @Get("/categories")
  @Public()
  @ApiOperation({ summary: "Lấy danh sách danh mục trong chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy danh sách danh mục thành công." })
  async getSaleCategories() {
    return await this.saleService.getSaleCategories();
  }

  @Get("/products")
  @Public()
  @ApiOperation({ summary: "Lấy danh sách sản phẩm trong chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy danh sách sản phẩm thành công." })
  async getSaleProducts() {
    return await this.saleService.getSaleProducts();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Lấy thông tin chi tiết một chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy thông tin thành công." })
  @ApiResponse({ status: 404, description: "Sale không tồn tại." })
  async getSaleById(@Param("id", ParseIntPipe) id: number) {
    return await this.saleService.getSaleById(id);
  }

  @Post()
  @Actions("create")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Tạo chương trình giảm giá mới" })
  @ApiResponse({ status: 201, description: "Tạo thành công." })
  @ApiResponse({ status: 400, description: "Thất bại trong lúc tạo" })
  async createSale(@Body() dto: CreateSaleDto) {
    return await this.saleService.createSale(dto);
  }


  @Put(':id')
  @Actions('update')
  @Objectcode('SALE01')
  @ApiOperation({ summary: 'Cập nhật thông tin chương trình giảm giá' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  @ApiResponse({ status: 404, description: 'Sale không tồn tại.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  async updateSale(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSaleDto) {
    if (dto.isGlobalSale && (dto.products?.length || dto.categories?.length)) {
      throw new BadRequestException('Không thể chọn sản phẩm hoặc danh mục khi isGlobalSale = true.');
    }
    if (dto.discountAmount !== undefined && (dto.discountAmount < 0 || dto.discountAmount > 100)) {
      throw new BadRequestException('discountAmount phải từ 0 đến 100');
    }
    return await this.saleService.updateSale(id, dto);
  }

  @Delete(':id')
  @Actions('delete')
  @Objectcode('SALE01')
  @ApiOperation({ summary: 'Xóa chương trình giảm giá' })
  @ApiResponse({ status: 204, description: 'Xóa thành công.' })
  @ApiResponse({ status: 404, description: 'Sale không tồn tại.' })
  @ApiResponse({ status: 400, description: 'Không thể xóa sale đang diễn ra.' })
  @HttpCode(204)
  async deleteSale(@Param('id', ParseIntPipe) id: number) {
    // validateSale có thể kiểm tra sale tồn tại, bỏ nếu không cần
    return await this.saleService.deleteSale(id);
  }

  @Post(":id/products")
  @Actions("create")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Thêm sản phẩm vào chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Thêm thành công." })
  async addProductToSale(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AddSaleProductDto
  ) {
    return await this.saleService.addProductToSale(id, dto);
  }

  @Delete(":id/products/:productId")
  @Actions("delete")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Xóa sản phẩm khỏi chương trình giảm giá" })
  @ApiResponse({ status: 204, description: "Xóa thành công." })
  @HttpCode(204)
  async removeProductFromSale(
    @Param("id", ParseIntPipe) id: number,
    @Param("productId", ParseIntPipe) productId: number
  ) {
    return await this.saleService.removeProductFromSale(id, productId);
  }

  @Post(":id/categories")
  @Actions("create")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Thêm danh mục vào chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Thêm thành công." })
  async addCategoryToSale(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AddSaleCategoryDto
  ) {
    return await this.saleService.addCategoryToSale(id, dto);
  }

  @Delete(":id/categories/:categoryId")
  @Actions("delete")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Xóa danh mục khỏi chương trình giảm giá" })
  @ApiResponse({ status: 204, description: "Xóa thành công." })
  @HttpCode(204)
  async removeCategoryFromSale(
    @Param("id", ParseIntPipe) id: number,
    @Param("categoryId", ParseIntPipe) categoryId: number
  ) {
    return await this.saleService.removeCategoryFromSale(id, categoryId);
  }

  @Post('notify-users/:saleId')
  @Actions('execute')
  @Objectcode('SALE01')
  @ApiOperation({ summary: 'Gửi mail thông báo sale cho user đã wishlist sản phẩm thuộc sale này' })
  @ApiResponse({ status: 200, description: 'Đã gửi mail' })
  async notifyUsersForSale(@Param('saleId') saleId: number) {
    await this.saleService.notifyUsersForSale(saleId);
    return { message: 'Đã gửi mail cho user wishlist sản phẩm thuộc sale này.' };
  }
}
