import React from 'react';

export const SkeletonLoader: React.FC = () => {
    return (
        <div className="animate-pulse space-y-4 w-full p-2">
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
                <div className="h-16 bg-stone-100 dark:bg-slate-800/50 rounded-xl w-full"></div>
                <div className="h-16 bg-stone-100 dark:bg-slate-800/50 rounded-xl w-full"></div>
            </div>
        </div>
    );
};
