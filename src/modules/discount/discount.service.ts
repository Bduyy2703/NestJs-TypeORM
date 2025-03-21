import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Discount } from "./entity/discount.entity";
import { CreateDiscountDto, UpdateDiscountDto } from "./dto/discount.dto";
import { ApplyDiscountDto } from "./dto/apply-discount.dto";

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

  async applyDiscount(dto: ApplyDiscountDto) {
    const { discountCode, totalPrice } = dto;
  
    const discount = await this.discountRepository.findOne({ where: { name: discountCode } });
    if (!discount) {
      throw new NotFoundException("Mã giảm giá không tồn tại");
    }

    if (!discount.isActive) {
      throw new BadRequestException("Mã giảm giá không khả dụng");
    }
  
    if (discount.quantity <= 0) {
      throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
    }
  
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      throw new BadRequestException("Mã giảm giá chưa được kích hoạt");
    }
    if (discount.endDate && now > discount.endDate) {
      throw new BadRequestException("Mã giảm giá đã hết hạn");
    }
  
    if (discount.condition) {
      const minOrderValue = parseFloat(discount.condition.match(/\d+/)?.[0] || "0"); // Lấy số trong chuỗi điều kiện
      if (totalPrice < minOrderValue) {
        throw new BadRequestException(`Mã giảm giá chỉ áp dụng cho đơn hàng từ ${minOrderValue} VND trở lên`);
      }
    }
  
    let discountAmount = 0;
    if (discount.discountType === "PERCENTAGE") {
      discountAmount = (totalPrice * discount.discountValue) / 100;
    } else {
      discountAmount = discount.discountValue;
    }
  
    discountAmount = Math.min(discountAmount, totalPrice);

    const finalPrice = totalPrice - discountAmount;
  
    discount.quantity -= 1;
    await this.discountRepository.save(discount);
  
    return {
      originalPrice: totalPrice,
      discountAmount,
      finalPrice,
      message: `Áp dụng mã giảm giá thành công!`,
    };
  }
  
}
