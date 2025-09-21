'use client';

import { useState, useEffect } from 'react';
import PredictionTable from '@/components/PredictionTable';
import LoginForm from '@/components/LoginForm';
import Header from '@/components/Header';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('predictio_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('predictio_user');
      }
    }
  }, []);

  const handleLogin = (user: {id: number, name: string}) => {
    setCurrentUser(user);
    localStorage.setItem('predictio_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('predictio_user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {!currentUser ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoginForm onLogin={handleLogin} />
          </div>
        ) : (
          <PredictionTable currentUser={currentUser} />
        )}
      </main>
      
      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-6 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            🏆 Predictio - Football Prediction Game with Friends
          </p>
        </div>
      </footer>
    </div>
  );
}