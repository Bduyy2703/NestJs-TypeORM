import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/user.module';
import { Token } from './entities/token.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Token,User]), UsersModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
