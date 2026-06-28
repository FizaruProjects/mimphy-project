import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallManager: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone || 
                             document.referrer.includes('android-app://');
                             
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Check if user dismissed previously
    const hasDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
    if (hasDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS prompt after a short delay
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Handle standard beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    // We don't hide it permanently if they just dismissed the native prompt,
    // they can click X to hide permanently.
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[60] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-700 p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
             <Download className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-white">Install Mimphy</h3>
            <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
              {isIOS 
                ? "Install aplikasi ini di layar utama Anda untuk pengalaman yang lebih cepat dan bisa diakses offline." 
                : "Install aplikasi untuk akses offline dan lebih cepat!"}
            </p>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-full transition-colors text-stone-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {isIOS ? (
        <div className="mt-4 bg-stone-50 dark:bg-slate-900 p-3 rounded-xl border border-stone-100 dark:border-slate-800 flex items-center justify-center gap-2 text-sm text-stone-700 dark:text-slate-300">
           Tekan <Share className="w-4 h-4" /> lalu <PlusSquare className="w-4 h-4" /> "Add to Home Screen"
        </div>
      ) : (
        <button 
          onClick={handleInstall}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Install Sekarang
        </button>
      )}
    </div>
  );
};
