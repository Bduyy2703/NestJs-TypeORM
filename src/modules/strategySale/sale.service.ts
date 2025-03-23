import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { CreateSaleDto } from "./dto/create-strategy.dto";
import { UpdateSaleDto } from "./dto/update-strategy.dto";
import { AddSaleProductDto } from "./dto/addProduct-tosale.dto";
import { AddSaleCategoryDto } from "./dto/addCategory";

@Injectable()
export class SaleStrategyService {
  private sales = [];

  async createSale(dto: CreateSaleDto) {
    const newSale = { id: Date.now(), ...dto, isActive: true };
    this.sales.push(newSale);
    return newSale;
  }

  async updateSale(id: number, dto: UpdateSaleDto) {
    const sale = this.sales.find((sale) => sale.id === id);
    if (!sale) throw new NotFoundException("Sale không tồn tại.");
    if (sale.isActive) throw new BadRequestException("Không thể cập nhật sale đang diễn ra.");
    Object.assign(sale, dto);
    return sale;
  }

  async deleteSale(id: number) {
    const index = this.sales.findIndex((sale) => sale.id === id);
    if (index === -1) throw new NotFoundException("Sale không tồn tại.");
    this.sales.splice(index, 1);
    return { message: "Sale đã được xóa." };
  }

  async getAllSales() {
    return this.sales;
  }

  async getSaleById(id: number) {
    const sale = this.sales.find((sale) => sale.id === id);
    if (!sale) throw new NotFoundException("Sale không tồn tại.");
    return sale;
  }

  async getActiveSale() {
    return this.sales.find((sale) => sale.isActive) || null;
  }

  async endCurrentSale() {
    const activeSale = this.sales.find((sale) => sale.isActive);
    if (!activeSale) throw new NotFoundException("Không có chương trình giảm giá nào đang diễn ra.");
    activeSale.isActive = false;
    return activeSale;
  }

  async addProductToSale(id: number, dto: AddSaleProductDto) {
    const sale = this.sales.find((sale) => sale.id === id);
    if (!sale) throw new NotFoundException("Sale không tồn tại.");
    if (sale.isActive) throw new BadRequestException("Không thể thêm sản phẩm vào sale đang diễn ra.");
    sale.products = sale.products || [];
    sale.products.push(dto);
    return sale;
  }

  async removeProductFromSale(id: number, productId: number) {
    const sale = this.sales.find((sale) => sale.id === id);
    if (!sale) throw new NotFoundException("Sale không tồn tại.");
    if (sale.isActive) throw new BadRequestException("Không thể xóa sản phẩm khỏi sale đang diễn ra.");
    sale.products = sale.products.filter((product) => product.id !== productId);
    return sale;
  }

  async addCategoryToSale(id: number, dto: AddSaleCategoryDto) {
    const sale = this.sales.find((sale) => sale.id === id);
    if (!sale) throw new NotFoundException("Sale không tồn tại.");
    if (sale.isActive) throw new BadRequestException("Không thể thêm danh mục vào sale đang diễn ra.");
    sale.categories = sale.categories || [];
    sale.categories.push(dto);
    return sale;
  }

  async removeCategoryFromSale(id: number, categoryId: number) {
    const sale = this.sales.find((sale) => sale.id === id);
    if (!sale) throw new NotFoundException("Sale không tồn tại.");
    if (sale.isActive) throw new BadRequestException("Không thể xóa danh mục khỏi sale đang diễn ra.");
    sale.categories = sale.categories.filter((category) => category.id !== categoryId);
    return sale;
  }
}


// async getProductWithDiscount(productId: number) {
//     const product = await this.productRepository.findOne({
//       where: { id: productId },
//       relations: ['strategySale'], // Lấy chiến lược giảm giá
//     });
  
//     if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");
  
//     let finalPrice = product.originalPrice;
  
//     // Kiểm tra xem sản phẩm có chiến lược giảm giá không
//     if (product.strategySale) {
//       const now = new Date();
//       const { discountPercentage, startDate, endDate } = product.strategySale;
  
//       // Nếu chiến lược giảm giá đang có hiệu lực, tính toán giá giảm
//       if (now >= startDate && now <= endDate) {
//         finalPrice = product.originalPrice * (1 - discountPercentage / 100);
//       }
//     }
  
//     return {
//       id: product.id,
//       name: product.name,
//       originalPrice: product.originalPrice,
//       finalPrice: finalPrice, // Giá có thể đã giảm
//       strategySale: product.strategySale ? product.strategySale.name : null,
//     };
//   }
  