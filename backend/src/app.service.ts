import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Notification } from './entities/notification.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async cleanDatabase() {
    try {
      // Limpiar en orden correcto (respetando foreign keys)
      await this.notificationRepository.query('DELETE FROM notifications;');
      await this.messageRepository.query('DELETE FROM messages;');
      await this.commentRepository.query('DELETE FROM comments;');
      await this.likeRepository.query('DELETE FROM likes;');
      await this.postRepository.query('DELETE FROM posts;');
      await this.notificationRepository.query('DELETE FROM user_followers;'); // Limpiar tabla de seguidores
      await this.userRepository.query('DELETE FROM users;');

      return { message: 'Base de datos limpiada exitosamente' };
    } catch (error) {
      return { error: error.message };
    }
  }
}
