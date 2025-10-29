'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationToast } from '../components/notifications/NotificationToast';
import { Notification } from '../types';

interface ToastContextType {
  showNotification: (notification: Notification) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{ id: string; notification: Notification }>>([]);

  const showNotification = (notification: Notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, notification }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleViewPost = (postId: string) => {
    // Navegar al post o mostrar en modal
    console.log('Ver post:', postId);
    // window.location.href = `/posts/${postId}`;
  };

  const handleViewProfile = (userId: string) => {
    // Navegar al perfil
    console.log('Ver perfil:', userId);
    // window.location.href = `/profile/${userId}`;
  };

  return (
    <ToastContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Renderizar toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast.notification}
            onClose={() => removeToast(toast.id)}
            onViewPost={handleViewPost}
            onViewProfile={handleViewProfile}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
