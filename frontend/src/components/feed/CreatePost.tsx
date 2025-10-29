'use client';

import React, { useState } from 'react';
import { 
  Send
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface CreatePostProps {
  onSubmit: (content: string, imageUrl?: string, videoUrl?: string) => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onSubmit }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      await onSubmit(content.trim());
      setContent('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white font-semibold text-lg">
            {user?.name?.charAt(0) || 'U'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={handleFocus}
              placeholder="¿Qué estás pensando?"
              className="w-full bg-transparent text-gray-900 placeholder-gray-500 resize-none focus:outline-none text-lg"
              rows={isExpanded ? 4 : 1}
            />

            {isExpanded && (
              <div className="flex items-center justify-end">
                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!content.trim() || isLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Publicar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};