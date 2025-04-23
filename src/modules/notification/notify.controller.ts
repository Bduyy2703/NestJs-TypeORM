
import { Controller, Get, Post, Param, ParseIntPipe, Request, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notify.service';
import { Notification } from './entities/notification.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Actions } from 'src/cores/decorators/action.decorator';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';

@ApiTags('notification')
@Controller('notification')
@ApiSecurity('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Actions('execute')
  @Objectcode('NOTIFY01')
  @ApiOperation({ summary: 'Lấy danh sách thông báo của user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang, mặc định 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số thông báo mỗi trang, mặc định 20' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Loại thông báo (INVOICE_UPDATE)' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo', type: [Notification] })
  async getNotifications(
    @Request() request,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('type') type?: string,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Yêu cầu đăng nhập');
    }
    return this.notificationService.getNotifications(userId, page, limit, type);
  }

  @Post(':id/read')
  @Actions('execute')
  @Objectcode('NOTIFY01')
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc (cho user)' })
  @ApiResponse({ status: 200, description: 'Thông báo đã được đánh dấu đọc' })
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() request): Promise<void> {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Yêu cầu đăng nhập');
    }
    return this.notificationService.markAsRead(id, userId);
  }

  @Get('/all')
  @Actions('execute')
  @Objectcode('NOTIFY01')
  @ApiOperation({ summary: 'Lấy tất cả thông báo (dành cho admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang, mặc định 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số thông báo mỗi trang, mặc định 20' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Loại thông báo (INVOICE_CREATED, INVOICE_CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Danh sách tất cả thông báo', type: [Notification] })
  async getAllNotifications(
    @Request() request,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('type') type?: string,
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const role = request.user?.roles;
    if (role !== 'ADMIN') {
      throw new UnauthorizedException('Chỉ admin có quyền truy cập');
    }
    return this.notificationService.getAllNotifications(page, limit, type);
  }

  @Post(':id/read-admin')
  @Actions('execute')
  @Objectcode('NOTIFY01')
  @ApiOperation({ summary: 'Admin đánh dấu thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Thông báo đã được đánh dấu đọc' })
  async markAsReadAdmin(@Param('id', ParseIntPipe) id: number, @Request() request): Promise<void> {
    const role = request.user?.roles;
    if (role !== 'ADMIN') {
      throw new UnauthorizedException('Chỉ admin có quyền truy cập');
    }
    return this.notificationService.markAsReadAdmin(id);
  }
}
