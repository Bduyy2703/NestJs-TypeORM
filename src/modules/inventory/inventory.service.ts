import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inventory } from "./entity/inventory.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { ProductDetails } from "../product-details/entity/productDetail.entity";

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(ProductDetails)
    private readonly productDetailsRepository: Repository<ProductDetails>
  ) { }

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({ relations: ["productDetails"] });
  }

  async findById(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ["productDetails"],
    });
    if (!inventory) throw new NotFoundException("Không tìm thấy kho");
    return inventory;
  }

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const newInventory = this.inventoryRepository.create(createInventoryDto);
    return this.inventoryRepository.save(newInventory);
  }

  async update(id: number, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    await this.findById(id); 
    await this.inventoryRepository.update(id, updateInventoryDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
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
