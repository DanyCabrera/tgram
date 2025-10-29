'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { PostCard } from '../../components/feed/PostCard';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { User } from '../../types';
import { 
  User as UserIcon, 
  Edit, 
  Settings, 
  Camera,
  MessageCircle,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  Grid3X3,
  Heart,
  Bookmark
} from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUserPosts();
      loadUserData();
    }
  }, [user]);

  const loadUserPosts = async () => {
    try {
      setIsLoading(true);
      // Simular carga de posts del usuario
      const mockPosts = [
        {
          id: '1',
          content: 'Mi primera publicación en Nexus! 🚀',
          author: {
            id: user?.id,
            name: user?.name,
            username: user?.username,
            avatar: user?.avatar
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          likesCount: 12,
          commentsCount: 3,
          sharesCount: 1,
          isEdited: false,
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          likes: [],
          comments: [],
          media: []
        },
        {
          id: '2',
          content: 'Explorando las nuevas funcionalidades de la plataforma. ¡Es increíble! ✨',
          author: {
            id: user?.id,
            name: user?.name,
            username: user?.username,
            avatar: user?.avatar
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          likesCount: 8,
          commentsCount: 2,
          sharesCount: 0,
          isEdited: false,
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          likes: [],
          comments: [],
          media: []
        }
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error('Error cargando posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      console.log('Cargando datos del usuario:', user.id);
      
      // Cargar perfil completo con seguidores y seguidos
      const userProfile = await apiService.getUserProfile(user.id);
      console.log('Perfil del usuario cargado:', userProfile);
      
      // Actualizar contadores
      setFollowersCount(userProfile.followers?.length || 0);
      setFollowingCount(userProfile.following?.length || 0);
      setFollowers(userProfile.followers || []);
      setFollowing(userProfile.following || []);
      
      console.log('Contadores actualizados - Seguidores:', userProfile.followers?.length || 0, 'Siguiendo:', userProfile.following?.length || 0);
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleLike = (postId: string) => {
    console.log('Liking post:', postId);
  };

  const handleComment = (postId: string) => {
    console.log('Commenting on post:', postId);
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
              Necesitas iniciar sesión para ver tu perfil
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-700">
            {user.coverImage ? (
              <img 
                src={user.coverImage} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-700"></div>
            )}
            
            <Button
              onClick={handleEditProfile}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Cambiar portada
            </Button>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="relative -mt-16">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-16 h-16 text-white" />
                    )}
                  </div>
                  
                  <Button
                    onClick={handleEditProfile}
                    variant="ghost"
                    size="sm"
                    className="absolute -bottom-2 -right-2 bg-gray-800 hover:bg-gray-700 text-white"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex-1 mt-4">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-gray-500">@{user.username}</p>
                  
                  {user.bio && (
                    <p className="text-gray-700 mt-2 max-w-md">{user.bio}</p>
                  )}

                  {user.location && (
                    <p className="text-gray-500 text-sm mt-1">📍 {user.location}</p>
                  )}

                  {user.website && (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-1 block"
                    >
                      🌐 {user.website}
                    </a>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{posts.length}</div>
                      <div className="text-sm text-gray-500">Publicaciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{followersCount}</div>
                      <div className="text-sm text-gray-500">Seguidores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{followingCount}</div>
                      <div className="text-sm text-gray-500">Siguiendo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar perfil</span>
                </Button>
                
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Grid3X3 className="w-4 h-4" />
                <span>Publicaciones</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'likes'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Me gusta</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'saved'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Bookmark className="w-4 h-4" />
                <span>Guardados</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'posts' && (
            <>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando publicaciones...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Grid3X3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay publicaciones
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Cuando publiques algo, aparecerá aquí
                  </p>
                  <Button onClick={() => router.push('/create-post')}>
                    Crear primera publicación
                  </Button>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'likes' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay me gusta
              </h3>
              <p className="text-gray-600">
                Las publicaciones que te gusten aparecerán aquí
              </p>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay publicaciones guardadas
              </h3>
              <p className="text-gray-600">
                Las publicaciones que guardes aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}