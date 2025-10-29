'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 ml-64">
          {/* Header */}
          <Header />
          
          {/* Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};