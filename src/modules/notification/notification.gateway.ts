
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    // Lấy token từ handshake.auth thay vì headers
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    const AccessToken = token.replace('Bearer ', '');
    const valid = await this.authService.validateAccessToken(AccessToken);
    if (!valid) {
      client.disconnect();
      return;
    }
    const decodeToken = await this.jwtService.verify(AccessToken);
    if (!decodeToken) client.disconnect();
    const { userId, roles} = decodeToken;
    client.data.userId = userId;
    client.data.role = roles;
    client.join(userId); // Join room userId
    if (roles === 'ADMIN') {
      client.join('admin'); // Admin join channel admin
    }
    this.server.to(userId).emit('notification', { message: 'You are online' });
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('Disconnected userId: ', socket.data.userId);
  }

  @OnEvent('notification')
  emitNotification(payload: {
    userId: string;
    message: string;
    type: string;
    source: 'ADMIN' | 'USER';
    notificationId: number;
  }) {
    if (payload.source === 'ADMIN') {
      // Gửi tới người dùng (chỉ thông báo từ ADMIN)
      this.server.to(payload.userId).emit('notification', payload);
    } else if (payload.source === 'USER') {
      // Gửi tới tất cả admin (chỉ thông báo từ USER)
      this.server.to('admin').emit('notification', payload);
    }
  }
}
