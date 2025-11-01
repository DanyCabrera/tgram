import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getNeonConfig } from './config/neon.config';
import appConfig from './config/app.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebSocketModule } from './websocket/websocket.module';
import { UploadModule } from './upload/upload.module';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Notification } from './entities/notification.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';
import { Media } from './entities/media.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getNeonConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Post,
      Notification,
      Comment,
      Like,
      ChatRoom,
      Message,
      Media,
    ]),
    AuthModule,
    UsersModule,
    PostsModule,
    ChatModule,
    NotificationsModule,
    WebSocketModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
