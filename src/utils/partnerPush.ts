import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const PARTNER_PUSH_CHANNEL_ID = 'hercare-partner-alerts';

let listenersReady = false;
let pendingResolvers: Array<(token: string) => void> = [];
let pendingRejectors: Array<(error: Error) => void> = [];
let registrationInFlight: Promise<string> | null = null;

function resolvePendingRegistrations(token: string) {
  pendingResolvers.forEach((resolve) => resolve(token));
  pendingResolvers = [];
  pendingRejectors = [];
}

function rejectPendingRegistrations(error: Error) {
  pendingRejectors.forEach((reject) => reject(error));
  pendingResolvers = [];
  pendingRejectors = [];
}

function isNativePushSupported() {
  return Capacitor.isNativePlatform();
}

async function ensurePushListeners() {
  if (!isNativePushSupported() || listenersReady) {
    return;
  }

  await PushNotifications.addListener('registration', (token) => {
    resolvePendingRegistrations(token.value);
  });

  await PushNotifications.addListener('registrationError', (error) => {
    rejectPendingRegistrations(new Error(error.error || 'Unable to register this phone for push alerts.'));
  });

  listenersReady = true;
}

async function ensurePartnerPushChannel() {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }

  await PushNotifications.createChannel({
    id: PARTNER_PUSH_CHANNEL_ID,
    name: 'Partner alerts',
    description: 'Push alerts for partner check-ins and location pins.',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#B0A8E3',
  });
}

export async function registerPartnerPushNotifications() {
  if (!isNativePushSupported()) {
    return null;
  }

  if (registrationInFlight) {
    return registrationInFlight;
  }

  registrationInFlight = (async () => {
    await ensurePushListeners();
    await ensurePartnerPushChannel();

    let permission = await PushNotifications.checkPermissions();

    if (permission.receive === 'prompt') {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== 'granted') {
      throw new Error('Push notifications are turned off on this phone.');
    }

    const tokenPromise = new Promise<string>((resolve, reject) => {
      pendingResolvers.push(resolve);
      pendingRejectors.push(reject);
    });

    await PushNotifications.register();
    return tokenPromise;
  })();

  try {
    return await registrationInFlight;
  } finally {
    registrationInFlight = null;
  }
}

export async function unregisterPartnerPushNotifications() {
  if (!isNativePushSupported()) {
    return;
  }

  rejectPendingRegistrations(new Error('Push alerts were turned off on this phone.'));
  await PushNotifications.unregister();
}
