import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  Post, 
  Comment, 
  ChatRoom, 
  Message, 
  Notification,
  ApiResponse,
  PaginatedResponse,
  UsersResponse,
  FollowingResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    let rawBaseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'http://localhost:3001'; // Fallback solo para desarrollo local

    // Normalizar: si viene con sufijo '/api', quitarlo para evitar rutas duplicadas
    const baseURL = rawBaseUrl.replace(/\/?api\/?$/, ''); 
    this.api = axios.create({
      baseURL,
      timeout: 60000,
    });

    // Interceptor para agregar token a las peticiones
    this.api.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers = config.headers || {};
            (config.headers as any).Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar respuestas
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (typeof window !== 'undefined') {
          if (error.response?.status === 401 && window.location.pathname !== '/') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials, { timeout: 60000 });
      return response.data;
    } catch (error: any) {
      // Retry once on timeout (Render cold start mitigation)
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '');
      if (isTimeout) {
        await new Promise((r) => setTimeout(r, 2000));
        const retryResponse: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials, { timeout: 60000 });
        return retryResponse.data;
      }
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/profile');
    return response.data;
  }

  // Users endpoints
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/users/profile', userData);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.put('/users/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  async deleteAccount(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete('/users/account');
    return response.data;
  }

  async uploadAvatar(file: File): Promise<{ message: string; avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response: AxiosResponse<{ message: string; avatarUrl: string }> = await this.api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadCover(file: File): Promise<{ message: string; coverUrl: string }> {
    const formData = new FormData();
    formData.append('cover', file);
    
    const response: AxiosResponse<{ message: string; coverUrl: string }> = await this.api.post('/upload/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async getUserByUsername(username: string): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/users/username/${username}`);
    return response.data;
  }

  async searchUsers(query: string, page = 1, limit = 10): Promise<UsersResponse> {
    const response: AxiosResponse<UsersResponse> = await this.api.get('/users/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  }

  async followUser(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post(`/users/${userId}/follow`);
    return response.data;
  }

  async unfollowUser(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/users/${userId}/follow`);
    return response.data;
  }

  async getUserProfile(userId: string): Promise<User & { following: User[], followers: User[] }> {
    const response: AxiosResponse<User & { following: User[], followers: User[] }> = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async getFollowers(userId: string, page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get(`/users/${userId}/followers`, {
      params: { page, limit }
    });
    return response.data;
  }

  async getFollowing(userId: string, page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get(`/users/${userId}/following`, {
      params: { page, limit }
    });
    return response.data;
  }

  async getMyFollowing(page = 1, limit = 50): Promise<FollowingResponse> {
    const response: AxiosResponse<FollowingResponse> = await this.api.get('/users/following', {
      params: { page, limit }
    });
    return response.data;
  }

  // Posts endpoints
  async createPost(postData: { content: string; imageUrl?: string; videoUrl?: string } | FormData): Promise<Post> {
    if (postData instanceof FormData) {
      // Usar el endpoint con media
      const response: AxiosResponse<Post> = await this.api.post('/posts/with-media', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } else {
      // Usar el endpoint normal
      const response: AxiosResponse<Post> = await this.api.post('/posts', postData);
      return response.data;
    }
  }

  async getFeed(page = 1, limit = 10): Promise<PaginatedResponse<Post>> {
    const response: AxiosResponse<PaginatedResponse<Post>> = await this.api.get('/posts/feed', {
      params: { page, limit }
    });
    return response.data;
  }

  async getPostById(id: string): Promise<Post> {
    const response: AxiosResponse<Post> = await this.api.get(`/posts/${id}`);
    return response.data;
  }

  async updatePost(id: string, postData: { content?: string; imageUrl?: string; videoUrl?: string }): Promise<Post> {
    const response: AxiosResponse<Post> = await this.api.put(`/posts/${id}`, postData);
    return response.data;
  }

  async deletePost(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/posts/${id}`);
    return response.data;
  }

  async likePost(postId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post(`/posts/${postId}/like`);
    return response.data;
  }

  async unlikePost(postId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/posts/${postId}/like`);
    return response.data;
  }

  async createComment(postId: string, content: string): Promise<Comment> {
    const response: AxiosResponse<Comment> = await this.api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  }

  async getComments(postId: string, page = 1, limit = 10): Promise<PaginatedResponse<Comment>> {
    const response: AxiosResponse<PaginatedResponse<Comment>> = await this.api.get(`/posts/${postId}/comments`, {
      params: { page, limit }
    });
    return response.data;
  }

  async likeComment(commentId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post(`/posts/comments/${commentId}/like`);
    return response.data;
  }

  async unlikeComment(commentId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/posts/comments/${commentId}/like`);
    return response.data;
  }


  // Explore endpoints
  async getExplorePosts(): Promise<{ posts: Post[]; total: number }> {
    const response: AxiosResponse<{ posts: Post[]; total: number }> = await this.api.get('/explore/posts');
    return response.data;
  }

  // Chat endpoints
  async createChatRoom(participantIds: string[], name?: string, isGroup = false): Promise<ChatRoom> {
    const response: AxiosResponse<ChatRoom> = await this.api.post('/chat/rooms', {
      participantIds,
      name,
      isGroup
    });
    return response.data;
  }


  async getChatRoomById(id: string): Promise<ChatRoom> {
    const response: AxiosResponse<ChatRoom> = await this.api.get(`/chat/rooms/${id}`);
    return response.data;
  }

  async getMessages(chatRoomId: string, page = 1, limit = 50): Promise<PaginatedResponse<Message>> {
    const response: AxiosResponse<PaginatedResponse<Message>> = await this.api.get(`/chat/rooms/${chatRoomId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  }

  async sendMessage(chatRoomId: string, content: string, imageUrl?: string, fileUrl?: string): Promise<Message> {
    const response: AxiosResponse<Message> = await this.api.post(`/chat/rooms/${chatRoomId}/messages`, {
      content,
      imageUrl,
      fileUrl
    });
    return response.data;
  }

  async markMessagesAsRead(chatRoomId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post(`/chat/rooms/${chatRoomId}/read`);
    return response.data;
  }

  async getOrCreateDirectChat(userId: string): Promise<ChatRoom> {
    const response: AxiosResponse<ChatRoom> = await this.api.post(`/chat/direct/${userId}`);
    return response.data;
  }

  // Notifications endpoints
  async getNotifications(page = 1, limit = 20): Promise<PaginatedResponse<Notification>> {
    const response: AxiosResponse<PaginatedResponse<Notification>> = await this.api.get('/notifications', {
      params: { page, limit }
    });
    return response.data;
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    const response: AxiosResponse<Notification[]> = await this.api.get('/notifications/unread');
    return response.data;
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const response: AxiosResponse<{ count: number }> = await this.api.get('/notifications/unread/count');
    return response.data;
  }

  async getUnreadMessageCount(): Promise<{ count: number }> {
    const response: AxiosResponse<{ count: number }> = await this.api.get('/chat/unread/count');
    return response.data;
  }

  async markChatMessagesAsRead(chatRoomId: string): Promise<{ message: string; count: number }> {
    const response: AxiosResponse<{ message: string; count: number }> = await this.api.post(`/chat/rooms/${chatRoomId}/read`);
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.put('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  async createNotification(notificationData: { 
    userId: string; 
    type: string; 
    title: string; 
    message: string; 
    data?: any 
  }): Promise<Notification> {
    const response: AxiosResponse<Notification> = await this.api.post('/notifications', notificationData);
    return response.data;
  }

  // Chat endpoints
  async createMessage(messageData: { content: string; receiverId: string; chatRoomId: string }): Promise<{ data: any }> {
    const response: AxiosResponse<{ data: any }> = await this.api.post('/chat/messages', messageData);
    return response.data;
  }

  async getChatRooms(): Promise<{ data: any[] }> {
    const response: AxiosResponse<{ data: any[] }> = await this.api.get('/chat/rooms');
    return response.data;
  }


}

export const apiService = new ApiService();
