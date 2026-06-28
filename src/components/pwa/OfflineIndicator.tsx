import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000); // Hide restored after 3s
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showRestored) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-full shadow-lg border px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 transition-colors ${
      isOffline 
        ? 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-600 dark:text-red-200'
        : 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-800 text-green-600 dark:text-green-200'
    }`}>
      {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
      <span className="text-sm font-medium">
        {isOffline ? 'Anda sedang offline' : 'Koneksi dipulihkan'}
      </span>
    </div>
  );
};
