import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice } from "./entity/invoice.entity";
import { InvoiceItem } from "./entity/invoiceItem.entity";
import { InvoiceService } from "./invoice.service";
import { InvoiceController } from "./invoice.controller";
import { User } from "../users/entities/user.entity";
import { Address } from "../address/entity/address.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, User, Address, ProductDetails])],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
