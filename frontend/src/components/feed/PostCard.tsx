'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  User,
  Clock,
  Image as ImageIcon,
  Video,
  Music,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { CommentSection } from './CommentSection';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
  onPostUpdated?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onComment, 
  onDelete,
  currentUserId,
  onPostUpdated
}) => {
  // Verificar si el usuario actual ya dio like a este post
  const userLiked = currentUserId && post.likes && Array.isArray(post.likes) && post.likes.some(like => like.userId === currentUserId);
  const [isLiked, setIsLiked] = useState(!!userLiked);
  const [likes, setLikes] = useState(post.likesCount);

  // Actualizar estado cuando cambie el post
  useEffect(() => {
    const userLiked = currentUserId && post.likes && Array.isArray(post.likes) && post.likes.some(like => like.userId === currentUserId);
    setIsLiked(!!userLiked);
    setLikes(post.likesCount);
  }, [post.likes, post.likesCount, currentUserId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    onLike(post.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'video': return Video;
      case 'audio': return Music;
      default: return ImageIcon;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
            {post.author.avatar ? (
              <img 
                src={post.author.avatar} 
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <Link href={`/profile/${post.author.id}`}>
              <h3 className="text-gray-900 font-semibold hover:text-blue-600 cursor-pointer transition-colors">
                {post.author.name}
              </h3>
            </Link>
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <Link href={`/profile/${post.author.id}`}>
                <span className="hover:text-blue-600 cursor-pointer transition-colors">
                  @{post.author.username}
                </span>
              </Link>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Solo mostrar botón de eliminar si es el autor del post */}
          {currentUserId === post.author.id && onDelete && (
            <Button 
              onClick={() => onDelete(post.id)}
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Eliminar publicación"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-900 text-lg leading-relaxed">{post.content}</p>
      </div>

      {/* Media */}
      {((post.imageUrl || post.videoUrl) || (post.media && post.media.length > 0)) && (
        <div className="mb-4">
          <div className="relative">
            {/* Legacy single image/video */}
            {post.imageUrl && (
              <img 
                src={post.imageUrl} 
                alt="Post media" 
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            {post.videoUrl && (
              <video 
                src={post.videoUrl} 
                controls 
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            
            {/* Multiple media from array */}
            {post.media && post.media.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {post.media.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'image' && (
                      <img 
                        src={media.url} 
                        alt={media.filename || `Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    {media.type === 'video' && (
                      <video 
                        src={media.url} 
                        controls 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            onClick={handleLike}
            className={`flex items-center space-x-2 ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount}</span>
          </Button>

        </div>
      </div>

      {/* Sección de comentarios */}
      <CommentSection
        postId={post.id}
        comments={post.comments || []}
        currentUserId={currentUserId}
        onCommentAdded={onPostUpdated}
      />
    </div>
  );
};