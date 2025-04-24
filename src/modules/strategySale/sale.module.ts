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
import { MailModule } from "../mail/mail.module";
import { Wishlist } from "../wishlist/entity/wishlist.entity";
import { MailSaleCronjob } from "../mail/cronjobmail/mail-sale-cronjob";
import { SaleMailLog } from "../mail/sale-mail-log";

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Product, Category, StrategySale , ProductStrategySale,CategoryStrategySale,Wishlist,SaleMailLog]),
        MailModule,
        
    ],
    controllers: [SaleStrategyController],
    providers: [SaleStrategyService,SaleSchedulerService,MailSaleCronjob],
    exports: [SaleStrategyService],
})
export class SaleStrategyModule { }
