'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { User } from '../../types';
import { Search, User as UserIcon, Users, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';

export default function SearchPage() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Obtener query de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    }
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      const response = await apiService.searchUsers(query);
      setSearchResults(response.users);
      
      // Inicializar estado de seguimiento
      const followingState: { [key: string]: boolean } = {};
      response.users.forEach(user => {
        followingState[user.id] = false; // Por defecto no está siguiendo
      });
      setIsFollowing(followingState);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await apiService.followUser(userId);
      setIsFollowing(prev => ({
        ...prev,
        [userId]: true
      }));
      setFollowingUsers(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Error siguiendo usuario:', error);
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await apiService.unfollowUser(userId);
      setIsFollowing(prev => ({
        ...prev,
        [userId]: false
      }));
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      console.error('Error dejando de seguir usuario:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
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
              Necesitas iniciar sesión para buscar usuarios
            </p>
            <Link 
              href="/"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Buscar Usuarios
          </h1>
          <p className="text-gray-600">
            Encuentra personas en la red social
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <Button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </form>

        {/* Search Results */}
        {hasSearched && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Resultados de búsqueda
              </h2>
              <span className="text-gray-500">
                {searchResults.length} usuario{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isSearching ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Buscando usuarios...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-gray-600">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        <p className="text-gray-600">@{user.username}</p>
                        {user.bio && (
                          <p className="text-gray-500 text-sm mt-1">{user.bio}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link href={`/profile/${user.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Perfil
                          </Button>
                        </Link>
                        {user.id !== user?.id && (
                          <Button 
                            onClick={() => isFollowing[user.id] ? handleUnfollowUser(user.id) : handleFollowUser(user.id)}
                            variant={isFollowing[user.id] ? 'outline' : 'default'}
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            {isFollowing[user.id] ? (
                              <>
                                <UserMinus className="w-4 h-4" />
                                <span>Siguiendo</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span>Seguir</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
