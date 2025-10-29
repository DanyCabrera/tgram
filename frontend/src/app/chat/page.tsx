'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { apiService } from '../../services/api';
import { User } from '../../types';
import { 
  MessageCircle, 
  Search,
  Users,
  Send,
  Wifi,
  WifiOff,
  ArrowLeft,
  Check,
  CheckCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatTime, formatDate } from '../../utils/dateUtils';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { 
    messages, 
    chatRooms,
    currentChatRoom,
    isConnected, 
    isConnecting, 
    sendMessage, 
    joinChatRoom, 
    leaveChatRoom,
    loadFollowingUsers,
    isUserActive,
    forceReconnect
  } = useChat();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !loading) {
      loadUsers();
      // Mostrar usuarios automáticamente si no hay conversaciones
      if (chatRooms.length === 0) {
        setShowFriends(true);
      }
    }
  }, [user, loading, chatRooms.length]);

  // Efecto para hacer scroll automático cuando lleguen nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUsers = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      // Cargar todos los usuarios disponibles
      const response = await apiService.searchUsers('');
      setUsers(response.users.filter(u => u.id !== user.id));
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    joinChatRoom(user.id);
    setShowMobileChat(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedUser) {
      sendMessage(newMessage.trim(), selectedUser.id);
      setNewMessage('');
    }
  };


  const getMessageStatus = (message: any) => {
    if (message.senderId === user?.id) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando chat...</p>
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
              Necesitas iniciar sesión para usar el chat
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
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Sidebar de conversaciones - Desktop */}
        <div className={`w-80 bg-white border-r border-gray-200 flex flex-col h-full ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
                <div className="flex items-center space-x-2">
                  {/* Indicador de estado de conexión */}
                  <div className="flex items-center space-x-2">
                    {isConnecting ? (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">Conectando...</span>
                      </div>
                    ) : isConnected ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span className="text-xs font-medium">Conectado</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-red-600">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-xs font-medium">Desconectado</span>
                        <button
                          onClick={forceReconnect}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors font-medium"
                        >
                          Reconectar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mx-4 mb-4">
                {error}
              </div>
            )}
            
            {searchQuery || showFriends ? (
              <div className="flex flex-col h-full">
                {/* Header con título */}
                <div className="p-4 border-b border-gray-200 shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    {searchQuery ? 'Resultados de búsqueda' : 'Todos los usuarios'}
                </h3>
              </div>
                
                {/* Lista de usuarios para nueva conversación - Más grande */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                        className="w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 text-left hover:bg-gray-100 text-gray-700 hover:shadow-sm"
                  >
                    <div className="relative">
                          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                      </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                            isUserActive(user.id) ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold truncate text-base">{user.name}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isUserActive(user.id) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isUserActive(user.id) ? 'En línea' : 'Desconectado'}
                          </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">@{user.email.split('@')[0]}</p>
                    </div>
                  </button>
                ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Conversaciones</h3>
                <div className="space-y-3">
                  {chatRooms.map((room, index) => {
                    // Obtener el otro participante (no el usuario actual)
                    const otherParticipant = room.participants.find(p => p !== user?.id);
                    const otherUser = users.find(u => u.id === otherParticipant);
                    
                    // Crear una clave única combinando el ID de la sala y el índice
                    const uniqueKey = `${room.id}-${index}`;
                    
                    return (
                      <button
                        key={uniqueKey}
                        onClick={() => {
                          if (otherUser) {
                            handleUserSelect(otherUser);
                          }
                        }}
                        className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 text-left ${
                          selectedUser?.id === otherUser?.id
                            ? 'bg-gray-900 text-white shadow-lg'
                            : room.hasUnreadMessages
                            ? 'hover:bg-gray-100 text-gray-900 bg-gray-50 border-l-4 border-gray-400'
                            : 'hover:bg-gray-100 text-gray-700 hover:shadow-sm'
                        }`}
                      >
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            selectedUser?.id === otherUser?.id
                              ? 'bg-white text-gray-900'
                              : 'bg-gray-600'
                          }`}>
                            {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                            isUserActive(otherUser?.id || '') ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`truncate font-semibold text-base ${room.hasUnreadMessages ? 'font-bold' : 'font-semibold'}`}>
                              {otherUser?.name || 'Usuario'}
                            </p>
                            <span className="text-xs text-gray-500 font-medium">
                              {room.lastMessage?.createdAt ? formatTime(room.lastMessage.createdAt) : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${room.hasUnreadMessages ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                              {room.lastMessage?.content || 'Sin mensajes'}
                            </p>
                            {room.hasUnreadMessages && room.unreadCount > 0 && (
                              <div className="bg-gray-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                {room.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Área de chat principal */}
        <div className={`flex-1 flex flex-col h-full ${!showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Header del chat */}
              <div className="bg-white border-b border-gray-200 p-4 shrink-0">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      {isUserActive(selectedUser.id) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedUser.name}</h2>
                      <p className="text-sm text-gray-500">
                        {isUserActive(selectedUser.id) ? 'En línea' : 'Desconectado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Área de mensajes */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                      <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No hay mensajes aún</h3>
                      <p className="text-gray-500 text-lg">Envía un mensaje para comenzar la conversación</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwnMessage = message.senderId === user?.id;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
                    const showDate = !prevMessage || 
                      new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-6">
                            <span className="bg-white px-4 py-2 rounded-full text-sm text-gray-500 shadow-sm font-medium">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-6' : 'mt-2'}`}>
                          <div className={`flex max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isOwnMessage && showAvatar && (
                              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-1">
                                {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className={`px-6 py-4 rounded-2xl shadow-sm ${
                              isOwnMessage 
                                ? 'bg-gray-800 text-white rounded-br-md' 
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <div className={`flex items-center justify-end mt-2 space-x-1 ${
                                isOwnMessage ? 'text-gray-300' : 'text-gray-400'
                              }`}>
                                <span className="text-xs font-medium">{formatTime(message.createdAt)}</span>
                                {isOwnMessage && getMessageStatus(message)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="bg-white border-t border-gray-200 p-6 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                  <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-gray-50 text-sm"
                  />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !isConnected}
                    className="px-8 py-4 bg-gray-800 text-white rounded-2xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-500 text-lg">
                  Elige un usuario para comenzar a chatear
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}