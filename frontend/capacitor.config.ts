import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.milestone.app',
  appName: 'MileStone',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true, // Allows testing with local HTTP backend endpoints like http://10.0.2.2:8000
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher_round',
      iconColor: '#6366f1',
      sound: 'beep.wav',
    },
  },
};

export default config;
