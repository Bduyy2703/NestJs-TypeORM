import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductColor, ProductDetails, ProductMaterial, ProductSize } from "./entity/productDetail.entity";
import { CreateProductDetailsDto, UpdateProductDetailsDto } from "./dto/create-update.dto";
import { Product } from "../product/entity/product.entity";
import { File } from "../files/file.entity"; // Import bảng File
import { Inventory } from "../inventory/entity/inventory.entity";

@Injectable()
export class ProductDetailsService {
  constructor(
    @InjectRepository(ProductDetails)
    private readonly productDetailsRepository: Repository<ProductDetails>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,

    @InjectRepository(File) // Inject bảng File
    private readonly fileRepository: Repository<File>
  ) {}

  async create(productId: number, createDto: CreateProductDetailsDto) {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    
    let inventory = null;
    if (createDto.inventoryId) {
      inventory = await this.inventoryRepository.findOne({ where: { id: createDto.inventoryId } });
      if (!inventory) {
        throw new NotFoundException("Inventory not found");
      }
    }

    // Kiểm tra xem giá trị có hợp lệ không
    if (!Object.values(ProductSize).includes(createDto.size as ProductSize)) {
      throw new Error("Invalid size value");
    }
  
    if (!Object.values(ProductColor).includes(createDto.color as ProductColor)) {
      throw new Error("Invalid color value");
    }
  
    if (!Object.values(ProductMaterial).includes(createDto.material as ProductMaterial)) {
      throw new Error("Invalid material value");
    }

    const productDetails = this.productDetailsRepository.create({
      ...createDto,
      size: createDto.size as ProductSize,
      color: createDto.color as ProductColor,
      material: createDto.material as ProductMaterial,
      product,
      inventory,
    });
  
    return this.productDetailsRepository.save(productDetails);
  }
  

  async findAll(productId: number) {
    const productDetails = await this.productDetailsRepository.find({
      where: { product: { id: productId } },
      relations: ["product"], // Lấy thông tin product
    });

    // Lấy ảnh từ bảng File theo targetId = productId, targetType = 'product'
    const images = await this.fileRepository.find({
      where: { targetId: productId, targetType: "product" },
    });

    return productDetails.map((detail) => ({
      ...detail,
      images, // Gán thêm ảnh lấy từ bảng File
    }));
  }

  async findOne(id: number) {
    const productDetails = await this.productDetailsRepository.findOne({
      where: { id },
      relations: ["product"], // Lấy thông tin product
    });

    if (!productDetails) {
      throw new NotFoundException("ProductDetails not found");
    }

    // Lấy ảnh từ bảng File theo targetId = productId, targetType = 'product'
    const images = await this.fileRepository.find({
      where: { targetId: productDetails.product.id, targetType: "product" },
    });

    return {
      ...productDetails,
      images, // Gán thêm ảnh lấy từ bảng File
    };
  }
  
  async update(id: number, updateDto: UpdateProductDetailsDto) {
    const productDetails = await this.findOne(id);
    
    let inventory = productDetails.inventory;

    if (updateDto.inventoryId) {
        const foundInventory = await this.inventoryRepository.findOne({ where: { id: updateDto.inventoryId } });

        if (!foundInventory) {
            throw new Error(`Inventory with ID ${updateDto.inventoryId} not found`);
        }
        
        inventory = foundInventory;
    }

    const updatedData = {
        ...updateDto,
        size: updateDto.size as ProductSize,
        color: updateDto.color as ProductColor,
        material: updateDto.material as ProductMaterial,
        inventory,
    };

    await this.productDetailsRepository.save({ ...productDetails, ...updatedData });
    return this.findOne(id);
}

  async remove(id: number) {
    const productDetails = await this.findOne(id);
    return this.productDetailsRepository.remove(productDetails);
  }
}
