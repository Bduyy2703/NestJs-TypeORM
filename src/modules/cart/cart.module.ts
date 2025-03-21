import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import { Cart } from "./entity/cart.entity";
import { CartItem } from "./entity/cartItem.entity";
import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";
import { User } from "src/modules/users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, ProductDetails, User])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
