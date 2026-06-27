import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-900 dark:via-red-950/20 dark:to-slate-900 transition-colors duration-500">
      <Outlet />
    </div>
  );
};
