'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2, 
  X,
  Bell
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Notification } from '../../types';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onViewPost?: (postId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onViewPost,
  onViewProfile
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar toast con animación
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-ocultar después de 5 segundos
    const autoHideTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHideTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Esperar a que termine la animación
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'SHARE':
        return <Share2 className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LIKE':
        return 'bg-red-50 border-red-200';
      case 'COMMENT':
        return 'bg-blue-50 border-blue-200';
      case 'FOLLOW':
        return 'bg-green-50 border-green-200';
      case 'SHARE':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleAction = () => {
    if (notification.relatedPostId && onViewPost) {
      onViewPost(notification.relatedPostId);
    } else if (notification.relatedUserId && onViewProfile) {
      onViewProfile(notification.relatedUserId);
    }
    handleClose();
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      } ${getNotificationColor(notification.type)}`}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {notification.message}
            </p>
            
            <div className="mt-2 flex items-center space-x-2">
              {(notification.relatedPostId || notification.relatedUserId) && (
                <Button
                  onClick={handleAction}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {notification.relatedPostId ? 'Ver publicación' : 'Ver perfil'}
                </Button>
              )}
              
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
