export type SleepQuality = 'poor' | 'fair' | 'good' | 'great';

export interface SleepLogEntry {
  id: string;
  startTime: string;
  endTime: string;
  quality: SleepQuality;
  notes: string;
  durationMinutes: number;
  loggedAt: string;
  dateLabel: string;
}

export const sleepQualityLabels: Record<SleepQuality, string> = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  great: 'Great',
};

function toMinutes(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function calculateSleepDuration(startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }

  if (start === end) {
    return 0;
  }

  const difference = end - start;
  return difference > 0 ? difference : difference + 24 * 60;
}

export function formatDuration(durationMinutes: number) {
  if (durationMinutes <= 0) {
    return '0m';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

export function formatTargetHours(hours: number) {
  const formatted = Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
  return `${formatted.replace(/\.0$/, '')}h`;
}

export function getLatestSleepLog(logs: SleepLogEntry[]) {
  return [...logs].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null;
}

export function isSleepBelowTarget(log: SleepLogEntry | null, targetHours: number) {
  if (!log) {
    return false;
  }

  return log.durationMinutes < targetHours * 60;
}
