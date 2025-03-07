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
@Module({
  imports: [
    // ConfigModule đảm bảo biến môi trường được nạp trước
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development'], 
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DEV_DB_HOST'),
        port: configService.get<number>('DEV_DB_PORT'),
        username: configService.get<string>('DEV_DB_USERNAME', 'postgres'),
        password: configService.get<string>('DEV_DB_PASSWORD'),
        database: configService.get<string>('DEV_DB_DATABASE'),
        entities: [Address,User,Role,Blog,Notification,Object_entity,Profile,Right,RightObject,RoleRight,Token,File], 
        migrations: ["../migrations/*.ts"],
        synchronize: true, 
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DatabaseModule {}
