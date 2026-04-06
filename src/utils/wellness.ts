export type MoodState = 'tired' | 'neutral' | 'good' | 'great';

export interface MoodEntry {
  id: string;
  mood: MoodState;
  energyLevel: number;
  stressLevel: number;
  notes: string;
  loggedAt: string;
  dateLabel: string;
  timeLabel: string;
}

export interface HydrationEntry {
  id: string;
  amount: number;
  loggedAt: string;
  timeLabel: string;
}

export const moodLabels: Record<MoodState, string> = {
  tired: 'Tired',
  neutral: 'Neutral',
  good: 'Good',
  great: 'Great',
};

export function getLatestMoodEntry(entries: MoodEntry[]) {
  return [...entries].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null;
}

function isSameLocalDay(timestamp: string, referenceDate = new Date()) {
  const entryDate = new Date(timestamp);

  return (
    entryDate.getFullYear() === referenceDate.getFullYear() &&
    entryDate.getMonth() === referenceDate.getMonth() &&
    entryDate.getDate() === referenceDate.getDate()
  );
}

export function getTodayHydrationEntries(entries: HydrationEntry[], referenceDate = new Date()) {
  return entries
    .filter((entry) => isSameLocalDay(entry.loggedAt, referenceDate))
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
}

export function getLatestHydrationEntry(entries: HydrationEntry[]) {
  return [...entries].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null;
}

export function getCurrentHydrationCount(entries: HydrationEntry[], legacyCount = 0, referenceDate = new Date()) {
  const todayEntries = getTodayHydrationEntries(entries, referenceDate);

  if (todayEntries.length > 0) {
    return todayEntries.reduce((total, entry) => total + entry.amount, 0);
  }

  return entries.length === 0 ? legacyCount : 0;
}

export function formatHydrationAmount(amount: number) {
  return `${amount} ${amount === 1 ? 'glass' : 'glasses'}`;
}
