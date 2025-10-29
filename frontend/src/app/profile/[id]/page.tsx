'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '../../../components/layout/MainLayout';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { PostCard } from '../../../components/feed/PostCard';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import { Post, User } from '../../../types';
import { 
  Image as ImageIcon,
  User as UserIcon,
  MapPin,
  Link as LinkIcon,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export default function UserProfilePage() {
  const { user: currentUser, loading: currentUserLoading } = useAuth();
  const params = useParams();
  const userId = params.id as string;
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Cargar información del usuario
      const userResponse = await apiService.getUserById(userId);
      setProfileUser(userResponse);
      
      // Cargar posts del usuario (por ahora mock)
      const mockPosts: Post[] = [
        {
          id: '1',
          content: 'Mi primera publicación en Nexus! 🚀',
          author: userResponse,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          likesCount: 12,
          commentsCount: 3,
          sharesCount: 1,
          isEdited: false,
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          likes: [],
          comments: [],
          media: []
        }
      ];
      setPosts(mockPosts);
      
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await apiService.followUser(userId);
      setIsFollowing(true);
    } catch (error) {
      console.error('Error siguiendo usuario:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await apiService.unfollowUser(userId);
      setIsFollowing(false);
    } catch (error) {
      console.error('Error dejando de seguir usuario:', error);
    }
  };

  const handleLike = (postId: string) => {
    console.log('Liking post:', postId);
    // Lógica para dar like
  };

  const handleComment = (postId: string, content: string) => {
    console.log(`Comentando en ${postId}: ${content}`);
    // Lógica para comentar
  };


  if (currentUserLoading || isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profileUser) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Usuario no encontrado</h1>
            <p className="text-gray-600">El usuario que buscas no existe o ha sido eliminado.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <ProfileHeader
          user={{
            id: profileUser.id,
            name: profileUser.name,
            username: profileUser.username,
            bio: profileUser.bio || '',
            avatar: profileUser.avatar,
            coverImage: profileUser.coverImage,
            followers: profileUser.followers?.length || 0,
            following: profileUser.following?.length || 0,
            posts: posts.length,
            isFollowing: isFollowing,
            isOwnProfile: isOwnProfile,
          }}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onEditProfile={() => {}} // No edit for other users
        />

        <div className="bg-white border border-gray-200 rounded-xl mt-6 p-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === 'posts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Publicaciones
            </button>
            <button
              onClick={() => setActiveTab('replies')}
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === 'replies'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Respuestas
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === 'media'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Multimedia
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === 'likes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Me gusta
            </button>
          </div>

          {activeTab === 'posts' && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                  <p>Este usuario no tiene publicaciones aún.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser?.id}
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'replies' && (
            <div className="text-center py-12 text-gray-600">
              <MessageCircle className="w-12 h-12 mx-auto mb-4" />
              <p>No hay respuestas para mostrar.</p>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="text-center py-12 text-gray-600">
              <ImageIcon className="w-12 h-12 mx-auto mb-4" />
              <p>No hay contenido multimedia para mostrar.</p>
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="text-center py-12 text-gray-600">
              <ImageIcon className="w-12 h-12 mx-auto mb-4" />
              <p>No hay publicaciones que le gusten a este usuario.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
