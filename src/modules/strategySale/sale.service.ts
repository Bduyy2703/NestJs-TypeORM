import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from "typeorm";
import { StrategySale } from "./entity/strategySale.entity";
import { CreateSaleDto } from "./dto/create-strategy.dto";
import { UpdateSaleDto } from "./dto/update-strategy.dto";
import { Product } from "src/modules/product/entity/product.entity";
import { Category } from "src/modules/category/entity/category.entity";
import { AddSaleProductDto } from "./dto/addProduct-tosale.dto";
import { AddSaleCategoryDto } from "./dto/addCategory";
import { ProductStrategySale } from "./entity/productSale.entity";
import { CategoryStrategySale } from "./entity/categorySale.entity";
import { GetSaleDto } from "./dto/get-sale-strategy";

@Injectable()
export class SaleStrategyService {
  constructor(
    @InjectRepository(StrategySale) private readonly saleRepository: Repository<StrategySale>,
    @InjectRepository(ProductStrategySale) private readonly productStrategySaleRepository: Repository<ProductStrategySale>,
    @InjectRepository(CategoryStrategySale) private readonly categoryStrategySaleRepository: Repository<CategoryStrategySale>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  /**
   * Lấy chương trình giảm giá đang diễn ra (isActive = true)
   */
  async getActiveSale(): Promise<StrategySale | null> {
    const sale = await this.saleRepository.findOne({
      where: { isActive: true },
      relations: ["productStrategySales.product", "categoryStrategySales.category"],
    });
  
    return sale;
  }
  

  /**
   * Lấy chương trình giảm giá theo ID
   */
  async getSaleById(id: number): Promise<StrategySale> {
    const sale = await this.saleRepository.findOne({ where: { id }, relations: ["productStrategySales.product", "categoryStrategySales.category"] });
    if (!sale) {
      throw new NotFoundException("Sale không tồn tại.");
    }
    return sale;
  }

  /**
   * Tạo mới chương trình giảm giá
   */
  async createSale(dto: CreateSaleDto): Promise<StrategySale> {
    if (dto.isGlobalSale && (dto.products?.length || dto.categories?.length)) {
      throw new BadRequestException("Không thể chọn sản phẩm hoặc danh mục khi isGlobalSale = true.");
    }
  
    const newSale = this.saleRepository.create({
      name: dto.name,
      discountPercent: dto.discountPercent,
      discountAmount: dto.discountAmount,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isGlobalSale: dto.isGlobalSale,
      isActive: false,
    });
  
    const savedSale = await this.saleRepository.save(newSale);
  
    // Nếu không phải giảm giá toàn hệ thống, thêm sản phẩm và danh mục vào bảng trung gian
    if (!dto.isGlobalSale) {
      if (dto.categories?.length) {
        const categorySales = dto.categories.map((categoryId) =>
          this.categoryStrategySaleRepository.create({
            category: { id: categoryId },
            strategySale: savedSale,
          })
        );
        await this.categoryStrategySaleRepository.save(categorySales);
      }
  
      if (dto.products?.length) {
        const productSales = dto.products.map((productId) =>
          this.productStrategySaleRepository.create({
            product: { id: productId },
            strategySale: savedSale,
          })
        );
        await this.productStrategySaleRepository.save(productSales);
      }
    }
  
    return savedSale;
  }  
  
  /**
   * Cập nhật chương trình giảm giá
   */
  async updateSale(id: number, dto: UpdateSaleDto): Promise<StrategySale> {
    const sale = await this.getSaleById(id);
    if (dto.isActive === true) {
      const existingActiveSale = await this.saleRepository.findOne({
        where: { isActive: true, id: Not(id) },
      });
  
      if (existingActiveSale) {
        dto.isActive = false;
        throw new BadRequestException(
          "Đã có chương trình giảm giá đang diễn ra. Vui lòng kết thúc trước khi kích hoạt chương trình mới."
        );
      }
  
      let productIds: number[];
      
      if (sale.isGlobalSale) {
        const allProducts = await this.productRepository.find({ select: ["id"] });
        productIds = allProducts.map((p) => p.id);
      } else {
        const allCategoryIds = sale.categoryStrategySales.map(c => c.categoryId);
        const allProduct =  sale.productStrategySales.map(c => c.productId)
        const productsInCategories = await this.productRepository.find({
          where: {
            category: { id: In(allCategoryIds) }
          },
          select: ["id"]
        });
        productIds = [
         ...allProduct,
          ...productsInCategories.map(p => p.id)
        ];
      }

      await this.productRepository.update(
        { id: In(productIds) },
        { finalPrice: () => `originalPrice * (1 - ${sale.discountAmount} / 100)` }
      );
    } else {
      let productIds: number[];
  
      if (sale.isGlobalSale) {
        const allProducts = await this.productRepository.find({ select: ["id"] });
        productIds = allProducts.map((p) => p.id);
      } else {
        const allCategoryIds = sale.categoryStrategySales.map(c => c.categoryId)
        const allProduct =  sale.productStrategySales.map(c => c.productId)
        const productsInCategories = await this.productRepository.find({
          where: {
            category: { id: In(allCategoryIds) }
          },
          select: ["id"]
        });
        

        productIds = [
          ...allProduct,
          ...productsInCategories.map(p => p.id)
        ];
      }
      
      // 🔥 Đặt lại finalPrice về originalPrice
      await this.productRepository.update(
        { id: In(productIds) },
        { finalPrice: () => "originalPrice" }
      );
    }
  
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
  await this.saleRepository.save(sale);

  let productIds: number[];

  if (sale.isGlobalSale) {
    // 🔥 Nếu giảm giá toàn trang, lấy tất cả sản phẩm
    const allProducts = await this.productRepository.find({ select: ["id"] });
    productIds = allProducts.map((p) => p.id);
  } else {
    const allCategoryIds = sale.categoryStrategySales.map(c => c.categoryId)
    const allProduct =  sale.productStrategySales.map(c => c.productId)
    const productsInCategories = await this.productRepository.find({
      where: {
        category: { id: In(allCategoryIds) }
      },
      select: ["id"]
    });
    

    productIds = [
      ...allProduct,
      ...productsInCategories.map(p => p.id)
    ];
  }

  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.length > 0) {
    await this.productRepository.update(
      { id: In(uniqueProductIds) },
      { finalPrice: () => "originalPrice" }
    );
  }

  return sale;
}

