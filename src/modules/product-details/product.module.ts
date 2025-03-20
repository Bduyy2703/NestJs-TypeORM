import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductDetails } from './entity/productDetail.entity';
import { ProductDetailsService } from './product.service';
import { ProductDetailsController } from './product-details.controller';
import { Product } from 'src/modules/product/entity/product.entity';
import { Inventory } from 'src/modules/inventory/entity/inventory.entity';
import { File } from '../files/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductDetails, Product, Inventory , File])],
  controllers: [ProductDetailsController],
  providers: [ProductDetailsService],
  exports: [ProductDetailsService], 
})
export class ProductDetailsModule {}
