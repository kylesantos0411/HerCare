/// <reference types="@capacitor/push-notifications" />

import type { CapacitorConfig } from '@capacitor/cli';

function normalizeAppVariant(value: string | undefined) {
  const normalizedValue = value?.trim().toLowerCase();

  if (normalizedValue === 'simple' || normalizedValue === 'essentials' || normalizedValue === 'lite') {
    return 'simple';
  }

  return 'personal';
}

const appVariant = normalizeAppVariant(process.env.HERCARE_APP_VARIANT ?? process.env.VITE_APP_VARIANT);
const appId = appVariant === 'simple' ? 'com.hercare.essentials' : 'com.hercare.app';
const appName = appVariant === 'simple' ? 'HerCare Essentials' : 'HerCare';

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['sound', 'alert'],
    },
  },
};

export default config;
