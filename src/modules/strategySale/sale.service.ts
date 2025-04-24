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
import { Wishlist } from "../wishlist/entity/wishlist.entity";
import { MailService } from "../mail/mail.service";

@Injectable()
export class SaleStrategyService {
  constructor(
    @InjectRepository(StrategySale) private readonly saleRepository: Repository<StrategySale>,
    @InjectRepository(ProductStrategySale) private readonly productStrategySaleRepository: Repository<ProductStrategySale>,
    @InjectRepository(CategoryStrategySale) private readonly categoryStrategySaleRepository: Repository<CategoryStrategySale>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly mailService: MailService, // Inject mailService
    @InjectRepository(Wishlist) private readonly wishlistRepo: Repository<Wishlist> // Inject wishlistRepo
  ) {}

  /**
   * Lấy chương trình giảm giá đang diễn ra (isActive = true)
   */
  async getActiveSale(): Promise<StrategySale[]> {
    const sales = await this.saleRepository.find({
      where: { isActive: true },
      relations: ["productStrategySales.product", "categoryStrategySales.category"],
    });
    return sales;
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


  if (dto.discountAmount !== undefined && (dto.discountAmount < 0 || dto.discountAmount > 100)) {
    throw new BadRequestException('discountAmount phải từ 0 đến 100');
  }

  // Lưu discountAmount mới (nếu có)
  const newDiscountAmount = dto.discountAmount !== undefined ? dto.discountAmount : sale.discountAmount;

  // Lấy productIds của sale hiện tại
  let productIds: number[];
  if (sale.isGlobalSale) {
    const allProducts = await this.productRepository.find({ select: ['id'] });
    productIds = allProducts.map((p) => p.id);
  } else {
    const allCategoryIds = sale.categoryStrategySales.map((c) => c.categoryId);
    const allProduct = sale.productStrategySales.map((c) => c.productId);
    const productsInCategories = await this.productRepository.find({
      where: { category: { id: In(allCategoryIds) } },
      select: ['id'],
    });
    productIds = [...new Set([...allProduct, ...productsInCategories.map((p) => p.id)])]; // Loại trùng
  }

  // Cập nhật thông tin sale trước
  Object.assign(sale, dto);
  await this.saleRepository.save(sale);

  // Xử lý giá sản phẩm
  if (dto.isActive === true || (dto.isActive === undefined && sale.isActive)) {
    // Sale sẽ active (bật mới hoặc giữ active)
    // Lấy tất cả sale đang chạy (bao gồm sale hiện tại nếu active)
    const activeSales = await this.saleRepository.find({
      where: { isActive: true },
      relations: ['productStrategySales', 'categoryStrategySales'],
    });

    // Nếu sale hiện tại không có trong activeSales và được bật
    if (dto.isActive === true && !activeSales.some((s) => s.id === sale.id)) {
      activeSales.push({ ...sale, discountAmount: newDiscountAmount });
    }

    // Tạo map: productId -> sale có discountAmount lớn nhất
    const productSaleMap = new Map<number, { saleId: number; discountAmount: number }>();

    for (const activeSale of activeSales) {
      let saleProductIds: number[] = [];
      if (activeSale.isGlobalSale) {
        const allProducts = await this.productRepository.find({ select: ['id'] });
        saleProductIds = allProducts.map((p) => p.id);
      } else {
        saleProductIds = activeSale.productStrategySales.map((c) => c.productId); // Xóa khai báo trùng
        const saleCategoryIds = activeSale.categoryStrategySales.map((c) => c.categoryId);
        const productsInCategories = await this.productRepository.find({
          where: { category: { id: In(saleCategoryIds) } },
          select: ['id'],
        });
        saleProductIds = [...new Set([...saleProductIds, ...productsInCategories.map((p) => p.id)])];
      }

      // Cập nhật map với discountAmount lớn nhất
      for (const productId of saleProductIds) {
        const current = productSaleMap.get(productId);
        if (!current || activeSale.discountAmount > current.discountAmount) {
          productSaleMap.set(productId, {
            saleId: activeSale.id,
            discountAmount: activeSale.discountAmount,
          });
        }
      }
    }

    // Cập nhật giá cho tất cả sản phẩm
    const updatePromises: Promise<any>[] = [];
    for (const [productId, { discountAmount }] of productSaleMap) {
      updatePromises.push(
        this.productRepository.update(
          { id: productId },
          {
            finalPrice: () => `originalPrice * (1 - ${discountAmount} / 100)`,
          }
        )
      );
    }
    await Promise.all(updatePromises);

    // Đặt lại giá gốc cho sản phẩm không thuộc sale nào
    const allActiveProductIds = [...productSaleMap.keys()];
    if (allActiveProductIds.length > 0) {
      await this.productRepository
        .createQueryBuilder()
        .update()
        .set({ finalPrice: () => 'originalPrice' })
        .where('id NOT IN (:...ids)', { ids: allActiveProductIds })
        .execute();
    }
  } else if (dto.isActive === false) {
    // Sale bị tắt
    // Tính lại giá cho sản phẩm của sale này, dựa trên các sale còn lại
    const activeSales = await this.saleRepository.find({
      where: { isActive: true },
      relations: ['productStrategySales', 'categoryStrategySales'],
    });

    const productSaleMap = new Map<number, { saleId: number; discountAmount: number }>();
    for (const activeSale of activeSales) {
      let saleProductIds: number[] = [];
      if (activeSale.isGlobalSale) {
        const allProducts = await this.productRepository.find({ select: ['id'] });
        saleProductIds = allProducts.map((p) => p.id);
      } else {
        saleProductIds = activeSale.productStrategySales.map((c) => c.productId); // Xóa khai báo trùng
        const saleCategoryIds = activeSale.categoryStrategySales.map((c) => c.categoryId);
        const productsInCategories = await this.productRepository.find({
          where: { category: { id: In(saleCategoryIds) } },
          select: ['id'],
        });
        saleProductIds = [...new Set([...saleProductIds, ...productsInCategories.map((p) => p.id)])];
      }

      for (const productId of saleProductIds) {
        const current = productSaleMap.get(productId);
        if (!current || activeSale.discountAmount > current.discountAmount) {
          productSaleMap.set(productId, {
            saleId: activeSale.id,
            discountAmount: activeSale.discountAmount,
          });
        }
      }
    }

    // Cập nhật giá
    const updatePromises: Promise<any>[] = [];
    for (const [productId, { discountAmount }] of productSaleMap) {
      updatePromises.push(
        this.productRepository.update(
          { id: productId },
          {
            finalPrice: () => `originalPrice * (1 - ${discountAmount} / 100)`,
          }
        )
      );
    }
    await Promise.all(updatePromises);

    // Đặt lại giá gốc cho sản phẩm của sale này nếu không còn sale nào áp dụng
    const allActiveProductIds = [...productSaleMap.keys()];
    const resetProductIds = productIds.filter((id) => !allActiveProductIds.includes(id));
    if (resetProductIds.length > 0) {
      await this.productRepository.update(
        { id: In(resetProductIds) },
        { finalPrice: () => 'originalPrice' }
      );
    }
  }

  return sale;
}
  /**
   * Xóa chương trình giảm giá
   */
  async deleteSale(id: number): Promise<void> {
    const sale = await this.getSaleById(id);
    if (sale.isActive) {
      throw new BadRequestException('Vui lòng kết thúc chương trình giảm giá trước khi xóa.');
    }
    await this.saleRepository.remove(sale);
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
 * Lấy tất cả sản phẩm thuộc các chương trình giảm giá đang diễn ra
 */
async getSaleProducts(): Promise<Product[]> {
  // Lấy tất cả sale đang hoạt động
  const activeSales = await this.saleRepository.find({
    where: { isActive: true },
    relations: ['productStrategySales.product', 'categoryStrategySales.category'],
  });

  if (activeSales.length === 0) {
    return []; // Trả về mảng rỗng nếu không có sale
  }

  // Tạo tập hợp productId để loại trùng lặp
  const productIdSet = new Set<number>();
  const products: Product[] = [];

  for (const sale of activeSales) {
    // Lấy sản phẩm từ productStrategySales
    const productStrategySales = sale.productStrategySales || [];
    for (const ps of productStrategySales) {
      if (ps.product && !productIdSet.has(ps.product.id)) {
        productIdSet.add(ps.product.id);
        products.push(ps.product);
      }
    }

    // Lấy sản phẩm từ categoryStrategySales
    const categoryIds = (sale.categoryStrategySales || []).map((cs) => cs.category.id);
    if (categoryIds.length > 0) {
      const productsInCategories = await this.productRepository.find({
        where: { category: { id: In(categoryIds) } },
      });
      for (const product of productsInCategories) {
        if (!productIdSet.has(product.id)) {
          productIdSet.add(product.id);
          products.push(product);
        }
      }
    }

    // Lấy tất cả sản phẩm nếu isGlobalSale
    if (sale.isGlobalSale) {
      const allProducts = await this.productRepository.find();
      for (const product of allProducts) {
        if (!productIdSet.has(product.id)) {
          productIdSet.add(product.id);
          products.push(product);
        }
      }
    }
  }

  return products;
}
async getSaleCategories(): Promise<Category[]> {
  // Lấy tất cả sale đang hoạt động
  const activeSales = await this.saleRepository.find({
    where: { isActive: true },
    relations: ['categoryStrategySales.category'],
  });

  if (activeSales.length === 0) {
    return []; // Trả về mảng rỗng nếu không có sale
  }

  // Tạo tập hợp categoryId để loại trùng lặp
  const categoryIdSet = new Set<number>();
  const categories: Category[] = [];

  for (const sale of activeSales) {
    const categoryStrategySales = sale.categoryStrategySales || [];
    for (const cs of categoryStrategySales) {
      if (cs.category && !categoryIdSet.has(cs.category.id)) {
        categoryIdSet.add(cs.category.id);
        categories.push(cs.category);
      }
    }
  }

  return categories;
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
  
    const isAlreadyInThisSale = existingProductSales.some((ps) => ps.strategySaleId === saleId);
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
        { finalPrice: () => `originalPrice * (1 - ${sale.discountAmount} / 100)` }
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
  
    // 3. Xóa sản phẩm khỏi chương trình giảm giá
    await this.productStrategySaleRepository.remove(productSale);
  
    // 4. Nếu sale đang diễn ra, kiểm tra các sale khác để cập nhật giá
    if (sale.isActive) {
      // Tìm các sale khác mà sản phẩm thuộc về
      const activeSales = await this.saleRepository.find({
        where: { isActive: true },
        relations: ['productStrategySales', 'categoryStrategySales'],
      });
  
      let maxDiscountAmount = 0;
      for (const activeSale of activeSales) {
        if (activeSale.id === saleId) continue; // Bỏ qua sale vừa xóa
  
        let productInSale = false;
        if (activeSale.isGlobalSale) {
          productInSale = true;
        } else {
          const productSales = activeSale.productStrategySales || [];
          if (productSales.some((ps) => ps.productId === productId)) {
            productInSale = true;
          } else {
            const categoryIds = (activeSale.categoryStrategySales || []).map((cs) => cs.categoryId);
            if (categoryIds.length > 0) {
              const product = await this.productRepository.findOne({
                where: { id: productId, category: { id: In(categoryIds) } },
              });
              if (product) productInSale = true;
            }
          }
        }
  
        if (productInSale && activeSale.discountAmount > maxDiscountAmount) {
          maxDiscountAmount = activeSale.discountAmount;
        }
      }
  
      // Cập nhật giá sản phẩm
      await this.productRepository.update(
        { id: productId },
        {
          finalPrice: () =>
            maxDiscountAmount > 0
              ? `originalPrice * (1 - ${maxDiscountAmount} / 100)`
              : 'originalPrice',
        }
      );
    }
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

  // 3. Lấy danh sách sản phẩm thuộc danh mục này
  const products = await this.productRepository.find({
    where: { category: { id: categoryId } },
    select: ["id"],
  });

  // 4. Xóa bản ghi danh mục khỏi chương trình giảm giá
  await this.categoryStrategySaleRepository.remove(categorySale);

  if (products.length === 0) return; // Không có sản phẩm nào

  // 5. Xóa tất cả sản phẩm thuộc danh mục khỏi chương trình giảm giá
  await this.productStrategySaleRepository.delete({
    strategySale: { id: saleId },
    product: { id: In(products.map((p) => p.id)) },
  });

  // 6. Nếu sale đang diễn ra, kiểm tra các sale khác để cập nhật giá
  if (sale.isActive) {
    const activeSales = await this.saleRepository.find({
      where: { isActive: true },
      relations: ['productStrategySales', 'categoryStrategySales'],
    });

    const productIds = products.map((p) => p.id);
    const productPriceMap = new Map<number, number>(); // productId -> maxDiscountAmount

    for (const productId of productIds) {
      let maxDiscountAmount = 0;
      for (const activeSale of activeSales) {
        if (activeSale.id === saleId) continue; // Bỏ qua sale vừa xóa

        let productInSale = false;
        if (activeSale.isGlobalSale) {
          productInSale = true;
        } else {
          const productSales = activeSale.productStrategySales || [];
          if (productSales.some((ps) => ps.productId === productId)) {
            productInSale = true;
          } else {
            const categoryIds = (activeSale.categoryStrategySales || []).map((cs) => cs.categoryId);
            if (categoryIds.length > 0) {
              const product = await this.productRepository.findOne({
                where: { id: productId, category: { id: In(categoryIds) } },
              });
              if (product) productInSale = true;
            }
          }
        }

        if (productInSale && activeSale.discountAmount > maxDiscountAmount) {
          maxDiscountAmount = activeSale.discountAmount;
        }
      }
      productPriceMap.set(productId, maxDiscountAmount);
    }

    // Cập nhật giá sản phẩm
    const updatePromises: Promise<any>[] = [];
    for (const [productId, maxDiscountAmount] of productPriceMap) {
      updatePromises.push(
        this.productRepository.update(
          { id: productId },
          {
            finalPrice: () =>
              maxDiscountAmount > 0
                ? `originalPrice * (1 - ${maxDiscountAmount} / 100)`
                : 'originalPrice',
          }
        )
      );
    }
    await Promise.all(updatePromises);
  }
}
async getProductIdsOfSale(saleId: number): Promise<number[]> {
  // Lấy sale và các quan hệ
  const sale = await this.saleRepository.findOne({
    where: { id: saleId },
    relations: ['productStrategySales', 'categoryStrategySales'],
  });
  if (!sale) throw new NotFoundException('Sale không tồn tại.');

  let productIds: number[] = [];

  // Nếu là global sale, lấy tất cả sản phẩm
  if (sale.isGlobalSale) {
    const allProducts = await this.productRepository.find({ select: ['id'] });
    productIds = allProducts.map(p => p.id);
  } else {
    // Lấy productId trực tiếp
    const directProductIds = sale.productStrategySales?.map(ps => ps.productId) || [];

    // Lấy productId qua danh mục
    const categoryIds = sale.categoryStrategySales?.map(cs => cs.categoryId) || [];
    let categoryProductIds: number[] = [];
    if (categoryIds.length > 0) {
      const productsInCategories = await this.productRepository.find({
        where: { category: { id: In(categoryIds) } },
        select: ['id'],
      });
      categoryProductIds = productsInCategories.map(p => p.id);
    }

    productIds = [...directProductIds, ...categoryProductIds];
  }

  // Loại trùng
  return Array.from(new Set(productIds));
}
async notifyUsersForSale(saleId: number) {
  const productIds = await this.getProductIdsOfSale(saleId);
  const wishlists = await this.wishlistRepo.find({
    where: { productDetail: { product: { id: In(productIds) } } },
    relations: ['user', 'productDetail', 'productDetail.product'],
  });

  // Gom theo user (userId là UUID string)
  const userWishlistMap = new Map<string, Wishlist[]>();
  for (const w of wishlists) {
    const userId = w.user.id; // giữ nguyên là string
    if (!userWishlistMap.has(userId)) userWishlistMap.set(userId, []);
    userWishlistMap.get(userId)?.push(w);
  }

  for (const [userId, items] of userWishlistMap.entries()) {
    // Không cần kiểm tra log, admin chủ động gửi
    await this.mailService.sendSaleMail(
      userId,
      items.map(i => i.productDetail.product),
      saleId
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
  