
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface NotificationPayload {
  userId: string;
  message: string;
  type: string;
  source: 'ADMIN' | 'USER';
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
      source: payload.source,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.notificationRepo.save(notification);

    this.eventEmitter.emit('notification', {
      userId: payload.userId,
      message: payload.message,
      type: payload.type,
      source: payload.source,
      notificationId: notification.id,
    });
  }

  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: string,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const where: any = { userId, source: 'ADMIN' }; // Chỉ lấy thông báo từ ADMIN
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepo.count({
      where: { userId, source: 'ADMIN', isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  async getAllNotifications(
    page: number = 1,
    limit: number = 20,
    type?: string,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const where: any = { source: 'USER' }; // Chỉ lấy thông báo từ USER
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepo.count({
      where: { source: 'USER', isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId: number, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId, source: 'ADMIN' },
    });
    if (!notification) {
      throw new NotFoundException(`Thông báo với ID ${notificationId} không tồn tại`);
    }
    notification.isRead = true;
    notification.updatedAt = new Date();
    await this.notificationRepo.save(notification);
  }

  async markAsReadAdmin(notificationId: number): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, source: 'USER' },
    });
    if (!notification) {
      throw new NotFoundException(`Thông báo với ID ${notificationId} không tồn tại`);
    }
    notification.isRead = true;
    notification.updatedAt = new Date();
    await this.notificationRepo.save(notification);
  }
}
