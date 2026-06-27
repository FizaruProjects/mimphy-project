
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-all duration-300 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-yellow-400 border border-stone-200 dark:border-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
};
