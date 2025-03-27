import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import { Cart } from "./entity/cart.entity";
import { CartItem } from "./entity/cartItem.entity";
import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";
import { User } from "src/modules/users/entities/user.entity";
import { File } from "../files/file.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, ProductDetails, User,File])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
