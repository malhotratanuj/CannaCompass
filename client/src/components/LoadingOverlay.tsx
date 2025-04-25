
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = 'Loading...', 
  children 
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
