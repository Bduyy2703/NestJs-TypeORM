
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
    const authHeaders = client.handshake.headers.authorization;
    if (!authHeaders) {
      client.disconnect();
      return;
    }
    const AccessToken = authHeaders.split(' ')[1];
    const valid = await this.authService.validateAccessToken(AccessToken);
    if (!valid) {
      client.disconnect();
      return;
    }
    const decodeToken = await this.jwtService.verify(AccessToken);
    if (!decodeToken) client.disconnect();
    const { userId } = decodeToken;
    client.data.userId = userId;
    client.join(userId);
    this.server.to(userId).emit('notification', { message: 'You are online' });
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('Disconnected userId: ', socket.data.userId);
  }

  @OnEvent('notification')
  emitNotification(payload: { userId: string; message: string; type: string; notificationId: number }) {
    this.server.to(payload.userId).emit('notification', payload);
  }
}