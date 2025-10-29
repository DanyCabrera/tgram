import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Conectado al WebSocket');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del WebSocket');
      this.isConnected = false;
    });

    this.socket.on('connected', (data) => {
      console.log('Confirmación de conexión:', data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión WebSocket:', error);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Métodos para escuchar eventos
  onLikeNotification(callback: (data: { postId: string; likerName: string; likerId: string }) => void) {
    if (this.socket) {
      this.socket.on('like_notification', callback);
    }
  }

  onCommentNotification(callback: (data: { postId: string; commenterName: string; commenterId: string; commentId: string }) => void) {
    if (this.socket) {
      this.socket.on('comment_notification', callback);
    }
  }

  onFollowNotification(callback: (data: { followerName: string; followerId: string }) => void) {
    if (this.socket) {
      this.socket.on('follow_notification', callback);
    }
  }

  onMessageNotification(callback: (data: { senderName: string; senderId: string; chatRoomId: string }) => void) {
    if (this.socket) {
      this.socket.on('message_notification', callback);
    }
  }

  onPostCountersUpdated(callback: (data: { postId: string; likesCount: number; commentsCount: number }) => void) {
    if (this.socket) {
      this.socket.on('post_counters_updated', callback);
    }
  }

  // Métodos para unirse/salir de salas
  joinRoom(room: string) {
    if (this.socket) {
      this.socket.emit('join_room', { room });
    }
  }

  leaveRoom(room: string) {
    if (this.socket) {
      this.socket.emit('leave_room', { room });
    }
  }

  // Método para remover listeners
  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  get connected() {
    return this.isConnected && this.socket?.connected;
  }

  get socketInstance() {
    return this.socket;
  }
}

export const webSocketService = new WebSocketService();
