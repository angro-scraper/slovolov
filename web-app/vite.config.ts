import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Slovolov — učimo srpska slova',
        short_name: 'Slovolov',
        description: 'Vesela offline škola srpskih slova za decu.',
        theme_color: '#4f46e5',
        background_color: '#fffaf0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2,mp3}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/stories/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'slovolov-story-audio-v1',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true
            }
          }
        ]
      }
    })
  ],
  build: { sourcemap: true }
});
