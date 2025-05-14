import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/user.module';
import { MailModule } from '../mail/mail.module';
import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenModule } from '../token/token.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoleModule } from '../role/role.module';
import { PermissionService } from '../permission/permission.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../role/entities/t_role';
import { Token } from '../token/entities/token.entity';
import { PermissionModule } from '../permission/permission.module';
@Module({
  imports: [
    ConfigModule.forRoot(), // Import ConfigModule để đọc file .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Lấy giá trị từ biến môi trường
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TypeOrmModule.forFeature([User, Role, Token]),
    MailModule,
    UsersModule,
    TokenModule,
    PassportModule,
    RoleModule,
    PermissionModule
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, PermissionService],
  exports: [AuthService],
})
export class AuthModule { }
