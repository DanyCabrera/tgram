'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useMessages } from './MessageContext';
import { apiService } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { io, Socket } from 'socket.io-client';
import { User } from '../types';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  hasUnreadMessages?: boolean;
  lastMessageTime?: string;
}

interface ChatContextType {
  messages: Message[];
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  isConnected: boolean;
  isConnecting: boolean;
  activeUsers: Set<string>;
  sendMessage: (content: string, receiverId: string) => void;
  joinChatRoom: (userId: string) => void;
  leaveChatRoom: () => void;
  loadMessages: (chatRoomId: string) => void;
  loadChatRooms: () => void;
  loadFollowingUsers: () => Promise<User[]>;
  isUserActive: (userId: string) => boolean;
  showNotification: (message: string, senderName: string) => void;
  forceReconnect: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { refreshMessageCount } = useMessages();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const [ws, setWs] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Función para guardar el estado en localStorage
  const saveStateToStorage = (rooms: ChatRoom[], currentRoom: ChatRoom | null, msgs: Message[]) => {
    if (user) {
      const state = {
        chatRooms: rooms,
        currentChatRoom: currentRoom,
        messages: msgs,
        timestamp: Date.now()
      };
      localStorage.setItem(`chatState_${user.id}`, JSON.stringify(state));
    }
  };

  // Función para cargar el estado desde localStorage
  const loadStateFromStorage = () => {
    if (user) {
      const saved = localStorage.getItem(`chatState_${user.id}`);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          // Solo cargar si el estado es reciente (menos de 1 hora)
          if (Date.now() - state.timestamp < 3600000) {
            setChatRooms(state.chatRooms || []);
            setCurrentChatRoom(state.currentChatRoom || null);
            setMessages(state.messages || []);
            
            // Si hay una sala actual, cargar sus mensajes desde el backend
            if (state.currentChatRoom && !state.currentChatRoom.id.startsWith('temp-')) {
              loadMessages(state.currentChatRoom.id, true);
            }
            
            return true;
          }
        } catch (error) {
          console.error('Error cargando estado del chat:', error);
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (user) {
      // Primero intentar cargar estado desde localStorage
      const stateLoaded = loadStateFromStorage();
      
      if (stateLoaded) {
        console.log('✅ Estado del chat cargado desde localStorage');
        // Si se cargó el estado, también cargar desde el backend para sincronizar
        loadChatRooms(true);
      } else {
        console.log('🔄 Cargando estado del chat desde el backend');
        // Cargar salas de chat desde el backend
        loadChatRooms(false);
      }
      
      // Solicitar permisos para notificaciones
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      // Inicializar WebSocket para mensajería en tiempo real
      initializeWebSocket();
    } else {
      // Limpiar estado cuando no hay usuario
      setMessages([]);
      setChatRooms([]);
      setCurrentChatRoom(null);
      setActiveUsers(new Set());
      if (ws) {
        ws.disconnect();
        setWs(null);
      }
      setIsConnected(false);
      // Limpiar localStorage
      localStorage.removeItem(`chatState_${user?.id}`);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  // Efecto para recargar salas cuando se conecta el WebSocket
  useEffect(() => {
    if (ws && isConnected && user) {
      loadChatRooms(true);
    }
  }, [ws, isConnected, user]);

  // Efecto para guardar el estado cuando cambien las salas
  useEffect(() => {
    if (user && chatRooms.length > 0) {
      saveStateToStorage(chatRooms, currentChatRoom, messages);
    }
  }, [chatRooms, user]);

  // Efecto para guardar el estado cuando cambien los mensajes
  useEffect(() => {
    if (user && messages.length > 0) {
      saveStateToStorage(chatRooms, currentChatRoom, messages);
    }
  }, [messages, user]);

  // Efecto para guardar el estado cuando cambie la sala actual
  useEffect(() => {
    if (user && currentChatRoom) {
      saveStateToStorage(chatRooms, currentChatRoom, messages);
    }
  }, [currentChatRoom, user]);

  // Efecto para unirse automáticamente a la sala cuando cambie
  useEffect(() => {
    if (ws && isConnected && currentChatRoom && !currentChatRoom.id.startsWith('temp-')) {
      ws.emit('join_room', { room: currentChatRoom.id });
    }
  }, [currentChatRoom, ws, isConnected]);

  const initializeWebSocket = () => {
    try {
      // Evitar múltiples conexiones simultáneas
      if (isConnecting || (ws && ws.connected)) {
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      
      setIsConnecting(true);
      
      const socket = io('http://localhost:3001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5,
        upgrade: true,
        rememberUpgrade: false
      });
      
      socket.on('connect', () => {
        console.log('🔌 WebSocket conectado exitosamente');
        setIsConnected(true);
        setIsConnecting(false);
        setWs(socket);
        
        // Forzar sincronización del estado
        console.log('🔄 Estado sincronizado:', { connected: socket.connected, isConnected: true, ws: !!socket });
        
        // Marcar al usuario actual como activo
        if (user) {
          setActiveUsers(prev => new Set([...prev, user.id]));
          console.log('👤 Usuario actual marcado como activo:', user.id);
        }
        
        // Solicitar lista de usuarios activos
        socket.emit('get_active_users');
        
        // Si hay una sala de chat activa, unirse a ella
        if (currentChatRoom && !currentChatRoom.id.startsWith('temp-')) {
          console.log('🏠 Uniéndose a sala existente:', currentChatRoom.id);
          socket.emit('join_room', { room: currentChatRoom.id });
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket desconectado:', reason);
        setIsConnected(false);
        setIsConnecting(false);
        setWs(null);
        
        // Remover al usuario actual de la lista de activos
        if (user) {
          setActiveUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(user.id);
            return newSet;
          });
          console.log('👤 Usuario actual removido de activos:', user.id);
        }
        
        // Reconectar después de 3 segundos solo si el usuario sigue autenticado
        setTimeout(() => {
          if (user && !isConnecting) {
            console.log('🔄 Intentando reconectar WebSocket...');
            initializeWebSocket();
          }
        }, 3000);
      });

      socket.on('new_message', (data) => {
        console.log('📨 Evento new_message recibido:', data);
        console.log('🔍 Estado del socket:', { connected: socket.connected, isConnected, ws: !!ws });
        
        // Procesar el mensaje directamente sin depender del estado interno
        processWebSocketMessage({ type: 'new_message', ...data });
      });

      socket.on('message_notification', (data) => {
        console.log('🔔 Evento message_notification recibido:', data);
        processWebSocketMessage({ type: 'message_notification', ...data });
      });

      socket.on('typing_status', (data) => {
        processWebSocketMessage({ type: 'typing_status', ...data });
      });

      // Eventos para manejar usuarios conectados/desconectados
      socket.on('user_connected', (data) => {
        console.log('👤 Usuario conectado:', data.userId);
        setActiveUsers(prev => new Set([...prev, data.userId]));
      });

      socket.on('user_disconnected', (data) => {
        console.log('👤 Usuario desconectado:', data.userId);
        setActiveUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      socket.on('active_users', (data) => {
        console.log('👥 Usuarios activos recibidos:', data.users);
        setActiveUsers(new Set(data.users));
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión WebSocket:', error);
        setIsConnected(false);
        setIsConnecting(false);
        
        // Intentar reconectar después de un delay
        setTimeout(() => {
          if (user && !isConnecting) {
            console.log('🔄 Reintentando conexión WebSocket después de error...');
            initializeWebSocket();
          }
        }, 5000);
      });

      socket.on('error', (error) => {
        console.error('❌ Error WebSocket:', error);
        setIsConnected(false);
        setIsConnecting(false);
      });

      // Establecer el socket inmediatamente después de crearlo
      setWs(socket);
    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
      setIsConnected(false);
      setIsConnecting(false);
      setWs(null);
    }
  };

  const processWebSocketMessage = (data: any) => {
    console.log('📨 Procesando mensaje WebSocket:', data);
    
    // Sincronizar el estado si es necesario
    if (!isConnected) {
      console.log('🔄 Sincronizando estado de conexión...');
      setIsConnected(true);
    }
    
    // Procesar el mensaje sin verificar el estado interno
    // ya que sabemos que el socket está conectado si recibió el mensaje
    
    switch (data.type) {
      case 'new_message':
        console.log('💬 Procesando nuevo mensaje:', data);
        
        // Verificar si el mensaje es para el usuario actual
        const isMessageForCurrentUser = data.receiverId === user?.id;
        console.log('👤 ¿Mensaje para usuario actual?', isMessageForCurrentUser);
        
        // Agregar mensaje a la lista local si es para la sala actual
        let isCurrentRoom = false;
        
        if (currentChatRoom && isMessageForCurrentUser) {
          // Verificar si es la misma sala de chat
          if (data.chatRoomId === currentChatRoom.id) {
            isCurrentRoom = true;
            console.log('✅ Es la sala actual');
          }
          // Verificar si es una sala temporal y el mensaje es entre los mismos participantes
          else if (currentChatRoom.id.startsWith('temp-') && 
                   currentChatRoom.participants.includes(data.senderId) && 
                   currentChatRoom.participants.includes(data.receiverId)) {
            isCurrentRoom = true;
            console.log('✅ Es sala temporal con mismos participantes');
          }
          // Verificar si el mensaje es entre los mismos participantes (para casos edge)
          else if (currentChatRoom.participants.includes(data.senderId) && 
                   currentChatRoom.participants.includes(data.receiverId)) {
            isCurrentRoom = true;
            console.log('✅ Mismos participantes en sala actual');
          }
        }
        
        // SIEMPRE agregar mensaje si es para el usuario actual, independientemente de si está en la sala
        if (isMessageForCurrentUser) {
          console.log('📝 Agregando mensaje para usuario actual');
          setMessages(prev => {
            // Verificar si el mensaje ya existe para evitar duplicados
            const exists = prev.some(msg => msg.id === data.id);
            if (!exists) {
              console.log('✅ Mensaje agregado a la lista local');
              // Ordenar mensajes por fecha para mantener el orden correcto
              const updatedMessages = [...prev, data].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              return updatedMessages;
            }
            console.log('⚠️ Mensaje ya existe, ignorando');
            return prev;
          });
        }
        
        // Actualizar la lista de salas para mostrar el último mensaje (solo si es para el usuario actual)
        if (isMessageForCurrentUser) {
          console.log('🔄 Actualizando lista de salas');
          
          // Recargar la lista completa de salas desde el backend para asegurar sincronización
          loadChatRooms(true).then(() => {
            // También actualizar el contador global de mensajes no leídos
            refreshMessageCount();
          }).catch(err => {
            console.error('Error recargando salas después de nuevo mensaje:', err);
          });
          
          // Verificar si el usuario está actualmente en esta sala de chat
          const isInCurrentRoom = currentChatRoom && (
            currentChatRoom.id === data.chatRoomId || 
            (currentChatRoom.participants.includes(data.senderId) && 
             currentChatRoom.participants.includes(data.receiverId))
          );
          
          console.log('🏠 ¿Está en sala actual?', isInCurrentRoom);
          console.log('📊 Sala actual:', currentChatRoom?.id);
          console.log('📊 Sala del mensaje:', data.chatRoomId);
          console.log('👥 Participantes sala actual:', currentChatRoom?.participants);
          console.log('👤 Sender ID:', data.senderId);
          console.log('👤 Receiver ID:', data.receiverId);
          
          setChatRooms(prev => {
            const updatedRooms = [...prev];
            const roomIndex = updatedRooms.findIndex(room => room.id === data.chatRoomId);
            
            if (roomIndex !== -1) {
              // Actualizar sala existente
              // Siempre incrementar contador y marcar como no leído cuando llega un mensaje nuevo
              const newUnreadCount = (updatedRooms[roomIndex].unreadCount || 0) + 1;
              const newHasUnreadMessages = true;
              
              console.log('📝 Actualizando sala existente:', {
                roomId: data.chatRoomId,
                isInCurrentRoom,
                oldUnreadCount: updatedRooms[roomIndex].unreadCount,
                newUnreadCount,
                oldHasUnreadMessages: updatedRooms[roomIndex].hasUnreadMessages,
                newHasUnreadMessages
              });
              
              updatedRooms[roomIndex] = {
                ...updatedRooms[roomIndex],
                lastMessage: {
                  id: data.id,
                  content: data.content,
                  senderId: data.senderId,
                  receiverId: data.receiverId,
                  createdAt: data.createdAt,
                  sender: data.sender || { id: data.senderId, name: 'Usuario', email: '' }
                },
                lastMessageTime: data.createdAt,
                unreadCount: newUnreadCount,
                hasUnreadMessages: newHasUnreadMessages
              };
            } else {
              // Agregar nueva sala
              // Siempre marcar como no leído cuando se crea una nueva sala
              const newUnreadCount = 1;
              const newHasUnreadMessages = true;
              
              console.log('🆕 Creando nueva sala:', {
                roomId: data.chatRoomId,
                isInCurrentRoom,
                unreadCount: newUnreadCount,
                hasUnreadMessages: newHasUnreadMessages
              });
              
              const newRoom = {
                id: data.chatRoomId,
                participants: [data.senderId, data.receiverId],
                unreadCount: newUnreadCount,
                hasUnreadMessages: newHasUnreadMessages,
                lastMessage: {
                  id: data.id,
                  content: data.content,
                  senderId: data.senderId,
                  receiverId: data.receiverId,
                  createdAt: data.createdAt,
                  sender: data.sender || { id: data.senderId, name: 'Usuario', email: '' }
                },
                lastMessageTime: data.createdAt
              };
              updatedRooms.unshift(newRoom);
            }
            
            // Ordenar por último mensaje
            const sortedRooms = updatedRooms.sort((a, b) => {
              const timeA = a.lastMessageTime || a.lastMessage?.createdAt || '0';
              const timeB = b.lastMessageTime || b.lastMessage?.createdAt || '0';
              return new Date(timeB).getTime() - new Date(timeA).getTime();
            });
            
            console.log('✅ Salas actualizadas:', sortedRooms.map(room => ({
              id: room.id,
              hasUnreadMessages: room.hasUnreadMessages,
              unreadCount: room.unreadCount,
              lastMessage: room.lastMessage?.content,
              participants: room.participants
            })));
            
            return sortedRooms;
          });
          
          // Mostrar notificación solo si NO está en la sala actual
          if (!isInCurrentRoom) {
            console.log('🔔 Mostrando notificación');
            showNotification(data.content, data.sender?.name || 'Usuario');
          }
        }
        break;
        
      case 'message_notification':
        // Ignorar este evento para evitar duplicación de notificaciones
        // Las notificaciones ya se manejan en el caso 'new_message'
        break;
        
      case 'typing_status':
        break;
        
      case 'chat_rooms':
        setChatRooms(data.chatRooms);
        break;
        
      default:
        break;
    }
  };

  const sendMessage = async (content: string, receiverId: string) => {
    try {
      if (!user || !currentChatRoom) {
        console.log('❌ No hay usuario o sala de chat actual');
        return;
      }
      
      console.log(`📤 Enviando mensaje: "${content}" a ${receiverId} en sala ${currentChatRoom.id}`);
      
      // Crear mensaje usando la API real
      const messageData: any = {
        content,
        receiverId
      };
      
      // Solo enviar chatRoomId si no es una sala temporal
      if (!currentChatRoom.id.startsWith('temp-')) {
        messageData.chatRoomId = currentChatRoom.id;
      }
      
      console.log('📤 Datos del mensaje:', messageData);
      const response = await apiService.createMessage(messageData);
      console.log('📤 Respuesta del backend:', response);
      
      // Si era una sala temporal, actualizar a la sala real
      if (currentChatRoom.id.startsWith('temp-')) {
        setCurrentChatRoom(prev => ({
          ...prev!,
          id: response.data.chatRoomId
        }));
        
        // Unirse a la sala real
        if (ws && isConnected) {
          ws.emit('join_room', { room: response.data.chatRoomId });
        }
      }
      
      // Agregar mensaje a la lista local
      const newMessage = {
        id: response.data.id,
        content: response.data.content,
        senderId: response.data.senderId,
        receiverId: response.data.receiverId,
        chatRoomId: response.data.chatRoomId,
        createdAt: response.data.createdAt,
        sender: {
          id: response.data.sender.id,
          name: response.data.sender.name,
          email: response.data.sender.email
        }
      };
      
      setMessages(prev => {
        // Verificar si el mensaje ya existe para evitar duplicados
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (!exists) {
          // Ordenar mensajes por fecha para mantener el orden correcto
          const updatedMessages = [...prev, newMessage].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return updatedMessages;
        }
        return prev;
      });
      
      // Actualizar la lista de salas para mostrar el último mensaje enviado
      setChatRooms(prev => {
        // Verificar si la sala ya existe
        const existingRoomIndex = prev.findIndex(room => room.id === response.data.chatRoomId);
        
        if (existingRoomIndex !== -1) {
          // Actualizar sala existente
          const updatedRooms = [...prev];
          updatedRooms[existingRoomIndex] = {
            ...updatedRooms[existingRoomIndex],
            lastMessage: {
              id: response.data.id,
              content: response.data.content,
              senderId: response.data.senderId,
              receiverId: response.data.receiverId,
              createdAt: response.data.createdAt,
              sender: response.data.sender || { id: response.data.senderId, name: 'Usuario', email: '' }
            },
            lastMessageTime: response.data.createdAt
          };
          
          // Ordenar por último mensaje (como WhatsApp)
          return updatedRooms.sort((a, b) => {
            const timeA = a.lastMessageTime || a.lastMessage?.createdAt || '0';
            const timeB = b.lastMessageTime || b.lastMessage?.createdAt || '0';
            return new Date(timeB).getTime() - new Date(timeA).getTime();
          });
        } else {
          // Agregar nueva sala solo si no existe
          const newRoom = {
            id: response.data.chatRoomId,
            participants: [user.id, receiverId],
            unreadCount: 0,
            hasUnreadMessages: false,
            lastMessage: {
              id: response.data.id,
              content: response.data.content,
              senderId: response.data.senderId,
              receiverId: response.data.receiverId,
              createdAt: response.data.createdAt,
              sender: response.data.sender || { id: response.data.senderId, name: 'Usuario', email: '' }
            },
            lastMessageTime: response.data.createdAt
          };
          
          const updatedRooms = [newRoom, ...prev];
          
          // Ordenar por último mensaje (como WhatsApp)
          return updatedRooms.sort((a, b) => {
            const timeA = a.lastMessageTime || a.lastMessage?.createdAt || '0';
            const timeB = b.lastMessageTime || b.lastMessage?.createdAt || '0';
            return new Date(timeB).getTime() - new Date(timeA).getTime();
          });
        }
      });
      
      // Si la sala actual es temporal, actualizarla con el ID real del backend
      if (currentChatRoom && currentChatRoom.id.startsWith('temp-')) {
        const realRoomId = response.data.chatRoomId;
        
        setCurrentChatRoom(prev => ({
          ...prev!,
          id: realRoomId
        }));
        
        // Unirse a la sala real de Socket.IO
        if (ws && isConnected) {
          ws.emit('join_room', { room: realRoomId });
        }
        
        // Actualizar la lista de salas para reemplazar la temporal con la real
        setChatRooms(prev => {
          const filteredRooms = prev.filter(room => room.id !== currentChatRoom.id);
          return [...filteredRooms, {
              id: realRoomId,
              participants: [user.id, receiverId],
              lastMessage: {
                id: response.data.id,
                content,
                senderId: user.id,
                receiverId: receiverId,
                createdAt: new Date().toISOString(),
                sender: {
                  id: user.id,
                  name: user.name,
                  email: user.email
                }
              },
              unreadCount: 0
            }];
        });
      } else {
        // Actualizar sala existente
        setChatRooms(prev => prev.map(room => 
          room.id === currentChatRoom.id 
            ? { 
                ...room, 
                lastMessage: {
                  id: response.data.id,
                  content,
                  senderId: user.id,
                  receiverId: receiverId,
                  createdAt: new Date().toISOString(),
                  sender: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                  }
                }
              }
            : room
        ));
      }
      
      // Marcar usuario como activo
      setActiveUsers(prev => new Set([...prev, user.id]));
    } catch (error: any) {
      // Error silencioso para no interrumpir la experiencia del usuario
    }
  };

  const joinChatRoom = async (userId: string) => {
    try {
      if (!user) return;
      
      // Buscar sala existente entre estos dos usuarios
      const existingRoom = chatRooms.find(room => 
        room.participants.includes(userId) && room.participants.includes(user.id)
      );
      
      if (existingRoom) {
        // Usar sala existente
        setCurrentChatRoom(existingRoom);
        
        // Marcar mensajes como leídos
        await markMessagesAsRead(existingRoom.id);
        
        // Unirse a la sala de Socket.IO
        if (ws && isConnected) {
          ws.emit('join_room', { room: existingRoom.id });
        }
        
        // Cargar mensajes existentes
        await loadMessages(existingRoom.id);
      } else {
        // No hay sala existente, crear una temporal hasta que se envíe el primer mensaje
        const tempRoomId = `temp-${userId}-${user.id}`;
        
        setCurrentChatRoom({
          id: tempRoomId,
          participants: [user?.id || '', userId],
          unreadCount: 0
        });
        
        // No unirse a Socket.IO para salas temporales hasta que se envíe el primer mensaje
        // Inicializar con mensajes vacíos para sala temporal
        setMessages([]);
      }
    } catch (error) {
      // Error silencioso para no interrumpir la experiencia del usuario
    }
  };

  const leaveChatRoom = () => {
    setCurrentChatRoom(null);
    // No limpiar los mensajes para que persistan como en WhatsApp
    // setMessages([]);
  };

  const loadMessages = async (chatRoomId: string, preserveExisting: boolean = false) => {
    try {
      if (!user) return;
      
      console.log(`🔍 Cargando mensajes para sala ${chatRoomId}`);
      
      // No cargar mensajes de salas temporales
      if (chatRoomId.startsWith('temp-')) {
        console.log(`⚠️ Sala temporal ${chatRoomId}, no cargando mensajes`);
        if (!preserveExisting) {
        setMessages([]);
        }
        return;
      }
      
      // Cargar mensajes desde el backend usando la API real
      const response = await apiService.getMessages(chatRoomId);
      console.log(`📨 Respuesta del backend:`, response);
      const messagesData = response.posts || [];
      console.log(`📨 Mensajes encontrados: ${messagesData.length}`);
      
      const messages = messagesData.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        chatRoomId: msg.chatRoomId,
        createdAt: msg.createdAt,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          email: msg.sender.email
        }
      }));
      
      if (preserveExisting) {
        // Preservar mensajes existentes y agregar solo los nuevos
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = messages.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...newMessages];
        });
      } else {
        // Reemplazar mensajes existentes (comportamiento normal)
      setMessages(messages);
      }
    } catch (error) {
      if (!preserveExisting) {
      setMessages([]);
      }
    }
  };

  const loadChatRooms = async (mergeWithExisting: boolean = false) => {
    try {
      if (!user) return;
      
      // Cargar salas de chat desde el backend usando la API real
      const response = await apiService.getChatRooms();
      const rooms = (response as any).data || [];
      
      console.log('🔍 Salas cargadas desde el backend:', rooms);
      
      // Si se debe fusionar con datos existentes, no sobrescribir
      if (mergeWithExisting && chatRooms.length > 0) {
        console.log('🔄 Fusionando con datos existentes');
        return;
      }
      
      // Mapear las salas para incluir información adicional
      const mappedRooms = rooms.map((room: any) => {
        // Al cargar desde el servidor, no asumir mensajes no leídos
        // Solo usar el contador que viene del backend si existe
        const unreadCount = room.unreadCount || 0;
        
        return {
        id: room.id,
        participants: room.participants,
          unreadCount: unreadCount,
          hasUnreadMessages: unreadCount > 0,
        lastMessage: room.lastMessage ? {
          id: room.lastMessage.id || '',
          content: room.lastMessage.content,
          senderId: room.lastMessage.senderId || '',
          receiverId: room.lastMessage.receiverId || '',
          createdAt: room.lastMessage.createdAt,
          sender: room.lastMessage.sender || { id: room.lastMessage.senderId || '', name: 'Usuario', email: '' }
          } : undefined,
          lastMessageTime: room.lastMessage?.createdAt || '0'
        };
      });

      // Filtrar salas que no tienen participantes válidos o que son salas vacías
      const validRooms = mappedRooms.filter((room: any) => {
        console.log('🔍 Evaluando sala:', {
          id: room.id,
          participants: room.participants,
          hasLastMessage: !!room.lastMessage,
          lastMessageContent: room.lastMessage?.content
        });
        
        // Verificar que la sala tiene participantes válidos
        if (!room.participants || room.participants.length === 0) {
          console.log('  ❌ Sin participantes');
          return false;
        }
        
        // Verificar que al menos uno de los participantes no es el usuario actual
        const hasOtherParticipants = room.participants.some((participantId: string) => participantId !== user?.id);
        if (!hasOtherParticipants) {
          console.log('  ❌ Solo tiene al usuario actual');
          return false;
        }
        
        // Si no hay mensajes, verificar que la sala tiene al menos 2 participantes válidos
        if (!room.lastMessage && room.participants.length < 2) {
          console.log('  ❌ Sin mensajes y menos de 2 participantes');
          return false;
        }
        
        console.log('  ✅ Sala válida');
        return true;
      });
      
      console.log('🔍 Salas válidas después del filtro:', validRooms.length);
      
      // Ordenar por último mensaje (como WhatsApp)
      const sortedRooms = validRooms.sort((a: any, b: any) => {
        const timeA = a.lastMessageTime || a.lastMessage?.createdAt || '0';
        const timeB = b.lastMessageTime || b.lastMessage?.createdAt || '0';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });
      
      setChatRooms(sortedRooms);
    } catch (error) {
      setChatRooms([]);
    }
  };

  const isUserActive = (userId: string) => {
    // Solo mostrar estado de conexión si el usuario actual está autenticado
    if (!user) {
      console.log('🔍 No hay usuario autenticado, retornando false');
      return false;
    }
    
    const isActive = activeUsers.has(userId);
    console.log(`🔍 Verificando estado de usuario ${userId}:`, {
      isActive,
      activeUsers: Array.from(activeUsers),
      isConnected,
      wsConnected: ws?.connected
    });
    return isActive;
  };

  const markMessagesAsRead = async (chatRoomId: string) => {
    try {
      // No marcar salas temporales
      if (chatRoomId.startsWith('temp-')) {
        return;
      }

      // Marcar mensajes como leídos en el backend
      await apiService.markChatMessagesAsRead(chatRoomId);
      
      // Actualizar estado local
      setChatRooms(prev => prev.map(room => 
        room.id === chatRoomId 
          ? { 
              ...room, 
              unreadCount: 0,
              hasUnreadMessages: false
            }
          : room
      ));
      
      // Actualizar el contador global de mensajes no leídos
      refreshMessageCount();
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  const showNotification = (message: string, senderName: string) => {
    // Notificación del navegador
    if (Notification.permission === 'granted') {
      new Notification(`Nuevo mensaje de ${senderName}`, {
        body: message,
        icon: '/favicon.ico',
        requireInteraction: false,
        silent: false
      });
    }
  };


  const loadFollowingUsers = async (): Promise<User[]> => {
    try {
      const response = await apiService.getMyFollowing();
      return response.following;
    } catch (error) {
      console.error('Error cargando usuarios seguidos:', error);
      return [];
    }
  };

  const forceReconnect = () => {
    console.log('🔄 Forzando reconexión del WebSocket...');
    if (ws) {
      ws.disconnect();
    }
    setIsConnected(false);
    setIsConnecting(false);
    setWs(null);
    
    // Reconectar inmediatamente
    setTimeout(() => {
      if (user) {
        initializeWebSocket();
      }
    }, 1000);
  };

  const value = {
    messages,
    chatRooms,
    currentChatRoom,
    isConnected,
    isConnecting,
    activeUsers,
    sendMessage,
    joinChatRoom,
    leaveChatRoom,
    loadMessages,
    loadChatRooms,
    loadFollowingUsers,
    isUserActive,
    showNotification,
    forceReconnect
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
