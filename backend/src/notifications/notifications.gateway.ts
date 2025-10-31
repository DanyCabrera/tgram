import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (() => {
      const origins: string[] = [];
      
      // Agregar URL del frontend desde variable de entorno
      if (process.env.FRONTEND_URL) {
        origins.push(process.env.FRONTEND_URL);
      }
      
      // URL de producción (fallback)
      origins.push('https://tgram-ruby.vercel.app');
      
      return origins;
    })(),
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Guardar la conexión del usuario
      this.connectedUsers.set(userId, client.id);
      client.join(`user_${userId}`);

      this.logger.log(`Usuario ${userId} conectado para notificaciones`);
    } catch (error) {
      this.logger.error('Error de autenticación WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Encontrar y remover el usuario desconectado
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.logger.log(`Usuario ${userId} desconectado de notificaciones`);
        break;
      }
    }
  }

  @SubscribeMessage('join_notifications')
  handleJoinNotifications(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    // El usuario ya está unido en handleConnection
    client.emit('joined_notifications', { success: true });
  }

  // Método para enviar notificación a un usuario específico
  async sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('new_notification', notification);
      this.logger.log(`Notificación enviada a usuario ${userId}:`, notification.message);
    }
  }

  // Método para enviar notificación a múltiples usuarios
  async sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Método para obtener usuarios conectados
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
