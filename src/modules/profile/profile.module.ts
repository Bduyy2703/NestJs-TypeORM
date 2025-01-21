import { forwardRef, Module } from '@nestjs/common';
import { ProfilesService } from './profile.service';
import { ProfilesController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Profile,User ]),forwardRef(() => UsersModule)],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports:[TypeOrmModule,ProfilesService]
})
export class ProfilesModule {}
