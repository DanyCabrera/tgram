import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { webSocketService } from '../services/websocket';

interface NotificationData {
  type: 'like' | 'comment' | 'follow' | 'message';
  message: string;
  timestamp: Date;
  data?: any;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    if (!user) return;

    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    // Conectar al WebSocket
    webSocketService.connect(token);

    // Configurar listeners para notificaciones
    webSocketService.onLikeNotification((data) => {
      const notification: NotificationData = {
        type: 'like',
        message: `${data.likerName} le dio like a tu publicación`,
        timestamp: new Date(),
        data
      };
      showNotificationToast(notification);
    });

    webSocketService.onCommentNotification((data) => {
      const notification: NotificationData = {
        type: 'comment',
        message: `${data.commenterName} comentó en tu publicación`,
        timestamp: new Date(),
        data
      };
      showNotificationToast(notification);
    });

    webSocketService.onFollowNotification((data) => {
      const notification: NotificationData = {
        type: 'follow',
        message: `${data.followerName} comenzó a seguirte`,
        timestamp: new Date(),
        data
      };
      showNotificationToast(notification);
    });

    webSocketService.onMessageNotification((data) => {
      const notification: NotificationData = {
        type: 'message',
        message: `${data.senderName} te envió un mensaje`,
        timestamp: new Date(),
        data
      };
      showNotificationToast(notification);
    });

    // Cleanup al desmontar
    return () => {
      webSocketService.disconnect();
    };
  }, [user]);

  const showNotificationToast = (notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Mantener solo las últimas 5
    setCurrentNotification(notification);
    setShowNotification(true);

    // Auto-hide después de 5 segundos
    setTimeout(() => {
      setShowNotification(false);
      setCurrentNotification(null);
    }, 5000);
  };

  const dismissNotification = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };

  return {
    notifications,
    showNotification,
    currentNotification,
    dismissNotification
  };
};
