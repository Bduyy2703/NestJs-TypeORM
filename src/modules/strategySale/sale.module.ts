import { Module } from "@nestjs/common";
import { SaleStrategyController } from "./sale.controller";
import { SaleStrategyService } from "./sale.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "../product/entity/product.entity";
import { Category } from "../category/entity/category.entity";
import { StrategySale } from "./entity/strategySale.entity";
import { ProductStrategySale } from './entity/productSale.entity';
import { CategoryStrategySale } from "./entity/categorySale.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Category, StrategySale , ProductStrategySale,CategoryStrategySale]),
    ],
    controllers: [SaleStrategyController],
    providers: [SaleStrategyService],
    exports: [SaleStrategyService],
})
export class SaleStrategyModule { }
