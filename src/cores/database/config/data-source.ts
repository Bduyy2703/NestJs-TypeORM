import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../../modules/users/entities/user.entity';
import { Role } from '../../../modules/role/entities/t_role';
import { Blog } from '../../../modules/blogs/entities/blog.entity';
import { Notification } from '../../../modules/notification/entities/notification.entity';
import { Object_entity } from '../../../modules/object/entities/object.entity';
import { Profile } from '../../../modules/profile/entities/profile.entity';
import { Right } from '../../../modules/right/entities/t_right';
import { RightObject } from '../../../modules/right_object/entities/t_right_object';
import { RoleRight } from '../../../modules/role_right/entities/t_role_right';
import { Token } from '../../../modules/token/entities/token.entity';
import { File } from 'src/modules/files/file.entity';
import { Address } from 'src/modules/address/entity/address.entity';
import { Category } from 'src/modules/category/entity/category.entity';
import { Product } from 'src/modules/product/entity/product.entity';
import { Inventory } from 'src/modules/inventory/entity/inventory.entity';
import { ProductDetails } from 'src/modules/product-details/entity/productDetail.entity';
import { Discount } from 'src/modules/discount/entity/discount.entity';
import { StrategySale } from 'src/modules/strategySale/entity/strategySale.entity';
import { Cart } from 'src/modules/cart/entity/cart.entity';
import { CartItem } from 'src/modules/cart/entity/cartItem.entity';
import { ProductStrategySale } from 'src/modules/strategySale/entity/productSale.entity';
import { CategoryStrategySale } from 'src/modules/strategySale/entity/categorySale.entity';
import { InvoiceItem } from 'src/modules/invoice/entity/invoiceItem.entity';
import { Invoice } from 'src/modules/invoice/entity/invoice.entity';

// Tự động chọn file môi trường dựa trên NODE_ENV
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.development' });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL, // Ưu tiên dùng DATABASE_URL
  host: process.env.DATABASE_URL ? undefined : process.env.DEV_DB_HOST,
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DEV_DB_PORT, 10),
  username: process.env.DATABASE_URL ? undefined : (process.env.DEV_DB_USERNAME || 'postgres'),
  password: process.env.DATABASE_URL ? undefined : process.env.DEV_DB_PASSWORD,
  database: process.env.DATABASE_URL ? undefined : process.env.DEV_DB_DATABASE,
  entities: [
    Invoice,InvoiceItem,Cart, CartItem, StrategySale, ProductStrategySale, CategoryStrategySale,
    Discount, ProductDetails, Inventory, Product, Category, Address, User,
    Role, Blog, Notification, Object_entity, Profile, Right, RightObject,
    RoleRight, Token, File,
  ],
  migrations: process.env.NODE_ENV === 'production' ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});

AppDataSource.initialize()
  .then(() => console.log("Data Source initialized!"))
  .catch((err) => console.error("Error during Data Source initialization:", err));

export default AppDataSource;