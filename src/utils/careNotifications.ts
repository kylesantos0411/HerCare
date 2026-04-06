import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import { APP_VARIANT_CONFIG, getVariantStorageKey } from '../config/appVariant';
import type { MealEntry } from './meals';
import { formatDuration, type SleepLogEntry } from './sleep';
import type { ShiftType } from './shift';
import { getCurrentHydrationCount, type HydrationEntry } from './wellness';

const CARE_CHANNEL_ID = 'hercare-care-reminders';
const CARE_MANAGED_IDS = Array.from({ length: 40 }, (_, index) => 1000 + index);
const LOW_SLEEP_ALERT_ID = 3000;
const HYDRATION_REMINDER_DAYS = 5;
const BREAKFAST_REMINDER_DAYS = 5;
const LOW_SLEEP_ALERT_STORAGE_KEY = 'hercare_last_low_sleep_alert_log_id';

interface SyncCareNotificationsOptions {
  notificationsEnabled: boolean;
  hydrationRemindersEnabled: boolean;
  shiftPreference: ShiftType;
  waterGoal: number;
  hydrationEntries: HydrationEntry[];
  mealEntries: MealEntry[];
  referenceDate?: Date;
}

interface SyncSleepAlertOptions {
  notificationsEnabled: boolean;
  latestSleepLog: SleepLogEntry | null;
  sleepTargetHours: number;
}

function isLocalNotificationsAvailable() {
  return Capacitor.getPlatform() !== 'web';
}

function getManagedNotificationDescriptors() {
  return CARE_MANAGED_IDS.map((id) => ({ id }));
}

function getStorageItem(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(getVariantStorageKey(key));
}

function setStorageItem(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getVariantStorageKey(key), value);
}

function removeStorageItem(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getVariantStorageKey(key));
}

function getHydrationReminderTitle() {
  return APP_VARIANT_CONFIG.features.personalTone ? 'Baby, water ka muna' : 'Hydration reminder';
}

function getHydrationReminderBody(currentHydrationCount: number, waterGoal: number, isToday: boolean) {
  if (APP_VARIANT_CONFIG.features.personalTone) {
    return isToday
      ? `Love, inom ka muna ha. ${currentHydrationCount} of ${waterGoal} glasses ka pa lang today. Kahit few sips muna, count pa rin yun.`
      : 'Baby, water ka ulit tomorrow ha. Kahit few sips lang muna, okay na yun.';
  }

  return isToday
    ? `You are at ${currentHydrationCount} of ${waterGoal} glasses today. A few sips still count.`
    : 'A quick reminder for tomorrow: keep water nearby and take a few sips when you can.';
}

function getBreakfastReminderTitle() {
  return APP_VARIANT_CONFIG.features.personalTone ? 'Kumain ka na ba, baby?' : 'Breakfast reminder';
}

function getBreakfastReminderBody(isToday: boolean) {
  if (APP_VARIANT_CONFIG.features.personalTone) {
    return isToday
      ? 'Love, if hindi ka pa nakakapag-breakfast, kain ka muna ha. Kahit something small lang, basta may laman tiyan mo.'
      : 'Reminder for tomorrow, baby: wag mo i-skip breakfast ha. Kahit light lang, okay na yun.';
  }

  return isToday
    ? 'If you have not eaten breakfast yet, try something small and steady when you can.'
    : 'Reminder for tomorrow: even a light breakfast can make the day feel steadier.';
}

function getLowSleepAlertTitle() {
  return APP_VARIANT_CONFIG.features.personalTone ? 'Baby, kulang tulog mo' : 'Low sleep reminder';
}

function getLowSleepAlertBody(durationMinutes: number) {
  if (APP_VARIANT_CONFIG.features.personalTone) {
    return `You only got ${formatDuration(durationMinutes)} of sleep, love. Please go extra gentle today and rest when you can.`;
  }

  return `You logged ${formatDuration(durationMinutes)} of sleep. Go easy today and rest when you can.`;
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

async function ensureNotificationChannel() {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }

  await LocalNotifications.createChannel({
    id: CARE_CHANNEL_ID,
    name: 'Care reminders',
    description: 'Hydration, meals, and rest reminders from HerCare.',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#B0A8E3',
  });
}

async function clearManagedNotifications() {
  if (!isLocalNotificationsAvailable()) {
    return;
  }

  await LocalNotifications.cancel({
    notifications: getManagedNotificationDescriptors(),
  });

  const delivered = await LocalNotifications.getDeliveredNotifications();
  const managedDelivered = delivered.notifications.filter((notification) =>
    CARE_MANAGED_IDS.includes(notification.id),
  );

  if (managedDelivered.length > 0) {
    await LocalNotifications.removeDeliveredNotifications({
      notifications: managedDelivered,
    });
  }
}

