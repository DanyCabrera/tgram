'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { User, Mail, Lock, Bell, Shield, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    website: '',
    location: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        website: user.website || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const validateProfileForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validar nombre
    if (!profileData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (profileData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar username
    if (!profileData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (profileData.username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username.trim())) {
      newErrors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }

    // Validar email
    if (!profileData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email.trim())) {
      newErrors.email = 'El email no es válido';
    }

    // Validar biografía
    if (profileData.bio.length > 160) {
      newErrors.bio = 'La biografía no puede tener más de 160 caracteres';
    }

    // Validar sitio web
    if (profileData.website && profileData.website.trim()) {
      const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      if (!websiteRegex.test(profileData.website.trim())) {
        newErrors.website = 'El sitio web debe ser una URL válida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateProfileForm()) {
      setMessage('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      setErrors({});
      
      // Normalizar URL del sitio web si está presente
      const updateData = { ...profileData };
      if (updateData.website && updateData.website.trim()) {
        let website = updateData.website.trim();
        if (!website.startsWith('http://') && !website.startsWith('https://')) {
          website = `https://${website}`;
        }
        updateData.website = website;
      }

      await apiService.updateProfile(updateData);
      setMessage('Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      if (error.response?.data?.message) {
        setMessage(`Error: ${error.response.data.message}`);
      } else {
        setMessage('Error al actualizar el perfil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!passwordData.currentPassword.trim()) {
      setMessage('La contraseña actual es requerida');
      return;
    }

    if (!passwordData.newPassword.trim()) {
      setMessage('La nueva contraseña es requerida');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setMessage('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      await apiService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setMessage('Contraseña actualizada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error actualizando contraseña:', error);
      if (error.response?.data?.message) {
        setMessage(`Error: ${error.response.data.message}`);
      } else {
        setMessage('Error al actualizar la contraseña');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      // Simular actualización de notificaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Configuración de notificaciones actualizada');
    } catch (error) {
      console.error('Error actualizando notificaciones:', error);
      setMessage('Error al actualizar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmMessage = '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y se eliminarán todos tus datos permanentemente.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Segunda confirmación
    const secondConfirm = prompt('Para confirmar la eliminación, escribe "ELIMINAR" en mayúsculas:');
    if (secondConfirm !== 'ELIMINAR') {
      setMessage('Eliminación cancelada. Debes escribir "ELIMINAR" para confirmar.');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      await apiService.deleteAccount();
      
      setMessage('Cuenta eliminada correctamente');
      
      // Cerrar sesión y redirigir al login
      setTimeout(() => {
        logout();
        router.push('/auth/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error eliminando cuenta:', error);
      if (error.response?.data?.message) {
        setMessage(`Error: ${error.response.data.message}`);
      } else {
        setMessage('Error al eliminar la cuenta');
      }
    } finally {
      setIsLoading(false);
    }
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
              Necesitas iniciar sesión para acceder a la configuración
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'privacy', label: 'Privacidad', icon: Shield }
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuración
          </h1>
          <p className="text-gray-600">
            Gestiona tu cuenta y preferencias
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200">
              <nav className="p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Información del Perfil
                  </h2>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
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
                          Nombre de usuario
                        </label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
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
                          Email
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
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
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Biografía
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                          errors.bio ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Cuéntanos sobre ti..."
                      />
                      {errors.bio && (
                        <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sitio web
                      </label>
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                          errors.website ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="https://tu-sitio-web.com"
                      />
                      {errors.website && (
                        <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                      )}
                    </div>
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Seguridad
                  </h2>
                  
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña actual
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar nueva contraseña
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </form>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Notificaciones
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Notificaciones por email
                        </h3>
                        <p className="text-sm text-gray-500">
                          Recibe notificaciones importantes por email
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ 
                          ...prev, 
                          emailNotifications: e.target.checked 
                        }))}
                        className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Notificaciones push
                        </h3>
                        <p className="text-sm text-gray-500">
                          Recibe notificaciones en tiempo real
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ 
                          ...prev, 
                          pushNotifications: e.target.checked 
                        }))}
                        className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Notificaciones de likes
                        </h3>
                        <p className="text-sm text-gray-500">
                          Cuando alguien le da like a tus publicaciones
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.likeNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ 
                          ...prev, 
                          likeNotifications: e.target.checked 
                        }))}
                        className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Notificaciones de comentarios
                        </h3>
                        <p className="text-sm text-gray-500">
                          Cuando alguien comenta en tus publicaciones
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.commentNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ 
                          ...prev, 
                          commentNotifications: e.target.checked 
                        }))}
                        className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Notificaciones de seguidores
                        </h3>
                        <p className="text-sm text-gray-500">
                          Cuando alguien te sigue
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationSettings.followNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ 
                          ...prev, 
                          followNotifications: e.target.checked 
                        }))}
                        className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                      />
                    </div>
                    
                    <Button onClick={handleNotificationUpdate} disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Privacidad
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Zona de Peligro
                      </h3>
                      
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <Trash2 className="w-5 h-5 text-red-600" />
                          <div>
                            <h4 className="text-sm font-medium text-red-900">
                              Eliminar cuenta
                            </h4>
                            <p className="text-sm text-red-700 mt-1">
                              Una vez que elimines tu cuenta, no hay vuelta atrás. 
                              Por favor, ten cuidado.
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={isLoading}
                          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isLoading ? 'Eliminando...' : 'Eliminar Cuenta'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}