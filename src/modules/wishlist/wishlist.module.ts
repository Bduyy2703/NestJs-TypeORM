import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './entity/wishlist.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { ProductDetails } from '../product-details/entity/productDetail.entity';import { File } from '../files/file.entity';
 ;

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, ProductDetails,File])],
  providers: [WishlistService],
  controllers: [WishlistController],
})
export class WishlistModule {}