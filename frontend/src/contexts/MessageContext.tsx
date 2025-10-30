'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';

interface MessageContextType {
  unreadMessageCount: number;
  refreshMessageCount: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Log cuando cambia el contador
  useEffect(() => {
    console.log('📊 MessageContext: Contador actualizado a:', unreadMessageCount);
  }, [unreadMessageCount]);

  const loadUnreadMessageCount = async () => {
    if (!user) {
      console.log('🔍 MessageContext: No hay usuario, contador = 0');
      setUnreadMessageCount(0);
      return;
    }
    
    try {
      console.log('🔍 MessageContext: Cargando contador de mensajes para usuario:', user.id);
      console.log('🔍 MessageContext: Token disponible:', !!localStorage.getItem('token'));
      
      // Cargar contador de mensajes no leídos desde la API
      const response = await apiService.getUnreadMessageCount();
      console.log('📨 MessageContext: Respuesta del API:', response);
      console.log('📨 MessageContext: Tipo de respuesta:', typeof response);
      console.log('📨 MessageContext: Count en respuesta:', response?.count);
      console.log('📨 MessageContext: Estableciendo contador a:', response.count);
      
      const count = response?.count || 0;
      setUnreadMessageCount(count);
      
      console.log('✅ MessageContext: Contador establecido exitosamente a:', count);
    } catch (error) {
      console.error('❌ MessageContext: Error cargando mensajes no leídos:', error);
      console.error('❌ MessageContext: Detalles del error:', error);
      setUnreadMessageCount(0);
    }
  };

  const refreshMessageCount = () => {
    console.log('🔄 MessageContext: Refrescando contador de mensajes...');
    loadUnreadMessageCount();
  };

  useEffect(() => {
    if (user) {
      loadUnreadMessageCount();
      
      // Conectar a WebSocket para mensajes en tiempo real
      const token = localStorage.getItem('token');
      if (token) {
        webSocketService.connect(token);
        
        // Escuchar notificaciones de mensajes
        webSocketService.onMessageNotification((data) => {
          console.log('📨 MessageContext: Nueva notificación de mensaje recibida:', data);
          // Actualizar contador de mensajes
          loadUnreadMessageCount();
        });
        
        // También escuchar el evento 'new_message' para actualizar el contador
        const socket = webSocketService.socketInstance;
        if (socket) {
          socket.on('new_message', (data: any) => {
            console.log('📨 MessageContext: Nuevo mensaje recibido, actualizando contador...');
            // Solo actualizar si el mensaje es para el usuario actual
            if (data.receiverId === user.id) {
              loadUnreadMessageCount();
            }
          });
        }
      }
    } else {
      setUnreadMessageCount(0);
      webSocketService.disconnect();
    }
  }, [user]);

  // Limpiar conexión al desmontar
  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const value = {
    unreadMessageCount,
    refreshMessageCount,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
