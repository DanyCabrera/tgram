import { Controller, Post, Get, Body, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  redirectToSwagger(@Res() res: Response) {
    // Redirigir a la documentación de Swagger cuando se accede a la raíz
    // Funciona tanto en local como en Render
    return res.redirect('/api');
  }

  @Post('clean-database')
  async cleanDatabase() {
    return this.appService.cleanDatabase();
  }

  @Post('test-message')
  async testMessage(@Body() body: { content: string; receiverId: string; senderId: string }) {
    return {
      success: true,
      message: 'Mensaje de prueba enviado',
      data: {
        id: Date.now().toString(),
        content: body.content,
        senderId: body.senderId,
        receiverId: body.receiverId,
        chatRoomId: `${body.senderId}-${body.receiverId}`,
        createdAt: new Date().toISOString(),
        sender: {
          id: body.senderId,
          name: 'Usuario Test',
          email: 'test@test.com'
        }
      }
    };
  }

  @Get('test-messages/:chatRoomId')
  async getTestMessages(@Param('chatRoomId') chatRoomId: string) {
    // Simular mensajes existentes
    const mockMessages = [
      {
        id: '1',
        content: 'Hola, ¿cómo estás?',
        senderId: 'bfbaa9cd-0474-4ddf-b5bc-82d955ed9f10',
        receiverId: 'ee496671-ba20-4ed6-94ff-2f9a3dbaa2dd',
        chatRoomId: chatRoomId,
        createdAt: new Date(Date.now() - 60000).toISOString(),
        sender: {
          id: 'bfbaa9cd-0474-4ddf-b5bc-82d955ed9f10',
          name: 'Usuario Test',
          email: 'test@test.com'
        }
      },
      {
        id: '2',
        content: 'Todo bien, gracias por preguntar',
        senderId: 'ee496671-ba20-4ed6-94ff-2f9a3dbaa2dd',
        receiverId: 'bfbaa9cd-0474-4ddf-b5bc-82d955ed9f10',
        chatRoomId: chatRoomId,
        createdAt: new Date(Date.now() - 30000).toISOString(),
        sender: {
          id: 'ee496671-ba20-4ed6-94ff-2f9a3dbaa2dd',
          name: 'Usuario Receptor',
          email: 'receptor@test.com'
        }
      }
    ];

    return {
      success: true,
      posts: mockMessages
    };
  }

  @Get('test-notifications/:userId')
  async getTestNotifications(@Param('userId') userId: string) {
    // Simular notificaciones
    const mockNotifications = [
      {
        id: '1',
        type: 'message',
        message: 'Usuario Test te envió un mensaje: "Hola, ¿cómo estás?"',
        isRead: false,
        relatedUserId: 'bfbaa9cd-0474-4ddf-b5bc-82d955ed9f10',
        createdAt: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: '2',
        type: 'like',
        message: 'Usuario Test le dio like a tu publicación',
        isRead: false,
        relatedUserId: 'bfbaa9cd-0474-4ddf-b5bc-82d955ed9f10',
        createdAt: new Date(Date.now() - 180000).toISOString()
      }
    ];

    return {
      success: true,
      notifications: mockNotifications
    };
  }

  @Post('test-notification')
  async createTestNotification(@Body() body: { userId: string; type: string; message: string; relatedUserId: string }) {
    const notification = {
      id: Date.now().toString(),
      type: body.type,
      message: body.message,
      isRead: false,
      relatedUserId: body.relatedUserId,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      message: 'Notificación creada exitosamente',
      data: notification
    };
  }
}