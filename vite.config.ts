import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt', // We will manage updates manually with prompt
          injectRegister: 'auto',
          includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
          manifest: {
            name: 'Mimphy',
            short_name: 'Mimphy',
            description: 'Platform Pembelajaran Interaktif',
            theme_color: '#dc2626',
            background_color: '#ffffff',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: 'icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'icons/maskable-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: 'icons/maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
            cleanupOutdatedCaches: true,
            skipWaiting: true, // Will skip waiting when we tell it to update
            clientsClaim: true,
            runtimeCaching: [
              {
                // Supabase API GET Requests
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*$/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 5 * 60, // 5 minutes expiration
                    purgeOnQuotaError: true
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Fonts (Google Fonts, local fonts)
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'fonts',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                  }
                }
              },
              {
                // Images
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'images',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                  }
                }
              },
              {
                // Static Assets (Vite chunks)
                urlPattern: /\.(?:js|css)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'static-assets',
                  expiration: {
                    maxEntries: 150,
                    maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        chunkSizeWarningLimit: 800,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-ui': ['lucide-react', 'recharts']
            }
          }
        }
      }
    };
});
