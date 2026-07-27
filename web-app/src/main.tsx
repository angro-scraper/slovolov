import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { installAudioIsolation } from './services/audioIsolation';
import './styles.css';

installAudioIsolation();

let applyServiceWorkerUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined;
applyServiceWorkerUpdate = registerSW({
  immediate: true,
  onNeedRefresh: () => {
    void applyServiceWorkerUpdate?.(true);
  },
  onRegisteredSW: (_serviceWorkerUrl, registration) => {
    void registration?.update();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);