  /**
   * Lấy danh sách tất cả chương trình giảm giá
   */
  async getAllSales(query: GetSaleDto): Promise<StrategySale[]> {
    const { isGlobalSale, isActive, startDate, endDate } = query;
    
    console.log(isActive , isGlobalSale , 123)
    const whereCondition: any = {};
  
    if (isGlobalSale !== undefined) whereCondition.isGlobalSale = isGlobalSale;
    if (isActive !== undefined) whereCondition.isActive = isActive;
    if (startDate) whereCondition.startDate = MoreThanOrEqual(new Date(startDate));
    if (endDate) whereCondition.endDate = LessThanOrEqual(new Date(endDate));
  
    return await this.saleRepository.find({
      where: whereCondition,
      relations: {
        productStrategySales: { product: true }, // Lấy sản phẩm từ quan hệ
        categoryStrategySales: { category: true }, // Lấy danh mục từ quan hệ
      },
    });
  }
  

  /**
   * Lấy tất cả sản phẩm thuộc chương trình giảm giá
   */
  async getSaleProducts(): Promise<Product[]> {
    const activeSale = await this.saleRepository.findOne({
      where: { isActive: true },
      relations: { productStrategySales: { product: true } },
    });
  
    if (!activeSale) {
      throw new NotFoundException("Không có chương trình giảm giá nào đang diễn ra.");
    }
  
    return activeSale.productStrategySales.map((ps) => ps.product);
  }
  

