export const studyPresetOptions = [
  { minutes: 2, label: '2m', description: 'Ultra quick' },
  { minutes: 5, label: '5m', description: 'Short break study' },
  { minutes: 10, label: '10m', description: 'Light focus' },
  { minutes: 25, label: '25m', description: 'Full Pomodoro' },
] as const;

export type StudyPresetMinutes = (typeof studyPresetOptions)[number]['minutes'];

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

function getStudyTotalSeconds(minutes: StudyPresetMinutes) {
  return minutes * 60;
}

export function createStudyTimerState(selectedMinutes: StudyPresetMinutes = 5): StudyTimerState {
  const totalSeconds = getStudyTotalSeconds(selectedMinutes);

  return {
    selectedMinutes,
    totalSeconds,
    remainingSeconds: totalSeconds,
    status: 'idle',
    endsAt: null,
    completedAt: null,
    completedSessions: 0,
  };
}

export function getStudyPresetOption(minutes: StudyPresetMinutes) {
  return studyPresetOptions.find((option) => option.minutes === minutes) ?? studyPresetOptions[1];
}

export function getStudyPresetLabel(minutes: StudyPresetMinutes) {
  return getStudyPresetOption(minutes).label;
}

export function getStudyPresetDescription(minutes: StudyPresetMinutes) {
  return getStudyPresetOption(minutes).description;
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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
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
