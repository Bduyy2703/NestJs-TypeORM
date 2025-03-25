import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { StrategySale } from "./entity/strategySale.entity";
import { CreateSaleDto } from "./dto/create-strategy.dto";
import { UpdateSaleDto } from "./dto/update-strategy.dto";
import { Product } from "src/modules/product/entity/product.entity";
import { Category } from "src/modules/category/entity/category.entity";
import { AddSaleProductDto } from "./dto/addProduct-tosale.dto";
import { AddSaleCategoryDto } from "./dto/addCategory";

@Injectable()
export class SaleStrategyService {
  constructor(
    @InjectRepository(StrategySale)
    private readonly saleRepository: Repository<StrategySale>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  /**
   * Lấy chương trình giảm giá đang diễn ra (isActive = true)
   */
  async getActiveSale(): Promise<StrategySale | null> {
    return await this.saleRepository.findOne({ where: { isActive: true } });
  }

  /**
   * Lấy chương trình giảm giá theo ID
   */
  async getSaleById(id: number): Promise<StrategySale> {
    const sale = await this.saleRepository.findOne({ where: { id }, relations: ["products", "categories"] });
    if (!sale) {
      throw new NotFoundException("Sale không tồn tại.");
    }
    return sale;
  }

  /**
   * Tạo mới chương trình giảm giá
   */
  async createSale(dto: CreateSaleDto): Promise<StrategySale> {
    const categories = dto.categories?.length
      ? await this.categoryRepository.findBy({ id: In(dto.categories) })
      : [];
    const products = dto.products?.length
      ? await this.productRepository.findBy({ id: In(dto.products) })
      : [];
    const newSale = this.saleRepository.create({
      ...dto,
      isActive: false,
      categories,
      products,
    });
  
    return await this.saleRepository.save(newSale);
  }  
  
  /**
   * Cập nhật chương trình giảm giá
   */
  async updateSale(id: number, dto: UpdateSaleDto): Promise<StrategySale> {
    const sale = await this.getSaleById(id);
    Object.assign(sale, dto);
    return await this.saleRepository.save(sale);
  }

  /**
   * Xóa chương trình giảm giá
   */
  async deleteSale(id: number): Promise<void> {
    const sale = await this.getSaleById(id);
    await this.saleRepository.remove(sale);
  }

  /**
   * Kết thúc chương trình giảm giá hiện tại
   */
  async endSale(id: number): Promise<StrategySale> {
    const sale = await this.getSaleById(id);
    if (!sale.isActive) {
      throw new BadRequestException("Chương trình giảm giá này đã kết thúc.");
    }
    sale.isActive = false;
    return await this.saleRepository.save(sale);
  }

  /**
   * Lấy danh sách tất cả chương trình giảm giá
   */
  async getAllSales(): Promise<StrategySale[]> {
    return await this.saleRepository.find({
      relations: {
        products: true,
        categories: true,
      },
    });    
  }

  /**
   * Lấy tất cả sản phẩm thuộc chương trình giảm giá
   */
  async getSaleProducts(): Promise<Product[]> {
    const activeSale = await this.getActiveSale();
    console.log(activeSale)
    if (!activeSale) {
      throw new NotFoundException("Không có chương trình giảm giá nào đang diễn ra.");
    }
    return activeSale.products;
  }

  /**
   * Lấy tất cả danh mục thuộc chương trình giảm giá
   */
  async getSaleCategories(): Promise<Category[]> {
    const activeSale = await this.getActiveSale();
    if (!activeSale) {
      throw new NotFoundException("Không có chương trình giảm giá nào đang diễn ra.");
    }
    return activeSale.categories;
  }

  /**
   * Thêm sản phẩm vào chương trình giảm giá
   */
  async addProductToSale(saleId: number, dto: AddSaleProductDto): Promise<StrategySale> {
    const sale = await this.getSaleById(saleId);
    const product = await this.productRepository.findOne({ where: { id: dto.productId } });

    if (!product) {
      throw new NotFoundException("Sản phẩm không tồn tại.");
    }

    sale.products = [...(sale.products || []), product];
    return await this.saleRepository.save(sale);
  }

  /**
   * Xóa sản phẩm khỏi chương trình giảm giá
   */
  async removeProductFromSale(saleId: number, productId: number): Promise<void> {
    const sale = await this.getSaleById(saleId);
    sale.products = sale.products.filter((product) => product.id !== productId);
    await this.saleRepository.save(sale);
  }

  /**
   * Cập nhật thông tin sản phẩm trong chương trình giảm giá
   */
  async updateSaleProduct(saleId: number, productId: number, dto: AddSaleProductDto): Promise<StrategySale> {
    const sale = await this.getSaleById(saleId);
    const productIndex = sale.products.findIndex((p) => p.id === productId);

    if (productIndex === -1) {
      throw new NotFoundException("Sản phẩm không thuộc chương trình giảm giá này.");
    }

    const updatedProduct = await this.productRepository.preload({ id: productId, ...dto });

    if (!updatedProduct) {
      throw new NotFoundException("Không tìm thấy sản phẩm cần cập nhật.");
    }

    sale.products[productIndex] = updatedProduct;
    return await this.saleRepository.save(sale);
  }

  /**
   * Thêm danh mục vào chương trình giảm giá
   */
  async addCategoryToSale(saleId: number, dto: AddSaleCategoryDto): Promise<StrategySale> {
    const sale = await this.getSaleById(saleId);
    const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });

    if (!category) {
      throw new NotFoundException("Danh mục không tồn tại.");
    }

    sale.categories = [...(sale.categories || []), category];
    return await this.saleRepository.save(sale);
  }

  /**
   * Xóa danh mục khỏi chương trình giảm giá
   */
  async removeCategoryFromSale(saleId: number, categoryId: number): Promise<void> {
    const sale = await this.getSaleById(saleId);
    sale.categories = sale.categories.filter((category) => category.id !== categoryId);
    await this.saleRepository.save(sale);
  }

  /**
   * Cập nhật thông tin danh mục trong chương trình giảm giá
   */
  async updateSaleCategory(saleId: number, categoryId: number, dto: AddSaleCategoryDto): Promise<StrategySale> {
    const sale = await this.getSaleById(saleId);
    const categoryIndex = sale.categories.findIndex((c) => c.id === categoryId);

    if (categoryIndex === -1) {
      throw new NotFoundException("Danh mục không thuộc chương trình giảm giá này.");
    }

    const updatedCategory = await this.categoryRepository.preload({ id: categoryId, ...dto });

    if (!updatedCategory) {
      throw new NotFoundException("Không tìm thấy danh mục cần cập nhật.");
    }

    sale.categories[categoryIndex] = updatedCategory;
    return await this.saleRepository.save(sale);
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
  