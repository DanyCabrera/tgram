import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { RealtimeGateway } from '../websocket/websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    relatedUserId?: string,
    relatedPostId?: string,
    relatedCommentId?: string,
  ): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const notification = this.notificationRepository.create({
      userId,
      type,
      message,
      relatedUserId,
      relatedPostId,
      relatedCommentId,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // TODO: Implementar notificaciones en tiempo real
    // Por ahora solo guardamos en la base de datos
    console.log(`Notificación creada para usuario ${userId}: ${savedNotification.message}`);

    return savedNotification;
  }

  // Método sobrecargado para crear notificaciones desde el frontend
  async createNotificationFromFrontend(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    senderId: string;
  }): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Mapear el tipo de string a NotificationType
    let notificationType: NotificationType;
    switch (data.type) {
      case 'message':
        notificationType = NotificationType.MESSAGE;
        break;
      case 'like':
        notificationType = NotificationType.LIKE;
        break;
      case 'comment':
        notificationType = NotificationType.COMMENT;
        break;
      case 'follow':
        notificationType = NotificationType.FOLLOW;
        break;
      default:
        notificationType = NotificationType.MESSAGE;
    }

    const notification = this.notificationRepository.create({
      userId: data.userId,
      type: notificationType,
      message: data.message,
      relatedUserId: data.senderId,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    console.log(`Notificación creada para usuario ${data.userId}: ${savedNotification.message}`);

    return savedNotification;
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const [notifications, total] = await this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadNotifications(userId: string) {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.isRead = false')
      .orderBy('notification.createdAt', 'DESC')
      .getMany();
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('userId = :userId', { userId })
      .execute();
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await this.notificationRepository.remove(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // Métodos para crear notificaciones específicas
  async createLikeNotification(
    postAuthorId: string,
    likerId: string,
    postId: string,
  ): Promise<void> {
    const liker = await this.userRepository.findOne({ where: { id: likerId } });
    if (!liker) return;

    await this.createNotification(
      postAuthorId,
      NotificationType.LIKE,
      `${liker.name} le dio like a tu publicación`,
      likerId,
      postId,
    );
  }

  async createCommentNotification(
    postAuthorId: string,
    commenterId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    const commenter = await this.userRepository.findOne({ where: { id: commenterId } });
    if (!commenter) return;

    await this.createNotification(
      postAuthorId,
      NotificationType.COMMENT,
      `${commenter.name} comentó en tu publicación`,
      commenterId,
      postId,
      commentId,
    );
  }

  async createFollowNotification(
    followedUserId: string,
    followerId: string,
  ): Promise<void> {
    const follower = await this.userRepository.findOne({ where: { id: followerId } });
    if (!follower) return;

    const notification = await this.createNotification(
      followedUserId,
      NotificationType.FOLLOW,
      `${follower.name} comenzó a seguirte`,
      followerId,
    );

    // Enviar notificación en tiempo real
    this.realtimeGateway.sendFollowNotification(followedUserId, {
      followerName: follower.name,
      followerId: followerId,
    });
  }

  async createMessageNotification(
    recipientId: string,
    senderId: string,
    chatRoomId: string,
  ): Promise<void> {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) return;

    await this.createNotification(
      recipientId,
      NotificationType.MESSAGE,
      `${sender.name} te envió un mensaje`,
      senderId,
    );
  }

}
