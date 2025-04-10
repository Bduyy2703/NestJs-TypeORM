import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";
import { Inventory } from "./entity/inventory.entity";
import { Product } from "../product/entity/product.entity";
import { File } from "../files/file.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, ProductDetails,Product,File])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], 
})
export class InventoryModule {}
