'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  MessageCircle, 
  Bell, 
  User, 
  Settings,
  LogOut,
  Plus,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const navigationItems = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Explorar', href: '/explore', icon: Search },
    { name: 'Amigos', href: '/friends', icon: Users },
    { name: 'Mensajes', href: '/chat', icon: MessageCircle },
    { name: 'Notificaciones', href: '/notifications', icon: Bell },
    { name: 'Perfil', href: '/profile', icon: User },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          TGram
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showNotificationBadge = item.name === 'Notificaciones' && unreadCount > 0;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {showNotificationBadge && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              @{user?.email?.split('@')[0] || 'usuario'}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
};