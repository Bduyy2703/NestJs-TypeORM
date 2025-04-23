import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notify.service';
import { NotificationController } from './notify.controller';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService], // Export để PaymentService dùng
})
export class NotificationModule {}