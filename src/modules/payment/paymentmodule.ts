import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentService } from "./paymentservice";
import { PaymentController } from "./paymentcontroller";
import { VnpayService } from "./service/vnpay.service";
import { Discount } from "../discount/entity/discount.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { Address } from "../address/entity/address.entity";
import { User } from "../users/entities/user.entity";
import { Invoice } from "../invoice/entity/invoice.entity";
import { InvoiceItem } from "../invoice/entity/invoiceItem.entity";
import { CartModule } from "../cart/cart.module";
import { InvoiceDiscount } from "../invoice/entity/invoice-discount.entity";
import { NotificationModule } from "../notification/notification.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Discount, ProductDetails, Address, User, Invoice, InvoiceItem ,InvoiceDiscount]),
        CartModule,
        NotificationModule,
    ],
    providers: [PaymentService, VnpayService ],
    controllers: [PaymentController],
})
export class PaymentModule {}