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
import { ProductDetails } from 'src/modules/product/entity/productDetail.entity';
import { Discount } from 'src/modules/discount/entity/discount.entity';
import { StrategySale } from 'src/modules/strategySale/entity/strategySale.entity';

dotenv.config({ path: '.env.development' }); 

 const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DEV_DB_HOST,
    port: parseInt(process.env.DEV_DB_PORT, 10), 
    username: process.env.DEV_DB_USERNAME || 'postgres',
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_DATABASE,
    entities: [StrategySale,Discount,ProductDetails,Inventory,Product,Category,Address,User,Role,Blog,Notification,Object_entity,Profile,Right,RightObject,RoleRight,Token,File],
    migrations: ["src/migrations/*.ts"], 
    synchronize: true,
    logging: false,
});
AppDataSource.initialize()
    .then(() => console.log("Data Source initialized!"))
    .catch((err) => console.error("Error during Data Source initialization:", err));

export default AppDataSource;

// dropDB
//ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js migration:revert -d src/cores/database/config/data-source.ts
//run
// ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/migrations/InitMigration --dataSource src/cores/database/config/data-source.ts