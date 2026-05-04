import { Capacitor, registerPlugin } from '@capacitor/core';

type PartnerReminderRole = 'owner' | 'partner';

interface PartnerReminderBridgePlugin {
  syncConfig(options: {
    enabled: boolean;
    role: PartnerReminderRole;
    shareCode: string;
    supabaseUrl: string;
    publishableKey: string;
  }): Promise<void>;
}

const PartnerReminderBridge = registerPlugin<PartnerReminderBridgePlugin>('PartnerReminderBridge');

function isAndroidNative() {
  return Capacitor.getPlatform() === 'android';
}

function hasConfigValue(value: string | undefined) {
  return typeof value === 'string' && value.trim().length > 0 && !value.includes('your-');
}

export function canUseBackgroundPartnerReminderService() {
  return (
    isAndroidNative()
    && hasConfigValue(import.meta.env.VITE_SUPABASE_URL)
    && hasConfigValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  );
}

export async function syncPartnerReminderService(options: {
  enabled: boolean;
  role: PartnerReminderRole;
  shareCode: string;
}) {
  if (!isAndroidNative()) {
    return;
  }

  if (
    !options.enabled
    || !options.shareCode
    || !hasConfigValue(import.meta.env.VITE_SUPABASE_URL)
    || !hasConfigValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  ) {
    await PartnerReminderBridge.syncConfig({
      enabled: false,
      role: options.role,
      shareCode: options.shareCode,
      supabaseUrl: '',
      publishableKey: '',
    });
    return;
  }

  await PartnerReminderBridge.syncConfig({
    enabled: true,
    role: options.role,
    shareCode: options.shareCode,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
}
