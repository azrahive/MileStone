import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      }

      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return false;
    }
  },

  async scheduleNotification(id: number, title: string, body: string, scheduleAt?: Date) {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
              schedule: scheduleAt ? { at: scheduleAt } : undefined,
              sound: 'beep.wav',
            },
          ],
        });
        return;
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        if (!scheduleAt || scheduleAt.getTime() <= Date.now()) {
          new Notification(title, { body, icon: '/favicon.ico' });
        } else {
          const timeout = scheduleAt.getTime() - Date.now();
          if (timeout > 0 && timeout < 86400000) {
            setTimeout(() => {
              new Notification(title, { body, icon: '/favicon.ico' });
            }, timeout);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to dispatch notification:', e);
    }
  },
};
