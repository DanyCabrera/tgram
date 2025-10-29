'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { CreatePost } from '../components/feed/CreatePost';
import { PostCard } from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Post } from '../types';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar posts del feed
  const loadPosts = async () => {
    if (!user) return;
    
    try {
      setPostsLoading(true);
      setError(null);
      const response = await apiService.getFeed();
      setPosts(response.posts || []);
    } catch (error: any) {
      console.error('Error cargando posts:', error);
      setError('Error al cargar el feed');
      setPosts([]); // Asegurar que posts sea un array
    } finally {
      setPostsLoading(false);
    }
  };

  // Cargar posts cuando el usuario esté autenticado
  useEffect(() => {
    if (user && !loading) {
      loadPosts();
    }
  }, [user, loading]);

  const handleLike = async (postId: string) => {
    try {
      // Verificar si el usuario ya dio like a este post
      const post = posts.find(p => p.id === postId);
      const userLiked = post?.likes?.some(like => like.userId === user?.id);
      
      if (userLiked) {
        await apiService.unlikePost(postId);
      } else {
        await apiService.likePost(postId);
      }
      
      // Recargar posts para actualizar likes
      loadPosts();
    } catch (error: any) {
      console.error('Error dando like:', error);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await apiService.createComment(postId, content);
      // Recargar posts para actualizar comentarios
      loadPosts();
    } catch (error: any) {
      console.error('Error comentando:', error);
    }
  };


  const handleCreatePost = async (content: string, imageUrl?: string, videoUrl?: string) => {
    try {
      await apiService.createPost({ content, imageUrl, videoUrl });
      // Recargar posts para mostrar el nuevo post
      loadPosts();
    } catch (error: any) {
      console.error('Error creando post:', error);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenido a TGram
          </h1>
          <p className="text-gray-600 mb-8">
            Conecta con el futuro y comparte tus momentos
          </p>
          <div className="space-x-4">
            <a 
              href="/auth/login"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Iniciar Sesión
            </a>
            <a 
              href="/auth/register"
              className="inline-block border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
            >
              Registrarse
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
        {/* Create Post */}
        <CreatePost onSubmit={handleCreatePost} />
        
        {/* Loading State */}
        {postsLoading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando posts...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={loadPosts}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
        
        {/* Posts */}
        {!postsLoading && !error && (
          <div className="space-y-6">
            {(!posts || posts.length === 0) ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay posts aún</h3>
                <p className="text-gray-600 mb-4">Sé el primero en compartir algo con la comunidad</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  currentUserId={user?.id}
                  onPostUpdated={loadPosts}
                />
              ))
            )}
          </div>
        )}
    </MainLayout>
  );
}