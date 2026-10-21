import type { CapacitorConfig } from '@capacitor/cli';

// CAP_DEV_HTTP=1 permite hablar con un API en http:// (solo desarrollo en LAN).
const devHttp = process.env.CAP_DEV_HTTP === '1';

const config: CapacitorConfig = {
  appId: 'com.primehealth.app',
  appName: 'Prime Health',
  webDir: 'dist',
  backgroundColor: '#0b0a10',
  server: {
    androidScheme: devHttp ? 'http' : 'https',
    cleartext: devHttp,
  },
  ios: {
    scheme: 'https',
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0b0a10',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0a10',
    },
  },
};

export default config;
