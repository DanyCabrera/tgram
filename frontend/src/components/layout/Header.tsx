'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useMessages } from '../../contexts/MessageContext';
import { Button } from '../ui/Button';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  MessageCircle,
  User,
  Settings,
  LogOut
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadMessageCount } = useMessages();
  const router = useRouter();
  
  // Debug logs
  console.log('🔍 Header: unreadMessageCount =', unreadMessageCount);
  console.log('🔍 Header: unreadCount (notifications) =', unreadCount);
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            TGram
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                Registrarse
              </Button>
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          TGram
        </Link>


        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Messages */}
          <Link href="/chat">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 relative">
              <MessageCircle className="w-5 h-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          
          
          {/* Profile */}
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
              <User className="w-5 h-5" />
            </Button>
          </Link>
          
          {/* Settings */}
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
          
          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-red-600"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>
    </header>
  );
};