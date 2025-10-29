export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  location?: string;
  isVerified: boolean;
  createdAt: string;
  followers?: User[];
  following?: User[];
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author: User;
  comments?: Comment[];
  likes?: Like[];
  media?: Media[];
}

export interface Media {
  type: 'image' | 'video' | 'audio';
  url: string;
  filename?: string;
}

export interface Comment {
  id: string;
  content: string;
  likesCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author: User;
  post: Post;
  likes?: Like[];
}

export interface Like {
  id: string;
  userId: string;
  createdAt: string;
  user: User;
  post?: Post;
  comment?: Comment;
}

export interface ChatRoom {
  id: string;
  name?: string;
  isGroup: boolean;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  participants: User[];
  messages?: Message[];
}

export interface Message {
  id: string;
  content: string;
  imageUrl?: string;
  fileUrl?: string;
  isEdited: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: User;
  chatRoom: ChatRoom;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention';
  message: string;
  isRead: boolean;
  relatedUserId?: string;
  relatedPostId?: string;
  relatedCommentId?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  posts: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FollowingResponse {
  following: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}