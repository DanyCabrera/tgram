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

      return {
        data: rooms.map(room => ({
          id: room.id,
          participants: room.participants,
          lastMessage: room.messages && room.messages.length > 0 ? {
            id: room.messages[0].id,
            content: room.messages[0].content,
            senderId: room.messages[0].senderId,
            createdAt: room.messages[0].createdAt
          } : null,
          unreadCount: 0 // TODO: Implementar contador de mensajes no leídos
        }))
      };
    } catch (error) {
      console.error('Error obteniendo salas de chat:', error);
      return { data: [] };
    }
  }

  async getChatMessages(userId: string, roomId: string) {
    // Verificar que el usuario tiene acceso a esta sala
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId }
    });

    if (!room) {
      // Si la sala no existe, retornar mensajes vacíos
      return {
        posts: []
      };
    }

    if (!room.participants.includes(userId)) {
      throw new Error('No tienes acceso a esta sala de chat');
    }

    const messages = await this.messageRepository.find({
      where: { chatRoomId: roomId },
      order: { createdAt: 'ASC' }
    });

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
}