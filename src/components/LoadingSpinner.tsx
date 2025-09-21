'use client';

import { Trophy } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-yellow-500 animate-pulse" />
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
}
