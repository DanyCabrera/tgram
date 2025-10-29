'use client';

import React from 'react';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2,
  Bell,
  Clock
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention';
  title: string;
  message: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isRead: boolean;
  postId?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead 
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-purple-500" />;
      case 'mention':
        return <Bell className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div 
      className={`p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-gray-800/50' : ''
      }`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-white font-semibold">
              {notification.user.name}
            </span>
            <span className="text-gray-400">
              {notification.title}
            </span>
          </div>
          
          <p className="text-gray-300 text-sm mt-1">
            {notification.message}
          </p>
          
          <div className="flex items-center space-x-2 mt-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">
              {formatTime(notification.timestamp)}
            </span>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {notification.user.name.charAt(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
