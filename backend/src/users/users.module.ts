import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UsersController } from './users.controller';
import { UploadController } from './upload.controller';
import { UsersService } from './users.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationsModule
  ],
  controllers: [UsersController, UploadController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
