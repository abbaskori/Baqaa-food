import { LocalNotifications } from '@capacitor/local-notifications';

export const NotificationService = {
  async requestPermissions() {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  },

  async notifyNewOrder(order: { total: number; payment_method: string }) {
    // Play "Cha-ching" sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play();
    } catch (e) {
      console.warn('Audio play failed', e);
    }

    // Schedule notification
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '💰 New Sale!',
          body: `₹${order.total} - ${order.payment_method}`,
          id: Math.floor(Math.random() * 10000),
          schedule: { at: new Date(Date.now() + 500) },
          sound: 'beep.wav'
        }
      ]
    });
  }
};
