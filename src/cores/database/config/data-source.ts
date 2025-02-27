import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv'; 
import { User } from '../../../modules/users/entities/user.entity'; 
import { Role } from '../../../modules/role/entities/t_role';
import { Blog } from '../../../modules/blogs/entities/blog.entity';
import { CommentsOnBlogs } from '../../../modules/comment-on-blog/entities/commentOnBlog.entity';
import { Comment } from '../../../modules/comment/entities/comment.entity';
import { Notification } from '../../../modules/notification/entities/notification.entity';
import { Object_entity } from '../../../modules/object/entities/object.entity';
import { Profile } from '../../../modules/profile/entities/profile.entity';
import { Right } from '../../../modules/right/entities/t_right';
import { RightObject } from '../../../modules/right_object/entities/t_right_object';
import { RoleRight } from '../../../modules/role_right/entities/t_role_right';
import { Token } from '../../../modules/token/entities/token.entity';
import { File } from 'src/modules/files/file.entity';

dotenv.config({ path: '.env.development' }); 

 const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DEV_DB_HOST,
    port: parseInt(process.env.DEV_DB_PORT, 10), 
    username: process.env.DEV_DB_USERNAME || 'postgres',
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_DATABASE,
    entities: [User,Role,Blog,Comment,CommentsOnBlogs,Notification,Object_entity,Profile,Right,RightObject,RoleRight,Token,File],
    migrations: ["src/migrations/*.ts"], 
    synchronize: true,
    logging: false,
});
AppDataSource.initialize()
    .then(() => console.log("Data Source initialized!"))
    .catch((err) => console.error("Error during Data Source initialization:", err));

export default AppDataSource;

// ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/migrations/InitMigration --dataSource src/cores/database/config/data-source.ts