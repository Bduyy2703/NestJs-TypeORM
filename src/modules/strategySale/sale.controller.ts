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

@Controller("sales")
export class SaleStrategyController {
  constructor(private readonly saleService: SaleStrategyService) {}

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
  async createSale(@Body() dto: CreateSaleDto) {
    const activeSale = await this.saleService.getActiveSale();
    if (activeSale) {
      throw new BadRequestException("Hiện đã có một chương trình giảm giá đang diễn ra.");
    }
    return await this.saleService.createSale(dto);
  }

  @Put(":id")
  async updateSale(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSaleDto) {
    await this.validateSale(id);
    return await this.saleService.updateSale(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async deleteSale(@Param("id", ParseIntPipe) id: number) {
    await this.validateSale(id);
    return await this.saleService.deleteSale(id);
  }

  @Get()
  async getAllSales(@Query() query: GetSaleDto) {
    return await this.saleService.getAllSales(query);
  }

  @Get(":id")
  async getSaleById(@Param("id", ParseIntPipe) id: number) {
    return await this.saleService.getSaleById(id);
  }

  @Get("/products")
  async getSaleProducts() {
    return await this.saleService.getSaleProducts();
  }

  @Get("/categories")
  async getSaleCategories() {
    return await this.saleService.getSaleCategories();
  }

  @Get("/active")
  async getActiveSale() {
    return await this.saleService.getActiveSale();
  }

  @Put("/active/end")
  async endCurrentSale() {
    const activeSale = await this.saleService.getActiveSale();
    if (!activeSale) {
      throw new NotFoundException("Không có chương trình giảm giá nào đang diễn ra.");
    }
    return await this.saleService.endSale(activeSale.id);
  }

  @Post(":id/products")
  async addProductToSale(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AddSaleProductDto
  ) {
    await this.validateSale(id);
    return await this.saleService.addProductToSale(id, dto);
  }

  @Delete(":id/products/:productId")
  @HttpCode(204)
  async removeProductFromSale(
    @Param("id", ParseIntPipe) id: number,
    @Param("productId", ParseIntPipe) productId: number
  ) {
    await this.validateSale(id);
    return await this.saleService.removeProductFromSale(id, productId);
  }

  @Put(":id/products/:productId")
  async updateSaleProduct(
    @Param("id", ParseIntPipe) id: number,
    @Param("productId", ParseIntPipe) productId: number,
    @Body() dto: AddSaleProductDto
  ) {
    await this.validateSale(id);
    return await this.saleService.updateSaleProduct(id, productId, dto);
  }

  @Post(":id/categories")
  async addCategoryToSale(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AddSaleCategoryDto
  ) {
    await this.validateSale(id);
    return await this.saleService.addCategoryToSale(id, dto);
  }

  @Delete(":id/categories/:categoryId")
  @HttpCode(204)
  async removeCategoryFromSale(
    @Param("id", ParseIntPipe) id: number,
    @Param("categoryId", ParseIntPipe) categoryId: number
  ) {
    await this.validateSale(id);
    return await this.saleService.removeCategoryFromSale(id, categoryId);
  }

  @Put(":id/categories/:categoryId")
  async updateSaleCategory(
    @Param("id", ParseIntPipe) id: number,
    @Param("categoryId", ParseIntPipe) categoryId: number,
    @Body() dto: AddSaleCategoryDto
  ) {
    await this.validateSale(id);
    return await this.saleService.updateSaleCategory(id, categoryId, dto);
  }
}
