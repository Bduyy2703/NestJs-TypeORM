import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Discount } from "./entity/discount.entity";
import { CreateDiscountDto, UpdateDiscountDto } from "./dto/discount.dto";

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private discountRepository: Repository<Discount>
  ) {}

  async create(dto: CreateDiscountDto): Promise<Discount> {
    const discount = this.discountRepository.create(dto);
    return await this.discountRepository.save(discount);
  }

  async findAll(): Promise<Discount[]> {
    return await this.discountRepository.find();
  }

  async findOne(id: number): Promise<Discount> {
    const discount = await this.discountRepository.findOne({ where: { id } });
    if (!discount) {
      throw new NotFoundException(`Không tìm thấy mã giảm giá với ID: ${id}`);
    }
    return discount;
  }

  async update(id: number, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.findOne(id);
    Object.assign(discount, dto);
    return await this.discountRepository.save(discount);
  }

  async remove(id: number): Promise<{ message: string }> {
    const discount = await this.findOne(id);
    await this.discountRepository.remove(discount);
    return { message: "Mã giảm giá đã được xóa thành công" };
  }

}
