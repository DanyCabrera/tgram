'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  User, 
  Heart,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Comment, User as UserType } from '../../types';
import { apiService } from '../../services/api';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUserId?: string;
  onCommentAdded?: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  currentUserId,
  onCommentAdded
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newComment = await apiService.createComment(postId, commentText.trim());
      
      // Agregar el comentario localmente para actualización inmediata
      setLocalComments(prev => [newComment, ...prev]);
      setCommentText('');
      
      // Notificar al componente padre
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error creando comentario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Botón para mostrar/ocultar comentarios */}
      <Button
        variant="ghost"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{localComments.length} comentarios</span>
      </Button>

      {/* Input de comentario */}
      <form onSubmit={handleSubmitComment} className="mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              maxLength={500}
              style={{color: 'black'}}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {commentText.length}/500
              </span>
              <Button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="flex items-center space-x-1"
                size="sm"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando...' : 'Comentar'}</span>
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Lista de comentarios */}
      {showComments && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {localComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay comentarios aún</p>
              <p className="text-sm">Sé el primero en comentar</p>
            </div>
          ) : (
            localComments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                  {comment.author.avatar ? (
                    <img 
                      src={comment.author.avatar} 
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {comment.author.name}
                    </span>
                    <span className="text-gray-500 text-xs">
                      @{comment.author.username}
                    </span>
                    <div className="flex items-center space-x-1 text-gray-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(comment.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm mb-2">{comment.content}</p>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
                    >
                      <Heart className="w-3 h-3" />
                      <span className="text-xs">{comment.likesCount}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
