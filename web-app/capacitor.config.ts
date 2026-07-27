import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'rs.slovolov.app',
  appName: 'Slovolov',
  webDir: 'dist',
  server: {
    url: 'https://slovolov-download.onrender.com',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['slovolov-download.onrender.com']
  }
};

export default config;
