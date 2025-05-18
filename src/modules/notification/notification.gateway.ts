
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthService } from '../auth/auth.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(NotificationGateway.name);
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) { }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        this.logger.warn('No token provided, disconnecting client');
        client.disconnect();
        return;
      }
      const AccessToken = token.replace('Bearer ', '');
      const valid = await this.authService.validateAccessToken(AccessToken);
      if (!valid) {
        this.logger.warn('Invalid token, disconnecting client');
        client.disconnect();
        return;
      }
      const decodeToken = await this.jwtService.verify(AccessToken);
      if (!decodeToken) {
        this.logger.warn('Failed to decode token, disconnecting client');
        client.disconnect();
        return;
      }
      const { userId, roles } = decodeToken;
      client.data.userId = userId;
      client.data.role = roles;
      client.join(userId);
      if (roles === 'ADMIN') {
        client.join('admin');
      }
      this.server.to(userId).emit('notification', { message: 'You are online' });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        this.logger.warn(`Token expired for client ${client.id}: ${error.message}`);
        client.emit('auth_error', { message: 'Token expired, please refresh your token' });
      } else {
        this.logger.error(`Connection error for client ${client.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        client.emit('auth_error', { message: 'Authentication failed' });
      }
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log('Disconnected userId: ', socket.data.userId);
  }

  @OnEvent('notification')
  emitNotification(payload: {
    userId: string;
    message: string;
    type: string;
    source: 'ADMIN' | 'USER';
    notificationId: number;
  }) {
    if (payload.source === 'ADMIN'|| payload.source === 'USER') {
      // Gửi tới người dùng (chỉ thông báo từ ADMIN)
      this.server.to(payload.userId).emit('notification', payload);
    } else if (payload.source === 'USER') {
      // Gửi tới tất cả admin (chỉ thông báo từ USER)
      this.server.to('admin').emit('notification', payload);
    }
  }
}
