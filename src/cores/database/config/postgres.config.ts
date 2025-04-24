import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../../modules/users/entities/user.entity';
import { Role } from 'src/modules/role/entities/t_role';
import { Blog } from 'src/modules/blogs/entities/blog.entity';
import { Notification } from 'src/modules/notification/entities/notification.entity';
import { Object_entity } from 'src/modules/object/entities/object.entity';
import { Profile } from 'src/modules/profile/entities/profile.entity';
import { Right } from 'src/modules/right/entities/t_right';
import { RightObject } from 'src/modules/right_object/entities/t_right_object';
import { RoleRight } from 'src/modules/role_right/entities/t_role_right';
import { Token } from 'src/modules/token/entities/token.entity';
import { File } from 'src/modules/files/file.entity';
import { Address } from 'src/modules/address/entity/address.entity';
import { Category } from 'src/modules/category/entity/category.entity';
import { Product } from 'src/modules/product/entity/product.entity';
import { Inventory } from 'src/modules/inventory/entity/inventory.entity';
import { ProductDetails } from 'src/modules/product-details/entity/productDetail.entity';
import { Discount } from 'src/modules/discount/entity/discount.entity';
import { StrategySale } from 'src/modules/strategySale/entity/strategySale.entity';
import { Cart } from '../../../modules/cart/entity/cart.entity';
import { CartItem } from 'src/modules/cart/entity/cartItem.entity';
import { ProductStrategySale } from 'src/modules/strategySale/entity/productSale.entity';
import { CategoryStrategySale } from 'src/modules/strategySale/entity/categorySale.entity';
import { Invoice } from 'src/modules/invoice/entity/invoice.entity';
import { InvoiceItem } from 'src/modules/invoice/entity/invoiceItem.entity';
import { InvoiceDiscount } from 'src/modules/invoice/entity/invoice-discount.entity';
import { Review } from 'src/modules/review/entity/review.entity';
import { Wishlist } from 'src/modules/wishlist/entity/wishlist.entity';

@Module({
  imports: [
    // ConfigModule đảm bảo biến môi trường được nạp trước
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.development',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        // Nếu có DATABASE_URL, sử dụng nó
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              Wishlist,Review,InvoiceDiscount,Invoice,InvoiceItem,Cart, CartItem, StrategySale, ProductStrategySale, CategoryStrategySale,
              Discount, ProductDetails, Inventory, Product, Category, Address, User,
              Role, Blog, Notification, Object_entity, Profile, Right, RightObject,
              RoleRight, Token, File,
            ],
            migrations: ["../migrations/*.ts"],
            synchronize: true, // Chỉ nên dùng trong development, tắt trong production
            retryAttempts: 5,
            retryDelay: 3000,
          };
        }

        // Nếu không có DATABASE_URL, dùng các biến DEV_DB_*
        return {
          type: 'postgres',
          host: configService.get<string>('DEV_DB_HOST'),
          port: configService.get<number>('DEV_DB_PORT'),
          username: configService.get<string>('DEV_DB_USERNAME', 'postgres'),
          password: configService.get<string>('DEV_DB_PASSWORD'),
          database: configService.get<string>('DEV_DB_DATABASE'),
          entities: [
            InvoiceItem,Invoice,Cart, CartItem, StrategySale, ProductStrategySale, CategoryStrategySale,
            Discount, ProductDetails, Inventory, Product, Category, Address, User,
            Role, Blog, Notification, Object_entity, Profile, Right, RightObject,
            RoleRight, Token, File,
          ],
          migrations: process.env.NODE_ENV === 'production' ? ['dist/migrations/*.js'] : ['../migrations/*.ts'],
          synchronize: process.env.NODE_ENV !== 'production', // Tắt synchronize trong production
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}