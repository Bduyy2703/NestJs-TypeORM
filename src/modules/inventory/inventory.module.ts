import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Inventory } from "./entity/inventory.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { InventoryService } from "./inventory.service";
import { InventoryController } from "./inventory.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, ProductDetails])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService], 
})
export class InventoryModule {}