function createDateAt(baseDate: Date, dayOffset: number, hour: number, minute: number) {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function hasBreakfastLogged(entries: MealEntry[], date: Date) {
  return entries.some((entry) => {
    const entryDate = new Date(entry.loggedAt);

    return (
      isSameLocalDay(entryDate, date) &&
      entry.type === 'Breakfast' &&
      (entry.status === 'packed' || entry.status === 'eaten')
    );
  });
}

function getHydrationReminderTimes(shiftPreference: ShiftType) {
  switch (shiftPreference) {
    case 'Night Duty':
      return [
        { hour: 19, minute: 30 },
        { hour: 22, minute: 0 },
        { hour: 1, minute: 0 },
        { hour: 4, minute: 0 },
      ];
    case 'Day Shift':
      return [
        { hour: 7, minute: 30 },
        { hour: 10, minute: 30 },
        { hour: 13, minute: 30 },
        { hour: 16, minute: 30 },
      ];
    case 'Rotating':
    case 'Manual':
    default:
      return [
        { hour: 9, minute: 0 },
        { hour: 12, minute: 0 },
        { hour: 15, minute: 0 },
        { hour: 18, minute: 0 },
      ];
  }
}

function buildHydrationNotifications(
  shiftPreference: ShiftType,
  waterGoal: number,
  hydrationEntries: HydrationEntry[],
  referenceDate: Date,
) {
  const notifications: LocalNotificationSchema[] = [];
  const now = new Date();
  const reminderTimes = getHydrationReminderTimes(shiftPreference);
  const currentHydrationCount = getCurrentHydrationCount(hydrationEntries, 0, referenceDate);

  for (let dayOffset = 0; dayOffset < HYDRATION_REMINDER_DAYS; dayOffset += 1) {
    reminderTimes.forEach((time, index) => {
      const reminderDate = createDateAt(referenceDate, dayOffset, time.hour, time.minute);

      if (reminderDate <= now) {
        return;
      }

      if (dayOffset === 0 && currentHydrationCount >= waterGoal) {
        return;
      }

      notifications.push({
        id: 1000 + dayOffset * reminderTimes.length + index,
        title: getHydrationReminderTitle(),
        body: getHydrationReminderBody(currentHydrationCount, waterGoal, dayOffset === 0),
        schedule: {
          at: reminderDate,
          allowWhileIdle: true,
        },
        channelId: CARE_CHANNEL_ID,
        autoCancel: true,
      });
    });
  }

  return notifications;
}

function buildBreakfastNotifications(mealEntries: MealEntry[], referenceDate: Date) {
  const notifications: LocalNotificationSchema[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset < BREAKFAST_REMINDER_DAYS; dayOffset += 1) {
    const reminderDate = createDateAt(referenceDate, dayOffset, 9, 30);

    if (reminderDate <= now) {
      continue;
    }

    if (dayOffset === 0 && hasBreakfastLogged(mealEntries, referenceDate)) {
      continue;
    }

    notifications.push({
      id: 1025 + dayOffset,
      title: getBreakfastReminderTitle(),
      body: getBreakfastReminderBody(dayOffset === 0),
      schedule: {
        at: reminderDate,
        allowWhileIdle: true,
      },
      channelId: CARE_CHANNEL_ID,
      autoCancel: true,
    });
  }

  return notifications;
}

export async function syncScheduledCareNotifications(options: SyncCareNotificationsOptions) {
  if (!isLocalNotificationsAvailable()) {
    return;
  }

  await clearManagedNotifications();

  if (!options.notificationsEnabled) {
    return;
  }

  const hasPermission = await ensureNotificationAccess();

  if (!hasPermission) {
    return;
  }

  await ensureNotificationChannel();

  const referenceDate = options.referenceDate ?? new Date();
  const notifications: LocalNotificationSchema[] = [
    ...buildBreakfastNotifications(options.mealEntries, referenceDate),
  ];

  if (options.hydrationRemindersEnabled) {
    notifications.push(
      ...buildHydrationNotifications(
        options.shiftPreference,
        options.waterGoal,
        options.hydrationEntries,
        referenceDate,
      ),
    );
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

export async function syncLowSleepAlert(options: SyncSleepAlertOptions) {
  if (!isLocalNotificationsAvailable()) {
    return;
  }

  await LocalNotifications.cancel({
    notifications: [{ id: LOW_SLEEP_ALERT_ID }],
  });

  if (!options.notificationsEnabled) {
    return;
  }

  const latestSleepLog = options.latestSleepLog;
  const sleepTargetMinutes = options.sleepTargetHours * 60;

  if (!latestSleepLog || latestSleepLog.durationMinutes >= sleepTargetMinutes) {
    return;
  }

  if (getStorageItem(LOW_SLEEP_ALERT_STORAGE_KEY) === latestSleepLog.id) {
    return;
  }

  const hasPermission = await ensureNotificationAccess();

  if (!hasPermission) {
    return;
  }

  await ensureNotificationChannel();

  const alertDate = new Date(Date.now() + 60_000);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: LOW_SLEEP_ALERT_ID,
        title: getLowSleepAlertTitle(),
        body: getLowSleepAlertBody(latestSleepLog.durationMinutes),
        schedule: {
          at: alertDate,
          allowWhileIdle: true,
        },
        channelId: CARE_CHANNEL_ID,
        autoCancel: true,
      },
    ],
  });

  setStorageItem(LOW_SLEEP_ALERT_STORAGE_KEY, latestSleepLog.id);
}

export function resetLowSleepAlertMarker() {
  removeStorageItem(LOW_SLEEP_ALERT_STORAGE_KEY);
}
