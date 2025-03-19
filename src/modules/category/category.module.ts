import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Product } from '../product/entity/product.entity';
import { File } from '../files/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category,Product,File])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
