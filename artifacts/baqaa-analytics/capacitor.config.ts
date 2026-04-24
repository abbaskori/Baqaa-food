import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.baqaa.analytics',
  appName: 'Baqaa Analytics',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
