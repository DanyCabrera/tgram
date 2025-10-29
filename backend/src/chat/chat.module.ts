import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Message } from '../entities/message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { User } from '../entities/user.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RealtimeGateway } from '../websocket/websocket.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, ChatRoom, User]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn,
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, RealtimeGateway],
  exports: [ChatService],
})
export class ChatModule {}