import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Discount } from "./entity/discount.entity";
import { DiscountService } from "./discount.service";
import { DiscountController } from "./discount.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Discount])],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService], // Xuất để có thể sử dụng ở giỏ hàng
})
export class DiscountModule {}
