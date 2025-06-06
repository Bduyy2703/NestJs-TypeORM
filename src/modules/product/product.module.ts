import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './entity/product.entity';
import { MinioService } from '../files/minio/minio.service';
import { FileRepository } from '../files/file.repository';
import { File } from '../files/file.entity';
import { Category } from '../category/entity/category.entity';
import { ProductDetails } from '../product-details/entity/productDetail.entity';
import { ProductStrategySale } from '../strategySale/entity/productSale.entity';
import { StrategySale } from '../strategySale/entity/strategySale.entity';
import { ElasticsearchModule } from 'src/elastic_search/elastic_search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, File, Category, ProductStrategySale, StrategySale,  ProductDetails]),
    ElasticsearchModule,
  ],
  controllers: [ProductsController],
  providers: [ProductService, MinioService, FileRepository],
  exports: [ProductService],
})
export class ProductModule {}