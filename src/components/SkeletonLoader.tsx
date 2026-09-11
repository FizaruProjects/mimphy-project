import React from 'react';
import { Cat, Loader2 } from 'lucide-react';

interface SkeletonLoaderProps {
    variant?: 'default' | 'dashboard' | 'table' | 'cards' | 'quiz' | 'report' | 'splash';
    message?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'default', message }) => {
    if (variant === 'splash') {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-slate-900 dark:via-red-950/20 dark:to-slate-900 transition-colors duration-500">
                <div className="relative flex flex-col items-center p-8 max-w-sm text-center">
                    {/* Glowing Logo Circle */}
                    <div className="relative mb-6">
                        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-red-600 to-orange-500 opacity-30 blur-lg animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/50 dark:border-slate-700 overflow-hidden animate-in zoom-in duration-500">
                            <img 
                                src="/logo.png" 
                                alt="Mimphy Logo" 
                                className="w-full h-full object-cover" 
                                onError={(e) => { 
                                    e.currentTarget.style.display = 'none'; 
                                    const svg = e.currentTarget.parentElement?.querySelector('svg');
                                    if (svg) svg.style.display = 'block'; 
                                }} 
                            />
                            <Cat className="w-12 h-12 text-red-600 hidden" />
                        </div>
                    </div>

                    {/* Brand Name */}
                    <h2 className="text-2xl font-extrabold text-stone-800 dark:text-white mb-2 tracking-tight">
                        Mimphy <span className="text-red-600">Catalyze</span>
                    </h2>

                    {/* Dynamic Message / Spinner */}
                    <p className="text-sm font-medium text-stone-500 dark:text-slate-400 mb-6 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-red-600" />
                        {message || 'Memuat aplikasi...'}
                    </p>

                    {/* Shimmer Progress Bar */}
                    <div className="w-48 h-1.5 bg-stone-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-shimmer rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'dashboard') {
        return (
            <div className="animate-pulse space-y-6 w-full p-4">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center bg-white/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-stone-200/50 dark:border-slate-700/50">
                    <div className="space-y-2">
                        <div className="h-6 bg-stone-200 dark:bg-slate-700 rounded-lg w-48"></div>
                        <div className="h-4 bg-stone-100 dark:bg-slate-800 rounded-lg w-32"></div>
                    </div>
                    <div className="w-12 h-12 bg-stone-200 dark:bg-slate-700 rounded-full"></div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-stone-200/50 dark:border-slate-700/50 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="h-4 bg-stone-200 dark:bg-slate-700 rounded w-24"></div>
                                <div className="w-8 h-8 bg-stone-200 dark:bg-slate-700 rounded-lg"></div>
                            </div>
                            <div className="h-8 bg-stone-300 dark:bg-slate-600 rounded-lg w-20"></div>
                            <div className="h-3 bg-stone-100 dark:bg-slate-800 rounded w-36"></div>
                        </div>
                    ))}
                </div>

                {/* Main Content Card Skeleton */}
                <div className="bg-white/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-stone-200/50 dark:border-slate-700/50 space-y-4">
                    <div className="h-6 bg-stone-200 dark:bg-slate-700 rounded-lg w-1/3 mb-4"></div>
                    <div className="h-48 bg-stone-100 dark:bg-slate-800/60 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className="animate-pulse space-y-4 w-full p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-stone-200/50 dark:border-slate-700/50">
                {/* Search & Filter Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="h-10 bg-stone-200 dark:bg-slate-700 rounded-xl w-full md:w-64"></div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="h-10 bg-stone-200 dark:bg-slate-700 rounded-xl w-28"></div>
                        <div className="h-10 bg-stone-200 dark:bg-slate-700 rounded-xl w-28"></div>
                    </div>
                </div>

                {/* Table Header */}
                <div className="h-12 bg-stone-200 dark:bg-slate-700 rounded-xl w-full"></div>

                {/* Table Rows */}
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-14 bg-stone-100 dark:bg-slate-800/60 rounded-xl w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'cards') {
        return (
            <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full p-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl border border-stone-200/50 dark:border-slate-700/50 space-y-3">
                        <div className="h-32 bg-stone-200 dark:bg-slate-700 rounded-xl w-full"></div>
                        <div className="h-5 bg-stone-300 dark:bg-slate-600 rounded w-3/4"></div>
                        <div className="h-4 bg-stone-100 dark:bg-slate-800 rounded w-1/2"></div>
                        <div className="h-10 bg-stone-200 dark:bg-slate-700 rounded-xl w-full pt-2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'quiz') {
        return (
            <div className="animate-pulse max-w-3xl mx-auto space-y-6 p-6 bg-white/60 dark:bg-slate-800/60 rounded-3xl border border-stone-200/50 dark:border-slate-700/50">
                {/* Quiz Header & Timer */}
                <div className="flex justify-between items-center">
                    <div className="h-6 bg-stone-200 dark:bg-slate-700 rounded-lg w-32"></div>
                    <div className="h-8 bg-stone-200 dark:bg-slate-700 rounded-full w-24"></div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-stone-200 dark:bg-slate-700 rounded-full w-full"></div>

                {/* Question Box */}
                <div className="p-6 bg-stone-100 dark:bg-slate-800 rounded-2xl space-y-3">
                    <div className="h-5 bg-stone-300 dark:bg-slate-600 rounded w-full"></div>
                    <div className="h-5 bg-stone-300 dark:bg-slate-600 rounded w-4/5"></div>
                    <div className="h-5 bg-stone-300 dark:bg-slate-600 rounded w-2/3"></div>
                </div>

                {/* Option Choices */}
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-14 bg-stone-100 dark:bg-slate-800 rounded-xl w-full border border-stone-200 dark:border-slate-700"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'report') {
        return (
            <div className="animate-pulse space-y-6 w-full p-4">
                {/* Profile Card Skeleton */}
                <div className="bg-white/60 dark:bg-slate-800/60 p-6 rounded-3xl border border-stone-200/50 dark:border-slate-700/50 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-stone-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="space-y-2 flex-1 text-center md:text-left">
                        <div className="h-6 bg-stone-300 dark:bg-slate-600 rounded w-48 mx-auto md:mx-0"></div>
                        <div className="h-4 bg-stone-200 dark:bg-slate-700 rounded w-32 mx-auto md:mx-0"></div>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-stone-200/50 dark:border-slate-700/50"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Default Fallback
    return (
        <div className="animate-pulse space-y-4 w-full p-4">
            <div className="h-8 bg-stone-200 dark:bg-slate-700/50 rounded-lg w-1/4 mb-6"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="h-32 bg-stone-200 dark:bg-slate-700/50 rounded-2xl w-full"></div>
                <div className="h-32 bg-stone-200 dark:bg-slate-700/50 rounded-2xl w-full"></div>
                <div className="h-32 bg-stone-200 dark:bg-slate-700/50 rounded-2xl w-full"></div>
            </div>

            <div className="h-10 bg-stone-200 dark:bg-slate-700/50 rounded-xl w-full mb-4"></div>
            
            <div className="space-y-3">
                <div className="h-16 bg-stone-100 dark:bg-slate-800/50 rounded-xl w-full"></div>
                <div className="h-16 bg-stone-100 dark:bg-slate-800/50 rounded-xl w-full"></div>
                <div className="h-16 bg-stone-100 dark:bg-slate-800/50 rounded-xl w-full"></div>
            </div>
        </div>
    );
};
