import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Profile } from '../profile/entities/profile.entity';

import { RoleModule } from '../role/role.module';
import { ProfilesModule } from '../profile/profile.module';
import { RoleService } from '../role/role.service';
import { Role } from '../role/entities/t_role';
import { Address } from '../address/entity/address.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User,Address, Profile,Role]) , RoleModule,forwardRef(() => ProfilesModule)],
  controllers: [UsersController],
  providers: [UsersService, RoleService],
  exports: [UsersService,TypeOrmModule],
})
export class UsersModule {}
