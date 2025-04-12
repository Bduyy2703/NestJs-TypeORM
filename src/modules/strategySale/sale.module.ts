import { Module } from "@nestjs/common";
import { SaleStrategyController } from "./sale.controller";
import { SaleStrategyService } from "./sale.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "../product/entity/product.entity";
import { Category } from "../category/entity/category.entity";
import { StrategySale } from "./entity/strategySale.entity";
import { ProductStrategySale } from './entity/productSale.entity';
import { CategoryStrategySale } from "./entity/categorySale.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { SaleSchedulerService } from "src/cores/middlewares/middlewares.schedule";

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Product, Category, StrategySale , ProductStrategySale,CategoryStrategySale]),
    ],
    controllers: [SaleStrategyController],
    providers: [SaleStrategyService,SaleSchedulerService],
    exports: [SaleStrategyService],
})
export class SaleStrategyModule { }
