'use client';

import React from 'react';
import Link from 'next/link';
import { useChessStore } from '@/lib/state/store';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { message } = useChessStore();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Grandmaster AI Agent
          </Link>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      {message && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="container mx-auto p-2 text-center text-blue-700">
            {message}
          </div>
        </div>
      )}
      
      <main className="py-6">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white py-4 mt-10">
        <div className="container mx-auto p-4 text-center">
          <p>&copy; {new Date().getFullYear()} Grandmaster AI Agent</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;