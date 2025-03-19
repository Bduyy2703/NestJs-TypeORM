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
    await this.findById(id); // Kiểm tra tồn tại
    await this.inventoryRepository.update(id, updateInventoryDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.findById(id); // Kiểm tra tồn tại
    await this.inventoryRepository.delete(id);
  }
  // Nhập hàng vào kho
  async addStock(productDetailId: number, quantity: number) {
    const productDetail = await this.productDetailsRepository.findOne({
      where: { id: productDetailId },
      relations: ['inventory'], // Lấy thông tin kho
    });

    if (!productDetail) throw new NotFoundException("Không tìm thấy sản phẩm trong kho");

    productDetail.stock += quantity; // Cập nhật số lượng sản phẩm

    await this.productDetailsRepository.save(productDetail);

    return { message: "Nhập hàng thành công", stock: productDetail.stock };
  }

  // Xuất hàng khỏi kho
  async removeStock(productDetailId: number, quantity: number) {
    const productDetail = await this.productDetailsRepository.findOne({
      where: { id: productDetailId },
      relations: ['inventory'],
    });

    if (!productDetail) throw new NotFoundException("Không tìm thấy sản phẩm trong kho");

    if (productDetail.stock < quantity) throw new BadRequestException("Số lượng không đủ để xuất");

    productDetail.stock -= quantity; // Giảm số lượng hàng tồn

    await this.productDetailsRepository.save(productDetail);

    return { message: "Xuất hàng thành công", stock: productDetail.stock };
  }

  // Lấy số lượng tồn kho
  async getStock(productDetailId: number) {
    const productDetail = await this.productDetailsRepository.findOne({
      where: { id: productDetailId },
    });

    if (!productDetail) throw new NotFoundException("Không tìm thấy sản phẩm trong kho");

    return { productDetailId, stock: productDetail.stock };
  }
}
