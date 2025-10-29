import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['followers', 'following'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['followers', 'following'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Actualizar campos permitidos
    Object.assign(user, updateProfileDto);
    
    return this.userRepository.save(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Actualizar contraseña
    await this.userRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Eliminar usuario (esto también eliminará datos relacionados por CASCADE)
    await this.userRepository.remove(user);

    return { message: 'Cuenta eliminada exitosamente' };
  }

  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('No puedes seguirte a ti mismo');
    }

    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['following'],
    });

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!currentUser) {
      throw new Error('Usuario actual no encontrado');
    }

    // Verificar si ya está siguiendo
    const isAlreadyFollowing = currentUser.following.some(
      (user) => user.id === targetUserId,
    );

    if (!isAlreadyFollowing) {
      currentUser.following.push(targetUser);
      await this.userRepository.save(currentUser);

      console.log(`Usuario ${currentUser.name} (${currentUserId}) siguiendo a ${targetUser.name} (${targetUserId})`);

      // Crear notificación para el usuario que está siendo seguido
      try {
        await this.notificationsService.createFollowNotification(
          targetUserId,
          currentUserId
        );
        console.log(`Notificación de follow creada para usuario ${targetUserId}`);
      } catch (error) {
        console.error('Error creando notificación:', error);
      }
    }
  }

  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['following'],
    });

    if (!currentUser) {
      throw new Error('Usuario actual no encontrado');
    }

    currentUser.following = currentUser.following.filter(
      (user) => user.id !== targetUserId,
    );

    await this.userRepository.save(currentUser);
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const followers = user.followers.slice(startIndex, endIndex);

    return {
      followers,
      total: user.followers.length,
      page,
      limit,
      totalPages: Math.ceil(user.followers.length / limit),
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const following = user.following.slice(startIndex, endIndex);

    return {
      following,
      total: user.following.length,
      page,
      limit,
      totalPages: Math.ceil(user.following.length / limit),
    };
  }

  async searchUsers(query: string, page: number = 1, limit: number = 10) {
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.username ILIKE :query', {
        query: `%${query}%`,
      })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
