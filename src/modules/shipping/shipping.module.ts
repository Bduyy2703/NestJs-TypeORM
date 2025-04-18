import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ShippingService } from "./shipping.service";
import { ShippingController } from "./shipping.controller";
import { Discount } from "../discount/entity/discount.entity"; // Giả định entity Discount đã có
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { Address } from "../address/entity/address.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Discount,ProductDetails , Address])], // Import entity Discount
  controllers: [ShippingController],
  providers: [ShippingService],
})
export class ShippingModule {}