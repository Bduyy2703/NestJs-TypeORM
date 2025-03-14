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

    // Tìm mã giảm giá
    const discount = await this.discountRepository.findOne({ where: { name: discountCode } });
    if (!discount) {
      throw new NotFoundException("Mã giảm giá không tồn tại");
    }

    // Kiểm tra số lượng mã giảm giá còn lại
    if (discount.quantity <= 0) {
      throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
    }

    // Kiểm tra thời hạn mã giảm giá
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      throw new BadRequestException("Mã giảm giá chưa được kích hoạt");
    }
    if (discount.endDate && now > discount.endDate) {
      throw new BadRequestException("Mã giảm giá đã hết hạn");
    }

    // Kiểm tra điều kiện áp dụng (nếu có)
    if (discount.condition) {
      const minOrderValue = parseFloat(discount.condition.match(/\d+/)?.[0] || "0"); // Lấy số trong chuỗi điều kiện
      if (totalPrice < minOrderValue) {
        throw new BadRequestException(`Mã giảm giá chỉ áp dụng cho đơn hàng từ ${minOrderValue} VND trở lên`);
      }
    }

    // Tính toán giá trị giảm
    let discountAmount = 0;
    if (discount.discountType === "PERCENTAGE") {
      discountAmount = (totalPrice * discount.discountValue) / 100;
    } else {
      discountAmount = discount.discountValue;
    }

    // Đảm bảo không giảm quá giá trị đơn hàng
    discountAmount = Math.min(discountAmount, totalPrice);

    // Tính giá sau khi giảm
    const finalPrice = totalPrice - discountAmount;

    return {
      originalPrice: totalPrice,
      discountAmount,
      finalPrice,
      message: `Áp dụng mã giảm giá thành công!`,
    };
  }
}
