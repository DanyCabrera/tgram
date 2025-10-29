import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request,
  Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mensaje' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado exitosamente' })
  async createMessage(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.chatService.createMessage(req.user.id, createMessageDto);
  }

  @Get('rooms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener salas de chat del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de salas de chat' })
  async getChatRooms(@Request() req) {
    return this.chatService.getUserChatRooms(req.user.id);
  }

  @Get('rooms/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mensajes de una sala de chat' })
  @ApiResponse({ status: 200, description: 'Lista de mensajes' })
  async getChatMessages(@Request() req, @Param('id') roomId: string) {
    return this.chatService.getChatMessages(req.user.id, roomId);
  }
}