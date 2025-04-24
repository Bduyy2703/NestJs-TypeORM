import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/user.module';
import { DatabaseModule } from './cores/database/config/postgres.config';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { MailService } from './modules/mail/mail.service';
import { TokenModule } from './modules/token/token.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt.auth.guard';
import { RolesGuard } from './modules/auth/guards/role.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BlogsModule } from './modules/blogs/blog.module';
import { ProfilesModule } from './modules/profile/profile.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RoleModule } from './modules/role/role.module';
import { ObjectModule } from './modules/object/object.module';
import { RightModule } from './modules/right/right.module';
import { RightObjectModule } from './modules/right_object/right_object.module';
import { RoleRightModule } from './modules/role_right/role_right.module';
import { PermissionModule } from './modules/permission/permission.module';
import { MinioModule } from './modules/files/minio/minio.module';
import 'reflect-metadata';
import { AddressModule } from './modules/address/address.module';
import { CategoryModule } from './modules/category/category.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DiscountModule } from './modules/discount/discount.module';
import { ProductModule } from './modules/product/product.module';
import { ProductDetailsModule } from './modules/product-details/product.module';
import { CartModule } from './modules/cart/cart.module';
import { SaleStrategyModule } from './modules/strategySale/sale.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { PaymentModule } from './modules/payment/paymentmodule';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { ReviewModule } from './modules/review/review.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/users/entities/user.entity';
import { StrategySale } from './modules/strategySale/entity/strategySale.entity';
@Module({
  imports: [
    AuthModule,
    UsersModule,
    BlogsModule,
    DatabaseModule,
    TokenModule,
    MailModule,
    ProfilesModule,
    NotificationModule,
    RoleModule,
    ObjectModule,
    RightModule,
    RightObjectModule,
    RoleRightModule,
    PermissionModule,
    EventEmitterModule.forRoot(),
    MinioModule,
    AddressModule,
    CategoryModule,
    InventoryModule,
    DiscountModule,
    ProductModule,
    ProductDetailsModule,
    CartModule,
    SaleStrategyModule,
    ShippingModule,
    PaymentModule,
    InvoiceModule,
    ReviewModule,
    NotificationModule,
    WishlistModule,
    TypeOrmModule.forFeature([User, StrategySale]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MailService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
