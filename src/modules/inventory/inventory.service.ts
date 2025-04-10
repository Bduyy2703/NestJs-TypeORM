import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inventory } from "./entity/inventory.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { File } from "../files/file.entity";

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,

    @InjectRepository(ProductDetails)
    private readonly productDetailsRepository: Repository<ProductDetails>,

    @InjectRepository(File)
    private readonly fileRepository: Repository<File>
  ) {}

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      relations: ["productDetails"],
    });
  }

  async findById(id: number): Promise<{
    inventory: Inventory;
    productImagesMap: Record<number, File[]>;
  }> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ["productDetails", "productDetails.product"],
    });

    if (!inventory) throw new NotFoundException("Không tìm thấy kho");

    const productImagesMap: Record<number, File[]> = {};

    for (const detail of inventory.productDetails) {
      const product = detail.product;
      if (product && !productImagesMap[product.id]) {
        const images = await this.fileRepository.find({
          where: {
            targetId: product.id,
            targetType: "product",
          },
        });
        productImagesMap[product.id] = images;
      }
    }

    return { inventory, productImagesMap };
  }

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const newInventory = this.inventoryRepository.create(createInventoryDto);
    return this.inventoryRepository.save(newInventory);
  }

  async update(
    id: number,
    updateInventoryDto: UpdateInventoryDto
  ): Promise<Inventory> {
    const existing = await this.inventoryRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException("Không tìm thấy kho");

    await this.inventoryRepository.update(id, updateInventoryDto);
    return this.inventoryRepository.findOne({
      where: { id },
      relations: ["productDetails"],
    });
  }

  async delete(id: number): Promise<void> {
    const existing = await this.inventoryRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException("Không tìm thấy kho");

    await this.inventoryRepository.delete(id);
  }

  async updateStock(idDetails: number, quantity: number) {
    const productDetail = await this.productDetailsRepository.findOne({
      where: { id: idDetails },
    });

    if (!productDetail) {
      throw new NotFoundException("Không tìm thấy chi tiết sản phẩm");
    }

    if (quantity < 0 && productDetail.stock + quantity < 0) {
      throw new BadRequestException("Số lượng trong kho không đủ để xuất");
    }

    productDetail.stock += quantity;

    if (quantity < 0) {
      productDetail.sold += Math.abs(quantity);
    }

    await this.productDetailsRepository.save(productDetail);
    return productDetail;
  }
}
