import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface NotificationPayload {
  userId: string;
  message: string;
  type: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const notification = this.notificationRepo.create({
      userId: payload.userId,
      message: payload.message,
      type: payload.type,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.notificationRepo.save(notification);

    this.eventEmitter.emit('notification', {
      userId: payload.userId,
      message: payload.message,
      type: payload.type,
      notificationId: notification.id,
    });
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
      throw new NotFoundException(`Thông báo với ID ${notificationId} không tồn tại`);
    }
    notification.isRead = true;
    notification.updatedAt = new Date();
    await this.notificationRepo.save(notification);
  }
}