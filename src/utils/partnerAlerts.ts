import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const PARTNER_ALERT_CHANNEL_ID = 'hercare-partner-alerts';

function isLocalNotificationsAvailable() {
  return Capacitor.getPlatform() !== 'web';
}

async function ensureNotificationAccess() {
  if (!isLocalNotificationsAvailable()) {
    return false;
  }

  const permission = await LocalNotifications.checkPermissions();

  if (permission.display === 'granted') {
    return true;
  }

  if (permission.display === 'denied') {
    return false;
  }

  const requestedPermission = await LocalNotifications.requestPermissions();
  return requestedPermission.display === 'granted';
}

async function ensurePartnerChannel() {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }

  await LocalNotifications.createChannel({
    id: PARTNER_ALERT_CHANNEL_ID,
    name: 'Partner check-ins',
    description: 'Real-time partner check-in alerts from HerCare.',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#B0A8E3',
  });
}

export async function showPartnerCheckInAlert(title: string, body: string) {
  if (!isLocalNotificationsAvailable()) {
    return;
  }

  const granted = await ensureNotificationAccess();

  if (!granted) {
    return;
  }

  await ensurePartnerChannel();

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now() % 2147483647,
        title,
        body,
        channelId: PARTNER_ALERT_CHANNEL_ID,
        schedule: {
          at: new Date(Date.now() + 500),
          allowWhileIdle: true,
        },
      },
    ],
  });
}
