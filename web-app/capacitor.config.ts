import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'rs.slovolov.app',
  appName: 'Slovolov',
  webDir: 'dist',
  server: {
    // Novi iOS build nosi samo javni signal za premium prikaz. Stvarno
    // otključavanje i naplatu i dalje proverava Apple StoreKit u aplikaciji.
    url: 'https://slovolov-download.onrender.com/?slovolov-premium=ios',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['slovolov-download.onrender.com']
  }
};

export default config;
