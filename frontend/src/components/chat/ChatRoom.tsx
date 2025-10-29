'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Image, 
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Search,
  Users
} from 'lucide-react';
import { Button } from '../ui/Button';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio';
}

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  participants: number;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ 
  roomId, 
  roomName, 
  participants 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages para desarrollo
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        content: '¡Hola! ¿Cómo estás?',
        sender: {
          id: '1',
          name: 'Juan Pérez',
          avatar: undefined
        },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text'
      },
      {
        id: '2',
        content: '¡Hola Juan! Todo bien, gracias. ¿Y tú?',
        sender: {
          id: '2',
          name: 'María García',
          avatar: undefined
        },
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        type: 'text'
      },
      {
        id: '3',
        content: 'Perfecto! Estoy trabajando en un nuevo proyecto. ¿Te gustaría verlo?',
        sender: {
          id: '1',
          name: 'Juan Pérez',
          avatar: undefined
        },
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        type: 'text'
      }
    ];
    setMessages(mockMessages);
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: {
        id: 'current-user',
        name: 'Tú',
        avatar: undefined
      },
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{roomName}</h3>
            <p className="text-sm text-gray-400">{participants} participantes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Search className="w-5 h-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-5 h-5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender.id === 'current-user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-3 max-w-xs lg:max-w-md ${message.sender.id === 'current-user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {message.sender.name.charAt(0)}
                </span>
              </div>
              
              <div className={`flex flex-col ${message.sender.id === 'current-user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2 rounded-2xl ${
                  message.sender.id === 'current-user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">...</span>
              </div>
              <div className="bg-gray-800 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 flex items-center space-x-2">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="w-5 h-5 text-gray-400" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Image className="w-5 h-5 text-gray-400" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Smile className="w-5 h-5 text-gray-400" />
            </Button>
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
