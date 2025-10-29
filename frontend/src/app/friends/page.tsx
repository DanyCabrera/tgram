'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { User } from '../../types';
import { 
  User as UserIcon, 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX,
  Users,
  MessageCircle,
  Heart,
  UserMinus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function FriendsPage() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'followers'>('all');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && !loading) {
      loadAllUsers();
      loadUserData();
    }
  }, [user, loading]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      console.log('Cargando datos del usuario:', user.id);
      await loadFollowing();
      await loadFollowers();
      console.log('Datos del usuario cargados correctamente');
    } catch (error: any) {
      console.error('Error cargando datos del usuario:', error);
    }
  };

  const loadAllUsers = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.searchUsers('', 1, 100);
      setAllUsers((response.users || []).filter(u => u.id !== user.id));
    } catch (error: any) {
      console.error('Error cargando usuarios:', error);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (!user) return;
    
    try {
      console.log('Cargando usuarios seguidos...');
      const response = await apiService.getUserProfile(user.id);
      const followingUsers = response.following || [];
      console.log('Usuarios seguidos recibidos:', followingUsers.length, followingUsers);
      setFollowing(followingUsers);
      setFollowingIds(new Set(followingUsers.map(u => u.id)));
      console.log('Estado following actualizado:', followingUsers.length);
    } catch (error: any) {
      console.error('Error cargando seguidos:', error);
    }
  };

  const loadFollowers = async () => {
    if (!user) return;
    
    try {
      console.log('Cargando seguidores...');
      const response = await apiService.getUserProfile(user.id);
      const followersUsers = response.followers || [];
      console.log('Seguidores recibidos:', followersUsers.length, followersUsers);
      setFollowers(followersUsers);
      console.log('Estado followers actualizado:', followersUsers.length);
    } catch (error: any) {
      console.error('Error cargando seguidores:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      setLoadingButtons(prev => new Set([...prev, userId]));
      setError(null);
      
      // Llamar a la API real para seguir usuario
      await apiService.followUser(userId);
      
      // Actualizar estado local
      setFollowingIds(prev => new Set([...prev, userId]));
      
      console.log(`Usuario ${user?.name} siguiendo a ${userId}`);
      
      // Recargar datos para sincronizar con el backend
      await loadFollowing();
      await loadFollowers();
    } catch (error: any) {
      console.error('Error siguiendo usuario:', error);
      setError('Error al seguir usuario. Inténtalo de nuevo.');
    } finally {
      setLoadingButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      setLoadingButtons(prev => new Set([...prev, userId]));
      setError(null);
      
      // Llamar a la API real para dejar de seguir usuario
      await apiService.unfollowUser(userId);
      
      // Actualizar estado local
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      
      console.log(`Usuario ${user?.name} dejando de seguir a ${userId}`);
      
      // Recargar datos para sincronizar con el backend
      await loadFollowing();
      await loadFollowers();
    } catch (error: any) {
      console.error('Error dejando de seguir usuario:', error);
      setError('Error al dejar de seguir usuario. Inténtalo de nuevo.');
    } finally {
      setLoadingButtons(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
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
              Necesitas iniciar sesión para ver los usuarios
            </p>
            <a 
              href="/auth/login"
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
      <div className="max-w-6xl mx-auto">

        {/* Búsqueda */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar usuarios por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              style={{color: 'black'}}
            />
          </div>
        </div>

        <div className="mb-8 ml-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Amigos
          </h1>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Todos los usuarios ({allUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Siguiendo ({following.length})
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'followers'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Seguidores ({followers.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Content based on active tab */}
            {activeTab === 'all' && (
              <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery ? 'Intenta con otro término de búsqueda' : 'No hay usuarios disponibles'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">@{user.email.split('@')[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {followingIds.has(user.id) ? (
                          <Button
                            onClick={() => handleUnfollow(user.id)}
                            variant="outline"
                            disabled={loadingButtons.has(user.id)}
                            className="flex items-center space-x-2"
                          >
                            {loadingButtons.has(user.id) ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                            <span>{loadingButtons.has(user.id) ? 'Dejando...' : 'Dejar de seguir'}</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleFollow(user.id)}
                            disabled={loadingButtons.has(user.id)}
                            className="flex items-center space-x-2"
                          >
                            {loadingButtons.has(user.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                            <span>{loadingButtons.has(user.id) ? 'Siguiendo...' : 'Seguir'}</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/chat`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="space-y-4">
                {following.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No sigues a nadie aún
                    </h3>
                    <p className="text-gray-600">
                      Comienza a seguir usuarios para ver sus publicaciones
                    </p>
                  </div>
                ) : (
                  following.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">@{user.email.split('@')[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleUnfollow(user.id)}
                          variant="outline"
                          disabled={loadingButtons.has(user.id)}
                          className="flex items-center space-x-2"
                        >
                          {loadingButtons.has(user.id) ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                          <span>{loadingButtons.has(user.id) ? 'Dejando...' : 'Dejar de seguir'}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/chat`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'followers' && (
              <div className="space-y-4">
                {followers.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes seguidores aún
                    </h3>
                    <p className="text-gray-600">
                      Comparte contenido para que otros usuarios te sigan
                    </p>
                  </div>
                ) : (
                  followers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-500">@{user.email.split('@')[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {followingIds.has(user.id) ? (
                          <Button
                            onClick={() => handleUnfollow(user.id)}
                            variant="outline"
                            disabled={loadingButtons.has(user.id)}
                            className="flex items-center space-x-2"
                          >
                            {loadingButtons.has(user.id) ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                            <span>{loadingButtons.has(user.id) ? 'Dejando...' : 'Dejar de seguir'}</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleFollow(user.id)}
                            disabled={loadingButtons.has(user.id)}
                            className="flex items-center space-x-2"
                          >
                            {loadingButtons.has(user.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                            <span>{loadingButtons.has(user.id) ? 'Siguiendo...' : 'Seguir'}</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/chat`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}