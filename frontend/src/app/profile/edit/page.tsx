'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  ArrowLeft
} from 'lucide-react';

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    location: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'El email no es válido';
    }

    // Validar biografía
    if (formData.bio.length > 160) {
      newErrors.bio = 'La biografía no puede tener más de 160 caracteres';
    }

    // Validar sitio web
    if (formData.website && formData.website.trim()) {
      const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!websiteRegex.test(formData.website.trim())) {
        newErrors.website = 'El sitio web debe ser una URL válida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validar formulario antes de enviar
    if (!validateForm()) {
      setMessage('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');

      // Preparar datos para actualizar
      const updateData: any = { ...formData };
      
      // Normalizar URL del sitio web si está presente
      if (updateData.website && updateData.website.trim()) {
        let website = updateData.website.trim();
        // Si no tiene protocolo, agregar https://
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
          website = `https://${website}`;
        }
        updateData.website = website;
      }



      // Actualizar perfil
      const updatedUser = await apiService.updateProfile(updateData);
      
      setMessage('Perfil actualizado exitosamente');
      
      // Redirigir al perfil después de un momento
      setTimeout(() => {
        router.push('/profile');
      }, 1500);

    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      
      // Mostrar error específico si está disponible
      if (error.response?.data?.message) {
        setMessage(`Error: ${error.response.data.message}`);
      } else if (error.response?.data?.error) {
        setMessage(`Error: ${error.response.data.error}`);
      } else if (error.response?.data?.message?.length > 0) {
        // Si hay múltiples errores de validación
        const validationErrors = error.response.data.message;
        if (Array.isArray(validationErrors)) {
          setMessage(`Error de validación: ${validationErrors.join(', ')}`);
        } else {
          setMessage(`Error: ${validationErrors}`);
        }
      } else {
        setMessage('Error al actualizar el perfil. Inténtalo de nuevo.');
      }
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
              Necesitas iniciar sesión para editar tu perfil
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Perfil
            </h1>
          </div>
          <p className="text-gray-600">
            Actualiza tu información personal
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">


          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Información Personal
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografía
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                maxLength={160}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Cuéntanos sobre ti..."
              />
              <div className="flex justify-between mt-1">
                <p className={`text-sm ${errors.bio ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.bio.length}/160 caracteres
                </p>
                {errors.bio && (
                  <p className="text-red-500 text-sm">{errors.bio}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio web
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://tu-sitio-web.com"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.website && (
                <p className="text-red-500 text-sm mt-1">{errors.website}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
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
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
