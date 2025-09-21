'use client';

import { Trophy, LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: {id: number, name: string} | null;
  onLogout: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Predictio
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Football Prediction Game
            </p>
          </div>
        </div>
        
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Welcome,</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {currentUser.name}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
