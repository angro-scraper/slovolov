import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'rs.slovolov.app',
  appName: 'Slovolov',
  webDir: 'dist',
  server: { androidScheme: 'https' }
};

export default config;
