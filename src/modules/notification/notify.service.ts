
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

interface NotificationPayload {
  userId: string;
  message: string;
  type: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const { userId, message, type } = payload;

    try {
      const notification = this.notificationRepo.create({
        userId,
        message,
        type,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.notificationRepo.save(notification);
      this.logger.log(`Saved in-app notification for user ${userId}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to save notification for user ${userId}: ${error}`);
      throw new Error('Không thể lưu thông báo');
    }
  }

  async getNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { notifications, total };
  }

  async markAsRead(notificationId: number, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({ where: { id: notificationId, userId } });
    if (!notification) {
      throw new NotFoundException(`Thông báo với ID ${notificationId} không tồn tại hoặc không thuộc về bạn`);
    }
    notification.isRead = true;
    notification.updatedAt = new Date();
    await this.notificationRepo.save(notification);
    this.logger.log(`Marked notification ${notificationId} as read for user ${userId}`);
  }
}
