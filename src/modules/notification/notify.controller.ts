import { Controller, Get, Post, Param, ParseIntPipe, Request, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notify.service';
import { Notification } from './entities/notification.entity';
import { UnauthorizedException } from '@nestjs/common';

@ApiTags('notification')
@Controller('notification')
@ApiSecurity('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang, mặc định 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số thông báo mỗi trang, mặc định 20' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo', type: [Notification] })
  async getNotifications(
    @Request() request,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Yêu cầu đăng nhập');
    }
    return this.notificationService.getNotifications(userId, page, limit);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Thông báo đã được đánh dấu đọc' })
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() request): Promise<void> {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Yêu cầu đăng nhập');
    }
    return this.notificationService.markAsRead(id, userId);
  }
}