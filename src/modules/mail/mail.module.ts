import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { StrategySale } from '../strategySale/entity/strategySale.entity';
import { File } from '../files/file.entity';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.development',
      isGlobal: true, // Đảm bảo biến môi trường có thể dùng ở toàn bộ ứng dụng
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule vào MailerModule
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'), // Lấy giá trị từ .env
          port: parseInt(configService.get('MAIL_PORT') || '587', 10), // Đảm bảo cổng đúng kiểu số
          secure: false,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get('MAIL_FROM')}>`, // Lấy từ .env
        },
        template: {
          dir: join(__dirname, './template'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
        options: {
          inlineCss: false, // Tắt inline CSS
        },
      }),
      
      inject: [ConfigService], // Inject ConfigService để lấy biến môi trường
    }),
    TypeOrmModule.forFeature([User, StrategySale , File]),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule { }
