'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { MessageCircle, Send, User, MoreHorizontal, Archive, UserX, UserCheck, Smile, Image, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScrollArea } from '../../components/ui/ScrollArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Avatar, AvatarFallback } from '../../components/ui/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/DropdownMenu';
import { Badge } from '../../components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  isArchived?: boolean;
  isBlocked?: boolean;
}

interface OnlineUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const { 
    messages, 
    chatRooms, 
    currentChatRoom, 
    isConnected,
    sendMessage, 
    joinChatRoom, 
    leaveChatRoom, 
    loadMessages, 
    loadChatRooms 
  } = useChat();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadChatRooms();
    }
  }, [user, loadChatRooms]);

  // Convertir chatRooms a conversaciones para la UI
  useEffect(() => {
    const mappedConversations = chatRooms.map((room) => {
      const otherUserId = room.participants.find(id => id !== user?.id);
      return {
        id: room.id,
        otherUser: {
          id: otherUserId || '',
          name: 'Usuario', // TODO: Obtener nombre real del usuario
          username: 'usuario',
          avatar: undefined
        },
        lastMessage: room.lastMessage ? {
          id: room.lastMessage.id,
          content: room.lastMessage.content,
          senderId: room.lastMessage.senderId,
          receiverId: room.lastMessage.receiverId,
          createdAt: room.lastMessage.createdAt,
          sender: {
            id: room.lastMessage.sender.id,
            name: room.lastMessage.sender.name,
            username: room.lastMessage.sender.name, // Usar name como username temporalmente
            email: room.lastMessage.sender.email,
            avatar: undefined
          }
        } : undefined,
        unreadCount: room.unreadCount || 0,
        isArchived: false,
        isBlocked: false
      };
    });
    setConversations(mappedConversations);
  }, [chatRooms, user?.id]);

  const handleLoadMessages = async (conversationId: string) => {
    try {
      await loadMessages(conversationId);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage(newMessage, selectedConversation);
      setNewMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const handleArchiveConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setArchivedConversations((prev: Conversation[]) => [...prev, { ...conversation, isArchived: true }]);
      setConversations((prev: Conversation[]) => prev.filter(c => c.id !== conversationId));
      if (selectedConversation === conversation.otherUser.id) {
        setSelectedConversation(null);
      }
    }
  };

  const handleUnarchiveConversation = (conversationId: string) => {
    const conversation = archivedConversations.find(c => c.id === conversationId);
    if (conversation) {
      setConversations((prev: Conversation[]) => [...prev, { ...conversation, isArchived: false }]);
      setArchivedConversations((prev: Conversation[]) => prev.filter(c => c.id !== conversationId));
    }
  };

  const handleBlockUser = (conversationId: string) => {
    setConversations((prev: Conversation[]) =>
      prev.map((conv: Conversation) => 
        conv.id === conversationId 
          ? { ...conv, isBlocked: true } 
          : conv
      )
    );
  };

  const handleUnblockUser = (conversationId: string) => {
    setConversations((prev: Conversation[]) =>
      prev.map((conv: Conversation) => 
        conv.id === conversationId 
          ? { ...conv, isBlocked: false } 
          : conv
      )
    );
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      alert('Files must be less than 2MB');
      return;
    }

    // Convert file to base64 and send as message
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        await sendMessage(`[Imagen] ${base64}`, selectedConversation);
      } catch (error) {
        console.error('Error sending image:', error);
      }
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messenger</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Logged in as {user?.name}</p>
            <div className="flex items-center">
              {isConnected && (
                <span className="flex items-center text-xs text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  Connected
                </span>
              )}
              {!isConnected && (
                <span className="flex items-center text-xs text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                  Disconnected
                </span>
              )}
            </div>
          </div>
        </div>

        {connectionError && (
          <Alert variant="destructive" className="m-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="text-xs">
              {connectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Online Users Section */}
        <div className="border-b">
          <div className="p-3 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">Online Users</h3>
          </div>
          <ScrollArea className="h-[200px]">
            {isConnected ? (
              <>
                {onlineUsers
                  .filter((user) => user.id !== user?.id)
                  .map((onlineUser) => {
                    const hasConversation = conversations.some((conv) => conv.otherUser.id === onlineUser.id);
                    const isArchived = archivedConversations.some((conv) => conv.otherUser.id === onlineUser.id);

                    return (
                      <div
                        key={onlineUser.id}
                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 ${selectedConversation === onlineUser.id ? "bg-gray-100" : ""}`}
                        onClick={() => {
                          setSelectedConversation(onlineUser.id);
                          joinChatRoom(onlineUser.id);
                        }}
                      >
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback>{onlineUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium truncate">{onlineUser.name}</p>
                            {hasConversation && (
                              <Badge variant="outline" className="ml-2">
                                Chat
                              </Badge>
                            )}
                            {isArchived && (
                              <Badge variant="secondary" className="ml-2">
                                Archived
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full mr-2 bg-green-500" />
                            <p className="text-sm text-gray-500">Online</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {onlineUsers.filter((user) => user.id !== user?.id).length === 0 && (
                  <div className="p-4 text-center text-gray-500">No other users online</div>
                )}
              </>
            ) : (
              <div className="p-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">
                  {isConnected ? "Connecting to server..." : "Disconnected. Please reconnect to see online users."}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chats and Archived Tabs */}
        <Tabs defaultValue="chats" className="flex-1">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="m-0 flex-1">
            <ScrollArea className="h-[calc(100vh-450px)]">
              {conversations
                .filter((conv) => !conv.isArchived)
                .map((conversation) => {
                  const isOnline = onlineUsers.some(u => u.id === conversation.otherUser.id);

                  return (
                    <div
                      key={conversation.id}
                      className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 ${selectedConversation === conversation.otherUser.id ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setSelectedConversation(conversation.otherUser.id);
                        joinChatRoom(conversation.otherUser.id);
                      }}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>{conversation.otherUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">{conversation.otherUser.name}</p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleArchiveConversation(conversation.id);
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          {conversation.isBlocked ? (
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleUnblockUser(conversation.id);
                              }}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Unblock
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleBlockUser(conversation.id);
                              }}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Block
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}

              {conversations.filter((c) => !c.isArchived).length === 0 && (
                <div className="p-4 text-center text-gray-500">No conversations yet</div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="archived" className="m-0">
            <ScrollArea className="h-[calc(100vh-450px)]">
              {archivedConversations.map((conversation) => {
                const isOnline = onlineUsers.some(u => u.id === conversation.otherUser.id);

                return (
                  <div key={conversation.id} className="flex items-center p-3 hover:bg-gray-100">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback>{conversation.otherUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conversation.otherUser.name}</p>
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                        <p className="text-sm text-gray-500 truncate">{isOnline ? "Online" : "Offline"}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchiveConversation(conversation.id)}
                    >
                      Unarchive
                    </Button>
                  </div>
                );
              })}
              {archivedConversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">No archived conversations</div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback>
                  {conversations.find(c => c.otherUser.id === selectedConversation)?.otherUser.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium">
                  {conversations.find(c => c.otherUser.id === selectedConversation)?.otherUser.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {onlineUsers.some(u => u.id === selectedConversation) ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === user?.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{new Date(message.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Smile className="h-5 w-5" />
                </Button>

                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Image className="h-5 w-5" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </Button>

                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isConnected ? "Type a message..." : "Reconnect to send messages"}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={
                    !isConnected || conversations.find((c) => c.otherUser.id === selectedConversation)?.isBlocked
                  }
                />

                <Button
                  type="button"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={
                    !newMessage.trim() ||
                    !isConnected ||
                    conversations.find((c) => c.otherUser.id === selectedConversation)?.isBlocked
                  }
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>

              {conversations.find((c) => c.otherUser.id === selectedConversation)?.isBlocked && (
                <p className="text-center text-sm text-red-500 mt-2">
                  You have blocked this user. Unblock to send messages.
                </p>
              )}

              {!isConnected && (
                <p className="text-center text-sm text-amber-500 mt-2">
                  You are currently disconnected. Please reconnect to send messages.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 flex flex-col justify-center items-center">
              <div className="w-full max-w-md">
                <h3 className="text-lg font-medium mb-4 text-center">Welcome to Messenger</h3>
                <p className="text-center text-gray-500">
                  {isConnected
                    ? "Select a conversation from the sidebar to start chatting"
                    : "Please wait while connecting to the server..."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
