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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketGateway');
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Cliente conectado sin token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      if (!userId) {
        this.logger.warn('Token inválido');
        client.disconnect();
        return;
      }

      // Guardar la conexión del usuario
      this.connectedUsers.set(userId, client.id);
      client.data.userId = userId;

      this.logger.log(`Usuario ${userId} conectado con socket ${client.id}`);
      
      // Notificar al cliente que se conectó exitosamente
      client.emit('connected', { message: 'Conectado exitosamente' });
      
      // Notificar a todos los usuarios que este usuario se conectó
      this.server.emit('user_connected', { userId });
      
      // Enviar lista de usuarios activos al usuario recién conectado
      const activeUsers = Array.from(this.connectedUsers.keys());
      client.emit('active_users', { users: activeUsers });

    } catch (error) {
      this.logger.error('Error en la conexión:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`Usuario ${userId} desconectado`);
      
      // Notificar a todos los usuarios que este usuario se desconectó
      this.server.emit('user_disconnected', { userId });
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    client.join(data.room);
    this.logger.log(`Cliente ${client.id} se unió a la sala ${data.room}`);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { room: string }) {
    client.leave(data.room);
    this.logger.log(`Cliente ${client.id} salió de la sala ${data.room}`);
  }

  @SubscribeMessage('get_active_users')
  handleGetActiveUsers(@ConnectedSocket() client: Socket) {
    const activeUsers = Array.from(this.connectedUsers.keys());
    client.emit('active_users', { users: activeUsers });
    this.logger.log(`Lista de usuarios activos enviada al cliente ${client.id}:`, activeUsers);
  }

  // Métodos para emitir eventos a usuarios específicos
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`Evento ${event} enviado al usuario ${userId}`);
    } else {
      this.logger.warn(`Usuario ${userId} no está conectado`);
    }
  }

  emitToRoom(room: string, event: string, data: any) {
    this.logger.log(`📡 Emitiendo evento ${event} a la sala ${room}`);
    this.server.to(room).emit(event, data);
    this.logger.log(`✅ Evento ${event} enviado a la sala ${room}`);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Evento ${event} enviado a todos los clientes`);
  }

  // Métodos específicos para notificaciones
  sendLikeNotification(userId: string, data: { postId: string; likerName: string; likerId: string }) {
    this.emitToUser(userId, 'like_notification', data);
  }

  sendCommentNotification(userId: string, data: { postId: string; commenterName: string; commenterId: string; commentId: string }) {
    this.emitToUser(userId, 'comment_notification', data);
  }

  sendFollowNotification(userId: string, data: { followerName: string; followerId: string }) {
    this.emitToUser(userId, 'follow_notification', data);
  }

  sendMessageNotification(userId: string, data: { senderName: string; senderId: string; chatRoomId: string }) {
    this.emitToUser(userId, 'message_notification', data);
  }

  // Método para enviar mensajes en tiempo real
  sendMessage(chatRoomId: string, message: any) {
    this.logger.log(`📤 Enviando mensaje a la sala ${chatRoomId}:`, message);
    this.emitToRoom(chatRoomId, 'new_message', message);
    this.logger.log(`✅ Mensaje enviado a la sala ${chatRoomId}`);
    
    // También emitir directamente al receptor
    this.emitToUser(message.receiverId, 'new_message', message);
    this.logger.log(`📤 Mensaje enviado directamente al receptor ${message.receiverId}`);
  }

  // Método para notificar cuando un usuario está escribiendo
  sendTypingStatus(chatRoomId: string, userId: string, isTyping: boolean) {
    this.emitToRoom(chatRoomId, 'typing_status', { userId, isTyping });
  }

  // Método para actualizar contadores en tiempo real
  updatePostCounters(postId: string, data: { likesCount: number; commentsCount: number }) {
    this.emitToAll('post_counters_updated', { postId, ...data });
  }
}
