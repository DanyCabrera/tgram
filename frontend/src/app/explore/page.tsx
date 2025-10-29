'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PostCard } from '../../components/feed/PostCard';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { 
  Search, 
  Filter, 
  TrendingUp,
  Hash,
  Users,
  Clock,
  Star,
  UserPlus,
  UserMinus,
  Image,
  X,
  Upload,
  Camera
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface TrendingTopic {
  id: string;
  name: string;
  posts: number;
  category: string;
}

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  followers: number;
  isFollowing: boolean;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [postComment, setPostComment] = useState('');

  // Cargar todos los posts al montar el componente
  useEffect(() => {
    loadAllPosts();
  }, []);

  const loadAllPosts = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getExplorePosts();
      setAllPosts(response.posts);
    } catch (error) {
      console.error('Error cargando posts:', error);
      setNotification({ type: 'error', message: 'Error al cargar las publicaciones.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // Verificar si el usuario ya dio like a este post
      const post = allPosts.find(p => p.id === postId);
      const userLiked = post?.likes?.some((like: any) => like.userId === user?.id);
      
      if (userLiked) {
        await apiService.unlikePost(postId);
      } else {
        await apiService.likePost(postId);
      }
      
      // Recargar posts para actualizar likes
      loadAllPosts();
    } catch (error) {
      console.error('Error dando like:', error);
      setNotification({ type: 'error', message: 'Error al dar like.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await apiService.createComment(postId, content);
      setNotification({ type: 'success', message: 'Comentario agregado exitosamente.' });
      setTimeout(() => setNotification(null), 2000);
      // Recargar posts para mostrar el nuevo comentario
      loadAllPosts();
    } catch (error) {
      console.error('Error creando comentario:', error);
      setNotification({ type: 'error', message: 'Error al agregar comentario.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePostUpdated = () => {
    // Recargar posts después de una actualización
    loadAllPosts();
  };



  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setNotification({ type: 'error', message: 'Algunos archivos no son válidos. Solo se permiten imágenes de máximo 5MB.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
    setNotification({ type: 'success', message: `${validFiles.length} imagen${validFiles.length > 1 ? 'es' : ''} seleccionada${validFiles.length > 1 ? 's' : ''}.` });
    setTimeout(() => setNotification(null), 2000);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (selectedImages.length === 0) {
      setNotification({ type: 'error', message: 'Selecciona al menos una imagen para publicar.' });
      return;
    }

    try {
      setIsUploading(true);
      setNotification({ type: 'info', message: 'Publicando imágenes...' });
      
      // Subir imágenes y crear post usando la API
      const formData = new FormData();
      selectedImages.forEach((file) => {
        formData.append('media', file);
      });
      formData.append('content', postComment.trim() || `Publicación con ${selectedImages.length} imagen${selectedImages.length > 1 ? 'es' : ''}`);
      
      const newPost = await apiService.createPost(formData);
      
      // Recargar todos los posts para obtener la información completa
      loadAllPosts();
      
      setNotification({ type: 'success', message: '¡Post creado exitosamente!' });
      setSelectedImages([]);
      setPostComment('');
      setShowCreatePost(false);
      
      // Limpiar notificación después de 3 segundos
      setTimeout(() => setNotification(null), 3000);
      
    } catch (error) {
      console.error('Error creando post:', error);
      setNotification({ type: 'error', message: 'Error al crear el post. Inténtalo de nuevo.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await apiService.deletePost(postId);
      setAllPosts(prev => prev.filter(post => post.id !== postId));
      setNotification({ type: 'success', message: 'Publicación eliminada exitosamente.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error eliminando post:', error);
      setNotification({ type: 'error', message: 'Error al eliminar la publicación.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Create Post Button */}
          <Button
            onClick={() => setShowCreatePost(true)}
            className="text-white flex items-center space-x-2"
            style={{cursor: 'pointer'}}
          >
            <Camera className="w-4 h-4" />
            <span>Publicar Imagen</span>
          </Button>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando publicaciones...</p>
            </div>
          ) : allPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay publicaciones
              </h3>
              <p className="text-gray-600 mb-6">
                Sé el primero en compartir una imagen
              </p>
              <Button onClick={() => setShowCreatePost(true)} className="text-white" style={{cursor: 'pointer'}}>
                Publicar primera imagen
              </Button>
            </div>
          ) : (
            allPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDeletePost}
                onPostUpdated={handlePostUpdated}
              />
            ))
          )}
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Publicar Imagen
                  </h2>
                  <Button
                    onClick={() => setShowCreatePost(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Image Upload Area */}
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Selecciona imágenes
                        </p>
                        <p className="text-sm text-gray-500">
                          Haz clic para seleccionar una o más imágenes
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Máximo 5MB por imagen
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Imágenes seleccionadas ({selectedImages.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment Field */}
                <div className="mb-6">
                  <label htmlFor="post-comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Agrega un comentario (opcional)
                  </label>
                  <textarea
                    id="post-comment"
                    value={postComment}
                    onChange={(e) => setPostComment(e.target.value)}
                    placeholder="¿Qué quieres decir sobre estas imágenes?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {postComment.length}/500 caracteres
                    </p>
                    {postComment.length > 450 && (
                      <p className="text-xs text-orange-500">
                        Quedan {500 - postComment.length} caracteres
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowCreatePost(false);
                      setSelectedImages([]);
                      setPostComment('');
                    }}
                    variant="outline"
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    onClick={handleCreatePost}
                    disabled={selectedImages.length === 0 || isUploading}
                    className="flex items-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Publicando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Publicar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification System */}
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              <div className="flex-1">
                <p className="font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
