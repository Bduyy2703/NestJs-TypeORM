import { Module } from "@nestjs/common";
import { SaleStrategyController } from "./sale.controller";
import { SaleStrategyService } from "./sale.service";

@Module({
  controllers: [SaleStrategyController],
  providers: [SaleStrategyService],
  exports: [SaleStrategyService],
})
export class SaleStrategyModule {}
