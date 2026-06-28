import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-stone-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-stone-800 dark:text-white mb-2">Terjadi Kesalahan</h1>
                <p className="text-stone-500 dark:text-slate-400 mb-6 text-sm">
                    Mohon maaf, aplikasi mengalami kendala saat memuat halaman ini.
                </p>
                <div className="p-4 bg-stone-100 dark:bg-slate-900 rounded-lg text-left overflow-auto max-h-32 mb-6">
                    <code className="text-xs text-red-600 dark:text-red-400 break-words">
                        {this.state.error?.message || 'Unknown Error'}
                    </code>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold py-3 px-4 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                >
                    Muat Ulang Halaman
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
