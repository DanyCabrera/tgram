'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { showNotification } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    if (!user || loading) {
      setUnreadCount(0);
      return;
    }
    
    try {
      // Cargar notificaciones desde la API
      const response = await apiService.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error cargando notificaciones no leídas:', error);
      setUnreadCount(0);
    }
  };

  const refreshNotifications = () => {
    loadUnreadCount();
  };

  useEffect(() => {
    if (user && !loading) {
      loadUnreadCount();
      
      // Conectar a WebSocket para notificaciones en tiempo real
      const token = localStorage.getItem('token');
      if (token) {
        webSocketService.connect(token);
        
        // Escuchar notificaciones de likes
        webSocketService.onLikeNotification((data) => {
          console.log('Nueva notificación de like:', data);
          // Actualizar contador de notificaciones
          loadUnreadCount();
        });
        
        // Escuchar notificaciones de comentarios
        webSocketService.onCommentNotification((data) => {
          console.log('Nueva notificación de comentario:', data);
          // Actualizar contador de notificaciones
          loadUnreadCount();
        });
        
        // Escuchar notificaciones de seguidores
        webSocketService.onFollowNotification((data) => {
          console.log('Nueva notificación de seguimiento:', data);
          // Actualizar contador de notificaciones
          loadUnreadCount();
        });
      }
    } else {
      setUnreadCount(0);
      webSocketService.disconnect();
    }
  }, [user, loading]);

  // Limpiar conexión al desmontar
  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const value = {
    unreadCount,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
