import { 
  Controller, 
  Get, 
  Post,
  Put, 
  Delete, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  Body
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva notificación' })
  @ApiResponse({ status: 201, description: 'Notificación creada exitosamente' })
  async createNotification(
    @Request() req,
    @Body() createNotificationDto: { 
      userId: string; 
      type: string; 
      title: string; 
      message: string; 
      data?: any 
    }
  ) {
    return this.notificationsService.createNotificationFromFrontend({
      ...createNotificationDto,
      senderId: req.user.id
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  async getNotifications(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, page, limit);
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones no leídas' })
  async getUnreadNotifications(@Request() req) {
    return this.notificationsService.getUnreadNotifications(req.user.id);
  }

  @Get('unread/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener contador de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Contador de notificaciones no leídas' })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async markAsRead(@Request() req, @Param('id') notificationId: string) {
    await this.notificationsService.markAsRead(notificationId, req.user.id);
    return { message: 'Notificación marcada como leída' };
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar notificación' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async deleteNotification(@Request() req, @Param('id') notificationId: string) {
    await this.notificationsService.deleteNotification(notificationId, req.user.id);
    return { message: 'Notificación eliminada exitosamente' };
  }
}
