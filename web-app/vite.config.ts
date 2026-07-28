import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function excludeSourceStoryAssets(storeSafeContent: boolean): Plugin {
  return {
    name: 'exclude-source-story-assets-from-store-build',
    apply: 'build',
    writeBundle(options) {
      if (!storeSafeContent) return;

      const outputRoot = resolve(
        process.cwd(),
        typeof options.dir === 'string' ? options.dir : 'dist'
      );
      rmSync(resolve(outputRoot, 'content', 'stories'), { recursive: true, force: true });
      rmSync(resolve(outputRoot, 'audio', 'stories'), { recursive: true, force: true });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const storeSafeContent = env.VITE_STORE_SAFE_CONTENT === 'true';

  return {
    plugins: [
    react(),
    excludeSourceStoryAssets(storeSafeContent),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon-32.png',
        'icons/apple-touch-icon.png',
        'icons/slovolov-icon-192.png',
        'icons/slovolov-icon-512.png'
      ],
      manifest: {
        name: 'Slovolov — učimo srpska slova',
        short_name: 'Slovolov',
        description: 'Pametna offline škola srpskog jezika, čitanja, pisanja i matematike za decu.',
        theme_color: '#4f46e5',
        background_color: '#fffaf0',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/slovolov-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/slovolov-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/letters/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'slovolov-letter-audio-v1',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/quiz/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'slovolov-quiz-audio-v1',
              expiration: {
                maxEntries: 90,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/stories/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'slovolov-story-audio-v3',
              expiration: {
                maxEntries: 3_000,
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
  };
});
