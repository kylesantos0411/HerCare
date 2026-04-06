export type AppVariantId = 'personal' | 'simple';

interface AppVariantFeatures {
  partnerConnections: boolean;
  personalSupportTab: boolean;
  personalTone: boolean;
}

interface AppVariantConfig {
  id: AppVariantId;
  appId: string;
  appName: string;
  storagePrefix: string;
  defaultUserName: string;
  features: AppVariantFeatures;
}

const APP_VARIANTS: Record<AppVariantId, AppVariantConfig> = {
  personal: {
    id: 'personal',
    appId: 'com.hercare.app',
    appName: 'HerCare',
    storagePrefix: '',
    defaultUserName: 'Love',
    features: {
      partnerConnections: true,
      personalSupportTab: true,
      personalTone: true,
    },
  },
  simple: {
    id: 'simple',
    appId: 'com.hercare.essentials',
    appName: 'HerCare Essentials',
    storagePrefix: 'hercare_simple',
    defaultUserName: 'Friend',
    features: {
      partnerConnections: false,
      personalSupportTab: false,
      personalTone: false,
    },
  },
};

export function normalizeAppVariant(value: string | undefined | null): AppVariantId {
  const normalizedValue = value?.trim().toLowerCase();

  if (normalizedValue === 'simple' || normalizedValue === 'essentials' || normalizedValue === 'lite') {
    return 'simple';
  }

  return 'personal';
}

export const APP_VARIANT = normalizeAppVariant(import.meta.env.VITE_APP_VARIANT);
export const APP_VARIANT_CONFIG = APP_VARIANTS[APP_VARIANT];

export function getVariantStorageKey(key: string) {
  return APP_VARIANT_CONFIG.storagePrefix ? `${APP_VARIANT_CONFIG.storagePrefix}:${key}` : key;
}