  /**
   * Lấy tất cả danh mục thuộc chương trình giảm giá
   */
  async getSaleCategories(): Promise<Category[]> {
    const activeSale = await this.saleRepository.findOne({
      where: { isActive: true },
      relations: { categoryStrategySales: { category: true } },
    });
  
    if (!activeSale) {
      throw new NotFoundException("Không có chương trình giảm giá nào đang diễn ra.");
    }
  
    return activeSale.categoryStrategySales.map((cs) => cs.category);
  }
  

  /**
   * Thêm sản phẩm vào chương trình giảm giá
   */
  async addProductToSale(saleId: number, dto: AddSaleProductDto): Promise<StrategySale> {
    // 1. Kiểm tra xem chương trình giảm giá có tồn tại không
    const sale = await this.saleRepository.findOne({
        where: { id: saleId },
        relations: ["productStrategySales"],
    });

    if (!sale) {
        throw new NotFoundException("Chương trình giảm giá không tồn tại.");
    }

    if (sale.isGlobalSale) {
        throw new BadRequestException("Chương trình giảm giá đang áp dụng toàn hệ thống, không thể thêm sản phẩm vào.");
    }

    // 2. Kiểm tra xem sản phẩm có tồn tại không
    if (!dto.productId) {
        throw new BadRequestException("ID sản phẩm không hợp lệ.");
    }

    const product = await this.productRepository.findOne({
        where: { id: dto.productId },
    });

    if (!product) {
        throw new NotFoundException("Sản phẩm không tồn tại.");
    }

    // 3. Kiểm tra xem sản phẩm đã thuộc chương trình giảm giá này chưa
    const existingProductSales = await this.productStrategySaleRepository.find({
        where: { productId: dto.productId },
    });

    const isAlreadyInThisSale = existingProductSales.some(ps => ps.strategySaleId === saleId);
    if (isAlreadyInThisSale) {
        throw new BadRequestException("Sản phẩm đã thuộc chương trình giảm giá này.");
    }

    // 4. Nếu không cho phép sản phẩm tham gia nhiều chương trình khuyến mãi
    const allowMultipleSales = true;
    if (!allowMultipleSales && existingProductSales.length > 0) {
        throw new BadRequestException("Sản phẩm chỉ có thể thuộc một chương trình giảm giá.");
    }

    // 5. Thêm sản phẩm vào chương trình giảm giá
    const newProductSale = this.productStrategySaleRepository.create({
        strategySale: sale,
        product,
    });

    await this.productStrategySaleRepository.save(newProductSale);

    // 6. Nếu chương trình giảm giá đang diễn ra, cập nhật finalPrice của sản phẩm
    if (sale.isActive) {
        await this.productRepository.update(
            { id: dto.productId },
            { finalPrice: () => `originalPrice * (1 - ${sale.discountPercent} / 100)` }
        );
    }

    // 7. Trả về thông tin chương trình giảm giá sau khi cập nhật
    return this.getSaleById(saleId);
}
  

