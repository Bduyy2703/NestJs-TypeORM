import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../../modules/users/entities/user.entity';

@Module({
  imports: [
    // ConfigModule đảm bảo biến môi trường được nạp trước
    ConfigModule.forRoot({
      isGlobal: true, // Để ConfigModule khả dụng toàn ứng dụng
      envFilePath: ['.env.development'], // Đường dẫn đến file .env
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
        entities: [User], // Khai báo các entities (hoặc sử dụng auto-load nếu cần)
        migrations: ["../migrations/*.ts"],
        synchronize: true, // Tự động đồng bộ cơ sở dữ liệu (chỉ nên dùng cho môi trường phát triển)
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DatabaseModule {}
