import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entity/product.entity';
import { MinioService } from '../files/minio/minio.service';
import { FileRepository } from '../files/file.repository';
import { File } from '../files/file.entity';
import { Inventory } from '../inventory/entity/inventory.entity';
import { Category } from '../category/entity/category.entity';
import { StrategySale } from '../strategySale/entity/strategySale.entity';
import { ProductDetails } from './entity/productDetail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, File, Inventory, Category, StrategySale, ProductDetails]),
  ],
  controllers: [ProductsController],
  providers: [ProductService, MinioService, FileRepository],
  exports: [ProductService],
})
export class ProductModule {}