import type { NoteItem } from './notes';
import type { MealEntry } from './meals';
import type { ShiftEntry } from './shift';
import type { SleepLogEntry } from './sleep';
import type { HydrationEntry, MoodEntry } from './wellness';

export const showcaseScreenIds = [
  'splash',
  'welcome',
  'home',
  'shift',
  'meals',
  'wellness',
  'hydration',
  'sleep',
  'mood',
  'notes',
  'study',
  'you',
  'open_when',
] as const;

export type ShowcaseScreen = (typeof showcaseScreenIds)[number];

function isShowcaseScreen(value: string | null): value is ShowcaseScreen {
  return value !== null && showcaseScreenIds.includes(value as ShowcaseScreen);
}

export function getShowcaseScreen(search = typeof window !== 'undefined' ? window.location.search : '') {
  if (!search) {
    return null;
  }

  const value = new URLSearchParams(search).get('showcase');
  return isShowcaseScreen(value) ? value : null;
}

export function isShowcaseCaptureMode(search = typeof window !== 'undefined' ? window.location.search : '') {
  if (!search) {
    return false;
  }

  return new URLSearchParams(search).get('capture') === '1';
}

function toIso(date: Date, hours: number, minutes: number) {
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate.toISOString();
}

function toLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeLabel(date: Date, hours: number, minutes: number) {
  return new Date(toIso(date, hours, minutes)).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function setStorageValue(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function seedShowcaseData() {
  if (typeof window === 'undefined') {
    return;
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const twoDaysOut = new Date(today);
  twoDaysOut.setDate(twoDaysOut.getDate() + 2);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const scheduledShifts: ShiftEntry[] = [
    {
      id: 'showcase-shift-next',
      date: toLocalDateInput(tomorrow),
      type: 'Night Duty',
      startTime: '19:20',
      endTime: '07:00',
      notes: 'Bring extra water and protein bar for the late stretch.',
    },
    {
      id: 'showcase-shift-followup',
      date: toLocalDateInput(twoDaysOut),
      type: 'Night Duty',
      startTime: '19:00',
      endTime: '07:00',
      notes: 'Charge phone before leaving.',
    },
  ];

  const hydrationHistory: HydrationEntry[] = [
    {
      id: 'hydration-1',
      amount: 2,
      loggedAt: toIso(today, 8, 10),
      timeLabel: formatTimeLabel(today, 8, 10),
    },
    {
      id: 'hydration-2',
      amount: 1,
      loggedAt: toIso(today, 11, 45),
      timeLabel: formatTimeLabel(today, 11, 45),
    },
    {
      id: 'hydration-3',
      amount: 1,
      loggedAt: toIso(today, 15, 20),
      timeLabel: formatTimeLabel(today, 15, 20),
    },
  ];

  const moodEntries: MoodEntry[] = [
    {
      id: 'mood-1',
      mood: 'good',
      energyLevel: 3,
      stressLevel: 4,
      notes: 'A little stretched, but still steady.',
      loggedAt: toIso(today, 17, 40),
      dateLabel: formatDateLabel(today),
      timeLabel: formatTimeLabel(today, 17, 40),
    },
  ];

  const sleepLogs: SleepLogEntry[] = [
    {
      id: 'sleep-1',
      startTime: '23:10',
      endTime: '05:50',
      quality: 'fair',
      notes: 'Fell asleep quickly but woke up a couple of times.',
      durationMinutes: 400,
      loggedAt: toIso(today, 6, 15),
      dateLabel: formatDateLabel(today),
    },
  ];

  const mealEntries: MealEntry[] = [
    {
      id: 'meal-1',
      type: 'Snack',
      time: '16:00',
      food: 'Crackers and iced coffee',
      notes: 'Quick fuel before the long stretch.',
      status: 'eaten',
      photoName: '',
      photoDataUrl: '',
      loggedAt: toIso(today, 16, 0),
      dateLabel: formatDateLabel(today),
    },
    {
      id: 'meal-2',
      type: 'Lunch',
      time: '12:40',
      food: 'Rice bowl',
      notes: 'Packed ahead for shift.',
      status: 'packed',
      photoName: '',
      photoDataUrl: '',
      loggedAt: toIso(today, 12, 40),
      dateLabel: formatDateLabel(today),
    },
    {
      id: 'meal-3',
      type: 'Breakfast',
      time: '07:15',
      food: 'Oatmeal and banana',
      notes: 'Easy start before errands.',
      status: 'eaten',
      photoName: '',
      photoDataUrl: '',
      loggedAt: toIso(today, 7, 15),
      dateLabel: formatDateLabel(today),
    },
    {
      id: 'meal-4',
      type: 'Dinner',
      time: '20:15',
      food: 'Dinner break',
      notes: 'Skipped because the floor got busy.',
      status: 'skipped',
      photoName: '',
      photoDataUrl: '',
      loggedAt: toIso(today, 20, 15),
      dateLabel: formatDateLabel(today),
    },
    {
      id: 'meal-5',
      type: 'Dinner',
      time: '19:10',
      food: 'Soup and toast',
      notes: 'Something light after shift.',
      status: 'eaten',
      photoName: '',
      photoDataUrl: '',
      loggedAt: toIso(yesterday, 19, 10),
      dateLabel: formatDateLabel(yesterday),
    },
    {
      id: 'meal-6',
      type: 'Breakfast',
      time: '08:00',
      food: 'Yogurt cup',
      notes: 'Grab-and-go breakfast.',
      status: 'eaten',
      photoName: '',
      photoDataUrl: '',
      loggedAt: toIso(yesterday, 8, 0),
      dateLabel: formatDateLabel(yesterday),
    },
  ];

  const notes: NoteItem[] = [
    {
      id: 'note-buy-list',
      title: 'Before next shift',
      body: '',
      date: formatDateLabel(today),
      category: 'Buy List',
      reminderEnabled: true,
      checklistItems: [
        { id: 'buy-1', text: 'Protein bars', checked: true },
        { id: 'buy-2', text: 'Electrolyte drink', checked: false },
        { id: 'buy-3', text: 'Extra pens', checked: false },
      ],
    },
    {
      id: 'note-duty',
      title: 'Tiny duty to-dos',
      body: '',
      date: formatDateLabel(today),
      category: 'Duty To-Dos',
      checklistItems: [
        { id: 'duty-1', text: 'Double-check handover note', checked: true },
        { id: 'duty-2', text: 'Refill badge reel pouch', checked: false },
        { id: 'duty-3', text: 'Pack charger', checked: true },
      ],
    },
    {
      id: 'note-personal',
      title: 'Little reminder',
      body: 'You do not have to be perfect to be caring.',
      date: formatDateLabel(today),
      category: 'Personal Notes',
      reminderEnabled: false,
    },
  ];

  setStorageValue('hercare_setup_complete', true);
  setStorageValue('hercare_logged_in', true);
  setStorageValue('hercare_user_name', 'Love');
  setStorageValue('hercare_notifications_enabled', true);
  setStorageValue('hercare_night_shift_enabled', false);
  setStorageValue('hercare_water_target', 8);
  setStorageValue('hercare_sleep_target_hours', 7.5);
  setStorageValue('hercare_shift_preference', 'Night Duty');
  setStorageValue('hercare_hydration_count', 4);
  setStorageValue('hercare_hydration_history', hydrationHistory);
  setStorageValue('hercare_hydration_reminders_enabled', true);
  setStorageValue('hercare_mood', 'good');
  setStorageValue('hercare_mood_entries', moodEntries);
  setStorageValue('hercare_sleep_logs', sleepLogs);
  setStorageValue('hercare_meal_entries', mealEntries);
  setStorageValue('hercare_user_notes', notes);
  setStorageValue('hercare_scheduled_shifts', scheduledShifts);
  setStorageValue('hercare_shift_task_state', {
    'showcase-shift-next': ['pack-meals', 'drink-water'],
  });
  setStorageValue('hercare_partner_share_code', 'KAW3B5T3');
  setStorageValue('hercare_partner_sharing_enabled', true);
  setStorageValue('hercare_partner_location_enabled', true);
}
