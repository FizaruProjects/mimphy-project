import React, { useState } from 'react';
import { Library, Book, ChevronDown, ChevronUp } from 'lucide-react';

interface RecommendedModulesSectionProps {
  recommendedModules?: string[];
}

export const RecommendedModulesSection: React.FC<RecommendedModulesSectionProps> = ({ recommendedModules = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!recommendedModules || recommendedModules.length === 0) return null;

  const mainModule = recommendedModules[0];
  const hasMultiple = recommendedModules.length > 1;
  const remainingCount = recommendedModules.length - 1;

  return (
    <div className="bg-purple-50/60 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30 space-y-3 transition-all duration-300">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center">
          <Library className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" /> Rekomendasi Modul Pembelajaran
        </h4>
        {hasMultiple && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center text-xs font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 bg-purple-100/80 dark:bg-purple-900/40 hover:bg-purple-200/80 dark:hover:bg-purple-900/70 px-2.5 py-1 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Tutup rekomendasi modul lainnya" : "Lihat rekomendasi modul lainnya"}
          >
            <span className="mr-1.5">
              {isExpanded ? "Ringkas" : `+${remainingCount} Modul Lain`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300 transition-transform duration-200" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300 transition-transform duration-200" />
            )}
          </button>
        )}
      </div>

      {!isExpanded ? (
        /* Single Main Recommended Module View */
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center justify-between shadow-sm transition-all duration-200">
          <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
              <Book className="w-4 h-4" />
            </div>
            <div className="truncate flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="inline-block text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-md">
                  Utama (Paling Relevan)
                </span>
              </div>
              <p className="truncate text-xs font-bold text-purple-900 dark:text-purple-200">{mainModule}</p>
            </div>
          </div>
          {hasMultiple && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 p-1.5 rounded-lg hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-colors ml-2 flex-shrink-0 flex items-center gap-1 text-xs font-semibold"
              title="Buka seluruh rekomendasi modul"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Expanded View: All Recommended Modules */
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedModules.map((modTitle, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center transition-all duration-200 ${
                  i === 0
                    ? 'bg-purple-100/60 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-purple-100 dark:border-purple-900/40 text-purple-900 dark:text-purple-200'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mr-3 flex-shrink-0">
                  <Book className="w-4 h-4" />
                </div>
                <div className="truncate flex-1 min-w-0">
                  {i === 0 && (
                    <span className="block text-[9px] font-extrabold text-purple-600 dark:text-purple-300 uppercase tracking-wider mb-0.5">
                      ★ Rekomendasi Utama
                    </span>
                  )}
                  <span className="truncate">{modTitle}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setIsExpanded(false)}
              className="inline-flex items-center text-xs font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
            >
              <span className="mr-1">Ringkaskan Modul</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
