import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, ArrowUpCircle } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-[60] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-700 p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
             {needRefresh ? <ArrowUpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400" />}
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-white">
              {offlineReady ? 'Aplikasi Siap Offline' : 'Versi Baru Tersedia'}
            </h3>
            <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
              {offlineReady
                ? 'Aplikasi siap digunakan tanpa koneksi internet.'
                : 'Ada pembaruan baru. Muat ulang untuk melihat perubahan.'}
            </p>
          </div>
        </div>
        <button onClick={close} className="p-1 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-full transition-colors text-stone-400">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {needRefresh && (
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => updateServiceWorker(true)}
            className="flex-1 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Update Sekarang
          </button>
          <button 
            onClick={close}
            className="flex-1 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-300 font-medium py-2 px-4 rounded-xl transition-colors text-sm"
          >
            Nanti Saja
          </button>
        </div>
      )}
    </div>
  );
};
