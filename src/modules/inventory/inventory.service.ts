import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inventory } from "./entity/inventory.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>
  ) {}

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({ relations: ["products"] });
  }

  async findById(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ["products"],
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
}
