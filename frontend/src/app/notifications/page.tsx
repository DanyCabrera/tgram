'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { apiService } from '../../services/api';
import { Notification } from '../../types';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Check,
  X,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      loadNotifications();
    }
  }, [user, loading]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Cargar notificaciones desde la API
      const response = await apiService.getNotifications();
      console.log('Respuesta de notificaciones:', response);
      
      // El backend devuelve { notifications: [...], total, page, limit, totalPages }
      if (response && response.notifications && Array.isArray(response.notifications)) {
        setNotifications(response.notifications);
      } else {
        console.warn('Estructura de respuesta inesperada:', response);
        setNotifications([]);
      }
    } catch (error: any) {
      console.error('Error cargando notificaciones:', error);
      setError('Error al cargar las notificaciones');
      setNotifications([]); // Asegurar que notifications sea un array
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      if (!user) return;
      
      // Marcar como leída usando la API
      await apiService.markNotificationAsRead(notificationId);
      
      loadNotifications();
      refreshNotifications(); // Refresh global count
    } catch (error: any) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      
      // Marcar todas como leídas usando la API
      await apiService.markAllNotificationsAsRead();
      
      loadNotifications();
      refreshNotifications(); // Refresh global count
    } catch (error: any) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      if (!user) return;
      
      // Eliminar usando la API
      await apiService.deleteNotification(notificationId);
      
      loadNotifications();
      refreshNotifications(); // Refresh global count
    } catch (error: any) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-green-500" />;
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
      default:
        return 'bg-gray-50 border-gray-200';
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
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-ES');
  };

  if (loading || isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando notificaciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No autenticado
            </h1>
            <p className="text-gray-600 mb-8">
              Necesitas iniciar sesión para ver tus notificaciones
            </p>
            <a 
              href="/"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notificaciones
            </h1>
              <p className="text-gray-600">
                Mantente al día con las últimas actividades
              </p>
          </div>
          
            {notifications && notifications.length > 0 && (
            <Button
                onClick={markAllAsRead}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Marcar todas como leídas</span>
            </Button>
            )}
          </div>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}


        {/* Notificaciones */}
        {(!notifications || notifications.length === 0) ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
          </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-600">
                Cuando alguien interactúe con tus publicaciones o te siga, aparecerá aquí
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-xl border p-6 transition-all duration-200 hover:shadow-lg ${
                  notification.isRead 
                    ? 'border-gray-200' 
                    : `${getNotificationColor(notification.type)} border-l-4`
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-600' : 'text-gray-900'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="flex items-center space-x-1 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(notification.createdAt)}</span>
                        </div>
                        
                        {!notification.isRead && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {notification.relatedPostId && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/posts/${notification.relatedPostId}`}
                        >
                          Ver publicación
                        </Button>
                      </div>
                    )}
                    
                    {notification.relatedUserId && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/profile/${notification.relatedUserId}`}
                        >
                          Ver perfil
                        </Button>
            </div>
          )}
        </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}