'use client';

import React, { useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { Image, X, User } from 'lucide-react';

export default function CreatePostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setMessage('Algunos archivos no son válidos. Solo se permiten imágenes de máximo 5MB.');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      setMessage('Escribe algo o selecciona una imagen para publicar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');

      // Simular creación de post
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage('¡Publicación creada exitosamente!');
      
      // Limpiar formulario
      setContent('');
      setImages([]);
      
      // Redirigir al feed después de un momento
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error('Error creando publicación:', error);
      setMessage('Error al crear la publicación. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
              Necesitas iniciar sesión para crear publicaciones
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear Publicación
          </h1>
          <p className="text-gray-600">
            Comparte algo con la comunidad
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            {/* Content input */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué estás pensando?"
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Imágenes seleccionadas ({images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
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

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar imágenes (opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Image className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Haz clic para seleccionar imágenes
                  </span>
                  <span className="text-xs text-gray-500">
                    Máximo 5MB por imagen
                  </span>
                </label>
              </div>
            </div>

            {/* Character count */}
            <div className="text-right">
              <span className={`text-sm ${
                content.length > 500 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {content.length}/500
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting || (!content.trim() && images.length === 0)}
              >
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 Consejos para una buena publicación
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sé auténtico y comparte experiencias reales</li>
            <li>• Usa hashtags relevantes para llegar a más personas</li>
            <li>• Las imágenes de buena calidad atraen más atención</li>
            <li>• Interactúa con los comentarios de tu publicación</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
