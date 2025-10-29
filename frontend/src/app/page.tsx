'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { CreatePost } from '../components/feed/CreatePost';
import { PostCard } from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Post } from '../types';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

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
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-xl font-bold text-black">TGram</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding */}
            <div className="hidden lg:block">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold text-black mb-6 leading-tight">
                  Conecta con el mundo
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Comparte tus momentos, descubre nuevas ideas y mantente conectado con las personas que más te importan.
                </p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Mensajería en tiempo real</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Comparte contenido</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="lg:mx-0">
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                {!showRegister ? (
                  /* Login Form */
                  <div>
                    
                    <LoginForm />
                    
                    {/* Register Link */}
                    <div className="mt-8 text-center">
                      <p className="text-gray-600">
                        ¿No tienes cuenta?{' '}
                        <button 
                          onClick={() => setShowRegister(true)}
                          className="text-black hover:text-gray-800 font-semibold transition-colors"
                        >
                          Regístrate
                        </button>
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Register Form */
                  <div>
                    
                    <RegisterForm />
                    
                    {/* Login Link */}
                    <div className="mt-8 text-center">
                      <p className="text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <button 
                          onClick={() => setShowRegister(false)}
                          className="text-black hover:text-gray-800 font-semibold transition-colors"
                        >
                          Inicia sesión
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 mt-20">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-sm text-gray-600">© 2025 TGram. Todos los derechos reservados.</span>
              </div>
            </div>
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
            <p className="text-gray-600">Cargando</p>
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