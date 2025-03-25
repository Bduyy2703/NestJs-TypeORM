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
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";
import { Public } from "src/cores/decorators/public.decorator";

@ApiTags("Sale Strategies")
@Controller("sales")
@ApiSecurity("JWT-auth")
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

  @Post()
  @Actions("create")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Tạo chương trình giảm giá mới" })
  @ApiResponse({ status: 201, description: "Tạo thành công." })
  @ApiResponse({ status: 400, description: "Thất bại trong lúc tạo" })
  async createSale(@Body() dto: CreateSaleDto) {
    if (dto.isGlobalSale && (dto.products?.length || dto.categories?.length)) {
      throw new BadRequestException("Không thể chọn sản phẩm hoặc danh mục khi isGlobalSale = true.");
    }
    return await this.saleService.createSale(dto);
  }


  @Put(":id")
  @Actions("update")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Cập nhật thông tin chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công." })
  @ApiResponse({ status: 404, description: "Sale không tồn tại." })
  async updateSale(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSaleDto) {
    return await this.saleService.updateSale(id, dto);
  }

  @Delete(":id")
  @Actions("delete")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Xóa chương trình giảm giá" })
  @ApiResponse({ status: 204, description: "Xóa thành công." })
  @ApiResponse({ status: 404, description: "Sale không tồn tại." })
  @HttpCode(204)
  async deleteSale(@Param("id", ParseIntPipe) id: number) {
    await this.validateSale(id);
    return await this.saleService.deleteSale(id);
  }

  @Get()
  @Actions("read")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Lấy danh sách tất cả chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy danh sách thành công." })
  async getAllSales(@Query() query: GetSaleDto) {
    return await this.saleService.getAllSales();
  }

  @Get(":id")
  @Actions("read")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Lấy thông tin chi tiết một chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy thông tin thành công." })
  @ApiResponse({ status: 404, description: "Sale không tồn tại." })
  async getSaleById(@Param("id", ParseIntPipe) id: number) {
    return await this.saleService.getSaleById(id);
  }

  @Get("/products")
  @Actions("read")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Lấy danh sách sản phẩm trong chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy danh sách sản phẩm thành công." })
  async getSaleProducts() {
    return await this.saleService.getSaleProducts();
  }

  @Get("/categories")
  @Actions("read")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Lấy danh sách danh mục trong chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Lấy danh sách danh mục thành công." })
  async getSaleCategories() {
    return await this.saleService.getSaleCategories();
  }

  @Get("/active")
  @Actions("read")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Lấy chương trình giảm giá đang diễn ra" })
  @ApiResponse({ status: 200, description: "Lấy thành công." })
  @ApiResponse({ status: 404, description: "Không có chương trình giảm giá nào đang diễn ra." })
  async getActiveSale() {
    return await this.saleService.getActiveSale();
  }

  @Put("/active/end")
  @Actions("update")
  @Objectcode("SALE01")
  @ApiOperation({ summary: "Kết thúc chương trình giảm giá hiện tại" })
  @ApiResponse({ status: 200, description: "Kết thúc thành công." })
  @ApiResponse({ status: 404, description: "Không có chương trình giảm giá nào đang diễn ra." })
  async endCurrentSale() {
    const activeSale = await this.saleService.getActiveSale();
    if (!activeSale) {
      throw new NotFoundException("Không có chương trình giảm giá nào đang diễn ra.");
    }
    return await this.saleService.endSale(activeSale.id);
  }

  @Post(":id/products")
  @ApiOperation({ summary: "Thêm sản phẩm vào chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Thêm thành công." })
  async addProductToSale(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AddSaleProductDto
  ) {
    await this.validateSale(id);
    return await this.saleService.addProductToSale(id, dto);
  }

  @Delete(":id/products/:productId")
  @ApiOperation({ summary: "Xóa sản phẩm khỏi chương trình giảm giá" })
  @ApiResponse({ status: 204, description: "Xóa thành công." })
  @HttpCode(204)
  async removeProductFromSale(
    @Param("id", ParseIntPipe) id: number,
    @Param("productId", ParseIntPipe) productId: number
  ) {
    await this.validateSale(id);
    return await this.saleService.removeProductFromSale(id, productId);
  }

  @Put(":id/products/:productId")
  @ApiOperation({ summary: "chỉnh sửa sản phẩm có trong chương trình giảm giá" })
  @ApiResponse({ status: 204, description: "cập nhật thành công." })
  async updateSaleProduct(
    @Param("id", ParseIntPipe) id: number,
    @Param("productId", ParseIntPipe) productId: number,
    @Body() dto: AddSaleProductDto
  ) {
    await this.validateSale(id);
    return await this.saleService.updateSaleProduct(id, productId, dto);
  }

  @Post(":id/categories")
  @ApiOperation({ summary: "Thêm danh mục vào chương trình giảm giá" })
  @ApiResponse({ status: 200, description: "Thêm thành công." })
  async addCategoryToSale(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AddSaleCategoryDto
  ) {
    await this.validateSale(id);
    return await this.saleService.addCategoryToSale(id, dto);
  }

  @Delete(":id/categories/:categoryId")
  @ApiOperation({ summary: "Xóa danh mục khỏi chương trình giảm giá" })
  @ApiResponse({ status: 204, description: "Xóa thành công." })
  @HttpCode(204)
  async removeCategoryFromSale(
    @Param("id", ParseIntPipe) id: number,
    @Param("categoryId", ParseIntPipe) categoryId: number
  ) {
    await this.validateSale(id);
    return await this.saleService.removeCategoryFromSale(id, categoryId);
  }

  @Put(":id/categories/:categoryId")
  @ApiOperation({ summary: "chỉnh sửa danh mục có trong chương trình giảm giá" })
  @ApiResponse({ status: 204, description: "cập nhật thành công." })
  async updateSaleCategory(
    @Param("id", ParseIntPipe) id: number,
    @Param("categoryId", ParseIntPipe) categoryId: number,
    @Body() dto: AddSaleCategoryDto
  ) {
    await this.validateSale(id);
    return await this.saleService.updateSaleCategory(id, categoryId, dto);
  }
}
