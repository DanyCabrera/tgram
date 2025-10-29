import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ArrayContains } from 'typeorm';
import { Message } from '../entities/message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { User } from '../entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { RealtimeGateway } from '../websocket/websocket.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async createMessage(senderId: string, createMessageDto: CreateMessageDto) {
    try {
      const { content, receiverId, chatRoomId } = createMessageDto;
      console.log(`📝 Creando mensaje: "${content}" de ${senderId} a ${receiverId}, sala: ${chatRoomId}`);
      
      // Buscar sala existente entre estos dos usuarios
      let room = await this.chatRoomRepository.findOne({
        where: [
          { 
            participants: ArrayContains([senderId, receiverId]),
            isGroup: false
          },
          { 
            participants: ArrayContains([receiverId, senderId]),
            isGroup: false
          }
        ]
      });

      // Si no existe, buscar por ID si se proporciona
      if (!room && chatRoomId) {
        room = await this.chatRoomRepository.findOne({
          where: { id: chatRoomId }
        });
      }

      if (!room) {
        // Generar UUID real para la sala de chat
        const { v4: uuidv4 } = require('uuid');
        const newRoomId = uuidv4();
        
        room = this.chatRoomRepository.create({
          id: newRoomId,
          participants: [senderId, receiverId],
          isGroup: false
        });
        await this.chatRoomRepository.save(room);
        console.log(`📝 Nueva sala creada: ${newRoomId} para usuarios ${senderId} y ${receiverId}`);
      } else {
        console.log(`📝 Usando sala existente: ${room.id} para usuarios ${senderId} y ${receiverId}`);
      }

      // Crear mensaje
      const message = this.messageRepository.create({
        content,
        senderId,
        receiverId,
        chatRoomId: room.id
      });

      const savedMessage = await this.messageRepository.save(message);

      // Obtener información del remitente
      const sender = await this.userRepository.findOne({ where: { id: senderId } });

      const messageData = {
        id: savedMessage.id,
        content: savedMessage.content,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        chatRoomId: savedMessage.chatRoomId,
        createdAt: savedMessage.createdAt,
        sender: {
          id: senderId,
          name: sender?.name || 'Usuario',
          email: sender?.email || 'usuario@test.com'
        }
      };

      // Emitir mensaje en tiempo real a la sala de chat
      this.realtimeGateway.sendMessage(room.id, messageData);

      // Enviar notificación al receptor
      this.realtimeGateway.sendMessageNotification(receiverId, {
        senderName: sender?.name || 'Usuario',
        senderId: senderId,
        chatRoomId: room.id
      });

      return {
        data: messageData
      };
    } catch (error) {
      console.error('Error creando mensaje:', error);
      throw error;
    }
  }

  async getUserChatRooms(userId: string) {
    try {
      // Obtener salas de chat donde el usuario es participante
      const rooms = await this.chatRoomRepository
        .createQueryBuilder('room')
        .where('room.participants @> :userId', { userId: [userId] })
        .leftJoinAndSelect('room.messages', 'message')
        .orderBy('message.createdAt', 'DESC')
        .getMany();

      // Calcular contador de mensajes no leídos por sala
      const roomsWithUnreadCount = await Promise.all(
        rooms.map(async (room) => {
          // Contar mensajes no leídos en esta sala donde el usuario es el receptor
          const result = await this.messageRepository.query(
            'SELECT COUNT(*) as count FROM messages WHERE "chatRoomId" = $1 AND "receiverId" = $2 AND "senderId" != $3 AND "isRead" = false',
            [room.id, userId, userId]
          );
          const unreadCount = parseInt(result[0].count);

          return {
            id: room.id,
            participants: room.participants,
            lastMessage: room.messages && room.messages.length > 0 ? {
              id: room.messages[0].id,
              content: room.messages[0].content,
              senderId: room.messages[0].senderId,
              receiverId: room.messages[0].receiverId,
              createdAt: room.messages[0].createdAt
            } : null,
            unreadCount: unreadCount,
            hasUnreadMessages: unreadCount > 0
          };
        })
      );

      // Ordenar por último mensaje
      roomsWithUnreadCount.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return {
        data: roomsWithUnreadCount
      };
    } catch (error) {
      console.error('Error obteniendo salas de chat:', error);
      return { data: [] };
    }
  }

  async getChatMessages(userId: string, roomId: string) {
    console.log(`🔍 Obteniendo mensajes para usuario ${userId} en sala ${roomId}`);
    
    // Verificar que el usuario tiene acceso a esta sala
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId }
    });

    if (!room) {
      console.log(`❌ Sala ${roomId} no encontrada`);
      // Si la sala no existe, retornar mensajes vacíos
      return {
        posts: []
      };
    }

    console.log(`✅ Sala encontrada: ${room.id}, participantes: ${room.participants}`);

    if (!room.participants.includes(userId)) {
      console.log(`❌ Usuario ${userId} no tiene acceso a la sala ${roomId}`);
      throw new Error('No tienes acceso a esta sala de chat');
    }

    const messages = await this.messageRepository.find({
      where: { chatRoomId: roomId },
      order: { createdAt: 'ASC' }
    });

    console.log(`📨 Encontrados ${messages.length} mensajes en la sala ${roomId}`);

    // Obtener información de los remitentes
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senders = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id IN (:...senderIds)', { senderIds })
      .getMany();

    const senderMap = new Map(senders.map(s => [s.id, s]));

    return {
      posts: messages.map(message => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        chatRoomId: message.chatRoomId,
        createdAt: message.createdAt,
        sender: {
          id: message.senderId,
          name: senderMap.get(message.senderId)?.name || 'Usuario',
          email: senderMap.get(message.senderId)?.email || 'usuario@test.com'
        }
      }))
    };
  }

  async getChatRoomById(roomId: string, userId: string) {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId }
    });

    if (!room) {
      throw new Error('Sala de chat no encontrada');
    }

    // Verificar que el usuario es participante
    if (!room.participants.includes(userId)) {
      throw new Error('No tienes acceso a esta sala de chat');
    }

    return room;
  }

  async sendMessage(userId: string, chatRoomId: string, content: string) {
    const room = await this.getChatRoomById(chatRoomId, userId);
    
    const message = this.messageRepository.create({
      content,
      senderId: userId,
      receiverId: room.participants.find(p => p !== userId) || '',
      chatRoomId: room.id
    });

    const savedMessage = await this.messageRepository.save(message);

    return {
      id: savedMessage.id,
      content: savedMessage.content,
      senderId: savedMessage.senderId,
      receiverId: savedMessage.receiverId,
      chatRoomId: savedMessage.chatRoomId,
      createdAt: savedMessage.createdAt,
      sender: {
        id: userId,
        name: 'Usuario',
        email: 'usuario@test.com'
      }
    };
  }

  async getUnreadMessageCount(userId: string) {
    try {
      // Contar mensajes no leídos usando una consulta más específica
      const result = await this.messageRepository.query(
        `SELECT COUNT(*) as count FROM messages m 
         INNER JOIN chat_rooms r ON m."chatRoomId" = r.id 
         WHERE r.participants @> $1 
         AND m."receiverId" = $2 
         AND m."senderId" != $3 
         AND m."isRead" = false`,
        [[userId], userId, userId]
      );
      const unreadCount = parseInt(result[0].count);

      return { count: unreadCount };
    } catch (error) {
      console.error('Error obteniendo contador de mensajes no leídos:', error);
      return { count: 0 };
    }
  }

  async markMessagesAsRead(userId: string, roomId: string) {
    try {
      // Marcar todos los mensajes no leídos de esta sala como leídos
      const result = await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ isRead: true })
        .where('chatRoomId = :roomId', { roomId })
        .andWhere('receiverId = :userId', { userId })
        .andWhere('isRead = false')
        .execute();

      return { 
        message: 'Mensajes marcados como leídos',
        count: result.affected || 0
      };
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
      throw error;
    }
  }
}