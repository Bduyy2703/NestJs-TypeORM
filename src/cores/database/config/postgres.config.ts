import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../../modules/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // Đảm bảo ConfigModule được nạp trước
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('HOST'),
        port: +configService.get<number>('PORT'),
        username: configService.get('USERNAME'),
        password: configService.get('PASSWORD'),
        database: configService.get('DATABASE'),
        synchronize: true,
        logging: true,
        entities: [User],
        migrations: ['../migrations/*.ts'],
      }),
    }),
  ],
})
export class DatabaseModule {}
