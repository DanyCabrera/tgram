'use client';

import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  MessageCircle, 
  UserPlus, 
  UserMinus,
  MoreHorizontal,
  Camera,
  Edit
} from 'lucide-react';
import { Button } from '../ui/Button';

interface User {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

interface ProfileHeaderProps {
  user: User;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  onEditProfile: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onFollow,
  onUnfollow,
  onEditProfile
}) => {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);

  const handleFollowToggle = () => {
    if (isFollowing) {
      onUnfollow(user.id);
    } else {
      onFollow(user.id);
    }
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
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
        
        {user.isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
          >
            <Camera className="w-4 h-4 mr-2" />
            Cambiar portada
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="relative -mt-16">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-900">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              
              {user.isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -bottom-2 -right-2 bg-gray-800 hover:bg-gray-700"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 mt-4">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-400">@{user.username}</p>
              
              {user.bio && (
                <p className="text-gray-300 mt-2 max-w-md">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{user.posts}</div>
                  <div className="text-sm text-gray-400">Publicaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{user.followers}</div>
                  <div className="text-sm text-gray-400">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{user.following}</div>
                  <div className="text-sm text-gray-400">Siguiendo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {user.isOwnProfile ? (
              <Button
                onClick={onEditProfile}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Editar perfil</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing ? 'outline' : 'default'}
                  className={isFollowing ? '' : 'bg-gradient-to-r from-blue-500 to-purple-600'}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Dejar de seguir
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Seguir
                    </>
                  )}
                </Button>
                
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensaje
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
