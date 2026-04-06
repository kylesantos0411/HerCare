export const STUDY_MINUTES_MIN = 1;
export const STUDY_MINUTES_MAX = 240;
export const DEFAULT_STUDY_MINUTES = 30;

export const studyPresetOptions = [
  { minutes: 30, label: '30m', description: 'Gentle focus block' },
  { minutes: 60, label: '1h', description: 'Steady study hour' },
  { minutes: 90, label: '1h 30m', description: 'Longer deep-focus stretch' },
  { minutes: 120, label: '2h', description: 'Big study session' },
] as const;

export type StudyPresetMinutes = number;

export type StudyTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface StudyTimerState {
  selectedMinutes: StudyPresetMinutes;
  totalSeconds: number;
  remainingSeconds: number;
  status: StudyTimerStatus;
  endsAt: string | null;
  completedAt: string | null;
  completedSessions: number;
}

export function sanitizeStudyMinutes(minutes: number, fallback = DEFAULT_STUDY_MINUTES) {
  if (!Number.isFinite(minutes)) {
    return fallback;
  }

  return Math.min(STUDY_MINUTES_MAX, Math.max(STUDY_MINUTES_MIN, Math.round(minutes)));
}

export function isStudyPresetMinutes(minutes: number) {
  return studyPresetOptions.some((option) => option.minutes === sanitizeStudyMinutes(minutes));
}

function formatStudyMinutesLabel(minutes: number) {
  const safeMinutes = sanitizeStudyMinutes(minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${safeMinutes}m`;
}

function getStudyTotalSeconds(minutes: StudyPresetMinutes) {
  return sanitizeStudyMinutes(minutes) * 60;
}

export function createStudyTimerState(selectedMinutes: StudyPresetMinutes = DEFAULT_STUDY_MINUTES): StudyTimerState {
  const safeMinutes = sanitizeStudyMinutes(selectedMinutes);
  const totalSeconds = getStudyTotalSeconds(selectedMinutes);

  return {
    selectedMinutes: safeMinutes,
    totalSeconds,
    remainingSeconds: totalSeconds,
    status: 'idle',
    endsAt: null,
    completedAt: null,
    completedSessions: 0,
  };
}

export function getStudyPresetOption(minutes: StudyPresetMinutes) {
  return studyPresetOptions.find((option) => option.minutes === sanitizeStudyMinutes(minutes)) ?? null;
}

export function getStudyPresetLabel(minutes: StudyPresetMinutes) {
  return getStudyPresetOption(minutes)?.label ?? formatStudyMinutesLabel(minutes);
}

export function getStudyPresetDescription(minutes: StudyPresetMinutes) {
  return getStudyPresetOption(minutes)?.description ?? 'Custom focus time';
}

export function getStudyRemainingSeconds(endsAt: string, now = new Date()) {
  return Math.max(0, Math.ceil((Date.parse(endsAt) - now.getTime()) / 1000));
}

export function getStudyProgress(timer: StudyTimerState) {
  if (timer.totalSeconds <= 0) {
    return 0;
  }

  return Math.min(Math.max((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds, 0), 1);
}

export function formatStudyCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function selectStudyPreset(timer: StudyTimerState, selectedMinutes: StudyPresetMinutes): StudyTimerState {
  return {
    ...createStudyTimerState(selectedMinutes),
    completedSessions: timer.completedSessions,
  };
}

export function startStudyTimer(timer: StudyTimerState, now = new Date()): StudyTimerState {
  const remainingSeconds =
    timer.status === 'completed' || timer.remainingSeconds <= 0 ? timer.totalSeconds : timer.remainingSeconds;

  return {
    ...timer,
    remainingSeconds,
    status: 'running',
    endsAt: new Date(now.getTime() + remainingSeconds * 1000).toISOString(),
    completedAt: null,
  };
}

export function pauseStudyTimer(timer: StudyTimerState, now = new Date()): StudyTimerState {
  if (timer.status !== 'running' || !timer.endsAt) {
    return timer;
  }

  const remainingSeconds = getStudyRemainingSeconds(timer.endsAt, now);

  if (remainingSeconds <= 0) {
    return completeStudyTimer(timer, now);
  }

  return {
    ...timer,
    remainingSeconds,
    status: 'paused',
    endsAt: null,
  };
}

export function resetStudyTimer(timer: StudyTimerState): StudyTimerState {
  return {
    ...createStudyTimerState(timer.selectedMinutes),
    completedSessions: timer.completedSessions,
  };
}

export function completeStudyTimer(timer: StudyTimerState, now = new Date()): StudyTimerState {
  return {
    ...timer,
    remainingSeconds: 0,
    status: 'completed',
    endsAt: null,
    completedAt: now.toISOString(),
    completedSessions: timer.completedSessions + 1,
  };
}