  /**
   * Xóa sản phẩm khỏi chương trình giảm giá
   */
  async removeProductFromSale(saleId: number, productId: number): Promise<void> {
    // 1. Kiểm tra chương trình giảm giá có tồn tại không
    const sale = await this.saleRepository.findOne({
        where: { id: saleId },
        relations: ["productStrategySales"],
    });

    if (!sale) {
        throw new NotFoundException("Chương trình giảm giá không tồn tại.");
    }

    // 2. Kiểm tra sản phẩm có nằm trong chương trình giảm giá không
    const productSale = await this.productStrategySaleRepository.findOne({
        where: { strategySaleId: saleId, productId: productId },
    });

    if (!productSale) {
        throw new NotFoundException("Sản phẩm không tồn tại trong chương trình giảm giá.");
    }

    // 3. Nếu sale đang diễn ra, đặt lại giá gốc
    if (sale.isActive) {
        await this.productRepository.update(
            { id: productId },
            { finalPrice: () => "originalPrice" } // Trả giá về ban đầu
        );
    }

    // 4. Xóa sản phẩm khỏi chương trình giảm giá
    await this.productStrategySaleRepository.remove(productSale);
}

async addCategoryToSale(saleId: number, dto: AddSaleCategoryDto): Promise<StrategySale> {
  // 1. Tìm chương trình giảm giá
  const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: ["categoryStrategySales"],
  });

  if (!sale) throw new NotFoundException("Chương trình giảm giá không tồn tại.");

  // 2. Tìm danh mục
  const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
  if (!category) throw new NotFoundException("Danh mục không tồn tại.");

  // 3. Kiểm tra xem danh mục đã có trong chương trình chưa
  const existingCategory = sale.categoryStrategySales.find((cs) => cs.categoryId === dto.categoryId);
  if (existingCategory) throw new BadRequestException("Danh mục đã có trong chương trình giảm giá.");

  // 4. Thêm danh mục vào chương trình
  const newCategorySale = this.categoryStrategySaleRepository.create({ strategySale: sale, category });
  await this.categoryStrategySaleRepository.save(newCategorySale);

  // 5. Lấy tất cả sản phẩm thuộc danh mục
  const products = await this.productRepository.find({
      where: { category: { id: dto.categoryId } },
      select: ["id", "originalPrice"],
  });

  if (products.length === 0) return this.getSaleById(saleId); // Không có sản phẩm nào

  // 6. Thêm tất cả sản phẩm vào chương trình giảm giá
  const productSales = products.map((product) =>
      this.productStrategySaleRepository.create({ product, strategySale: sale })
  );
  await this.productStrategySaleRepository.save(productSales);

  // 7. Nếu sale đang diễn ra, cập nhật giá sản phẩm
  if (sale.isActive) {
      await this.productRepository.update(
          { id: In(products.map((p) => p.id)) },
          { finalPrice: () => `originalPrice * (1 - ${sale.discountAmount} / 100)` }
      );
  }

  return this.getSaleById(saleId);
}

  /**
   * Xóa danh mục khỏi chương trình giảm giá
   */
  async removeCategoryFromSale(saleId: number, categoryId: number): Promise<void> {
    // 1. Tìm chương trình giảm giá
    const sale = await this.saleRepository.findOne({
        where: { id: saleId },
        relations: ["categoryStrategySales"],
    });

    if (!sale) throw new NotFoundException("Chương trình giảm giá không tồn tại.");

    // 2. Tìm danh mục trong chương trình giảm giá
    const categorySale = await this.categoryStrategySaleRepository.findOne({
        where: { strategySale: { id: saleId }, category: { id: categoryId } },
    });

    if (!categorySale) throw new NotFoundException("Danh mục không tồn tại trong chương trình giảm giá.");

    // 3. Xóa bản ghi danh mục khỏi chương trình giảm giá
    await this.categoryStrategySaleRepository.remove(categorySale);

    // 4. Lấy danh sách sản phẩm thuộc danh mục này
    const products = await this.productRepository.find({
        where: { category: { id: categoryId } },
        select: ["id"],
    });

    if (products.length === 0) return; // Không có sản phẩm nào, kết thúc luôn

    // 5. Xóa tất cả sản phẩm thuộc danh mục khỏi chương trình giảm giá
    await this.productStrategySaleRepository.delete({
        strategySale: { id: saleId },
        product: { id: In(products.map((p) => p.id)) },
    });

    // 6. Nếu chương trình giảm giá đang diễn ra, reset giá sản phẩm về originalPrice
    if (sale.isActive) {
        await this.productRepository.update(
            { id: In(products.map((p) => p.id)) },
            { finalPrice: () => "originalPrice" }
        );
    }
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
  