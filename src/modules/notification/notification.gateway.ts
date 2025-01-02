import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'Socket.io';
  import { JwtService } from '@nestjs/jwt';
  import { OnEvent } from '@nestjs/event-emitter';
  import { AuthService } from '../auth/auth.service';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  export class NotificationGateway
    implements OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer()
    server: Server;
  
    constructor(
      private jwtService: JwtService,
      private authService: AuthService,
    ) {}
    async handleConnection(@ConnectedSocket() client: Socket) {
      console.log('Socket-id:: ', client.id);
  
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
  
      console.log('verified userId: ', userId);
  
      client.data.userId = userId;
  
      client.join(userId);
  
      this.server.to(userId).emit('notification', 'You are online');
    }
  
    handleDisconnect(@ConnectedSocket() socket: Socket) {
      console.log('disconnected userId: ', socket.data.userId);
    }
  
    @OnEvent('logout')
    emitLogout(payload: any) {
      this.server.to(payload.userId).emit('notification', 'User is offline');
    }
  
    @OnEvent('comment')
    async emitComment(payload: any) {
      console.log({
        payload,
      });
  
      const { authorBlog } = payload;
  
      this.server.to(authorBlog).emit('notification', payload);
    }
  }
  