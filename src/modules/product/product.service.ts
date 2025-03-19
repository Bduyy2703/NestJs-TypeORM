import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "./entity/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { Inventory } from "src/modules/inventory/entity/inventory.entity";
import { Category } from "src/modules/category/entity/category.entity";
import { StrategySale } from "src/modules/strategySale/entity/strategySale.entity";
import { ProductDetails } from "./entity/productDetail.entity";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory) private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(StrategySale) private readonly strategySaleRepository: Repository<StrategySale>,
    @InjectRepository(ProductDetails) private readonly productDetailsRepository: Repository<ProductDetails>
  ) { }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, inventoryId, strategySaleId, productDetails, ...productData } = createProductDto;

    const inventory = await this.inventoryRepository.findOne({ where: { id: inventoryId } });
    if (!inventory) throw new NotFoundException("Kho hàng không tồn tại!");

    let category = null;
    if (categoryId) {
      category = await this.categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) throw new NotFoundException("Danh mục không tồn tại!");
    }

    let strategySale = null;
    if (strategySaleId) {
      strategySale = await this.strategySaleRepository.findOne({ where: { id: strategySaleId } });
      if (!strategySale) throw new NotFoundException("Chiến lược giảm giá không tồn tại!");
    }

    const product = this.productRepository.create({
      ...productData,
      category: category || undefined,
      inventory,
      strategySale: strategySale || undefined,
    });
    await this.productRepository.save(product);


    if (productDetails && productDetails.length > 0) {
      const productDetailsEntities = productDetails.map((detail) =>
        this.productDetailsRepository.create({
          ...detail,
          product,
        })
      );
      await this.productDetailsRepository.save(productDetailsEntities);
      product.productDetails = productDetailsEntities
      await this.productRepository.save(product)
    }

    return product;
  }
}
