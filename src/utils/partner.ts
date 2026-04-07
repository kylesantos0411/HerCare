import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { ensureAnonymousSession, isFirebaseConfigured } from './firebase';
import {
  getMealProgress,
  getTodayMealEntries,
  type MealEntry,
  type MealType,
} from './meals';
import {
  getStudyRemainingSeconds,
  type StudyPresetMinutes,
  type StudyTimerState,
  type StudyTimerStatus,
} from './study';
import {
  formatShiftDateLabel,
  formatShiftTimeRange,
  getNextShift,
  getShiftStatus,
  type ShiftEntry,
  type ShiftType,
} from './shift';
import {
  getLatestSleepLog,
  isSleepBelowTarget,
  sleepQualityLabels,
  type SleepLogEntry,
  type SleepQuality,
} from './sleep';
import {
  getCurrentHydrationCount,
  getLatestMoodEntry,
  getTodayHydrationEntries,
  moodLabels,
  type HydrationEntry,
  type MoodEntry,
  type MoodState,
} from './wellness';

const PARTNER_SHARE_COLLECTION = 'partnerShares';
const SHARE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHARE_CODE_LENGTH = 8;
const PARTNER_POLL_INTERVAL_MS = 4000;
const CREATE_PARTNER_SHARE_ATTEMPTS = 6;

export interface PartnerStudyStatusSnapshot {
  status: StudyTimerStatus;
  selectedMinutes: StudyPresetMinutes;
  totalSeconds: number;
  remainingSeconds: number;
  endsAtIso: string | null;
  completedAtIso: string | null;
  updatedAtIso: string;
}

export interface PartnerStatusSnapshot {
  dayKey: string;
  updatedAtIso: string;
  hydration: {
    current: number;
    goal: number;
    lastLoggedAt: string | null;
  };
  meals: {
    completedCount: number;
    goalCount: number;
    hasBreakfast: boolean;
    lastMealType: MealType | null;
    lastLoggedAt: string | null;
  };
  mood: {
    mood: MoodState | null;
    label: string;
    energyLevel: number | null;
    stressLevel: number | null;
    updatedAt: string | null;
  };
  sleep: {
    durationMinutes: number | null;
    quality: SleepQuality | null;
    qualityLabel: string;
    targetHours: number;
    belowTarget: boolean;
    loggedAt: string | null;
  };
  shift: {
    type: ShiftType | null;
    status: string | null;
    label: string;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
  };
  study: PartnerStudyStatusSnapshot;
}

export interface PartnerQuickCheckIn {
  message: string;
  createdAtIso: string;
}

export interface PartnerLocationCheckIn {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  sharedAtIso: string;
}

export type PartnerCareNudgeType = 'hydration' | 'meals' | 'mood' | 'sleep';

export interface PartnerGentleNudge {
  type: PartnerCareNudgeType;
  title: string;
  message: string;
  createdAtIso: string;
}

export interface PartnerShareDocument {
  shareCode: string;
  ownerUid: string;
  partnerUid: string | null;
  ownerName: string;
  partnerName: string;
  sharingEnabled: boolean;
  locationSharingEnabled: boolean;
  partnerPushToken: string | null;
  partnerPushAlertsEnabled: boolean;
  partnerPushUpdatedAtIso: string | null;
  latestStatus: PartnerStatusSnapshot | null;
  latestCheckIn: PartnerQuickCheckIn | null;
  latestPartnerNudge: PartnerGentleNudge | null;
  latestLocation: PartnerLocationCheckIn | null;
  createdAtIso: string;
  updatedAtIso: string;
}

interface BuildPartnerSnapshotOptions {
  dayKey: string;
  referenceDate: Date;
  waterGoal: number;
  hydrationEntries: HydrationEntry[];
  legacyHydrationCount: number;
  moodEntries: MoodEntry[];
  currentMood: MoodState;
  sleepLogs: SleepLogEntry[];
  sleepTargetHours: number;
  mealEntries: MealEntry[];
  shifts: ShiftEntry[];
  studyTimer: StudyTimerState;
}

function getPartnerErrorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : '';
}

function getPartnerErrorMessage(error: unknown) {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message
    : '';
}

function createPartnerFriendlyError(error: unknown, fallbackMessage: string) {
  const errorCode = getPartnerErrorCode(error).toLowerCase();
  const errorMessage = getPartnerErrorMessage(error).toLowerCase();

  if (
    errorCode === 'unavailable' ||
    errorCode === 'deadline-exceeded' ||
    errorCode === 'cancelled' ||
    errorCode === 'auth/network-request-failed' ||
    errorMessage.includes('client is offline') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('network')
  ) {
    return new Error('This phone is offline right now. Reconnect to the internet and try again.');
  }

  if (errorCode === 'unauthenticated') {
    return new Error('Unable to start a secure partner session right now. Try again in a moment.');
  }

  if (errorCode === 'not-found') {
    return new Error('That share code is unavailable. Check the code and try again.');
  }

  return new Error(fallbackMessage);
}

export function normalizeShareCode(value: string) {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, SHARE_CODE_LENGTH);
}

function createShareCode() {
  let output = '';

  for (let index = 0; index < SHARE_CODE_LENGTH; index += 1) {
    const position = Math.floor(Math.random() * SHARE_CODE_ALPHABET.length);
    output += SHARE_CODE_ALPHABET[position];
  }

  return output;
}

export function buildPartnerStatusSnapshot({
  dayKey,
  referenceDate,
  waterGoal,
  hydrationEntries,
  legacyHydrationCount,
  moodEntries,
  currentMood,
  sleepLogs,
  sleepTargetHours,
  mealEntries,
  shifts,
  studyTimer,
}: BuildPartnerSnapshotOptions): PartnerStatusSnapshot {
  const latestMoodEntry = getLatestMoodEntry(moodEntries);
  const latestSleepLog = getLatestSleepLog(sleepLogs);
  const nextShift = getNextShift(shifts, referenceDate);
  const todayHydrationEntries = getTodayHydrationEntries(hydrationEntries, referenceDate);
  const todayMealEntries = getTodayMealEntries(mealEntries, referenceDate);
  const mealProgress = getMealProgress(mealEntries, referenceDate);
  const studyRemainingSeconds =
    studyTimer.status === 'running' && studyTimer.endsAt
      ? getStudyRemainingSeconds(studyTimer.endsAt)
      : studyTimer.remainingSeconds;

  return {
    dayKey,
    updatedAtIso: new Date().toISOString(),
    hydration: {
      current: getCurrentHydrationCount(hydrationEntries, legacyHydrationCount, referenceDate),
      goal: waterGoal,
      lastLoggedAt: todayHydrationEntries[0]?.loggedAt ?? null,
    },
    meals: {
      completedCount: mealProgress.completedCount,
      goalCount: mealProgress.goalCount,
      hasBreakfast: todayMealEntries.some(
        (entry) => entry.type === 'Breakfast' && (entry.status === 'packed' || entry.status === 'eaten'),
      ),
      lastMealType: todayMealEntries[0]?.type ?? null,
      lastLoggedAt: todayMealEntries[0]?.loggedAt ?? null,
    },
    mood: {
      mood: latestMoodEntry?.mood ?? currentMood,
      label: latestMoodEntry ? moodLabels[latestMoodEntry.mood] : moodLabels[currentMood],
      energyLevel: latestMoodEntry?.energyLevel ?? null,
      stressLevel: latestMoodEntry?.stressLevel ?? null,
      updatedAt: latestMoodEntry?.loggedAt ?? null,
    },
    sleep: {
      durationMinutes: latestSleepLog?.durationMinutes ?? null,
      quality: latestSleepLog?.quality ?? null,
      qualityLabel: latestSleepLog ? sleepQualityLabels[latestSleepLog.quality] : 'No sleep log yet',
      targetHours: sleepTargetHours,
      belowTarget: isSleepBelowTarget(latestSleepLog, sleepTargetHours),
      loggedAt: latestSleepLog?.loggedAt ?? null,
    },
    shift: {
      type: nextShift?.type ?? null,
      status: nextShift ? getShiftStatus(nextShift, referenceDate) : null,
      label: nextShift
        ? `${formatShiftDateLabel(nextShift.date)} · ${formatShiftTimeRange(nextShift.startTime, nextShift.endTime)}`
        : 'No shift scheduled yet',
      date: nextShift?.date ?? null,
      startTime: nextShift?.startTime ?? null,
      endTime: nextShift?.endTime ?? null,
    },
    study: {
      status: studyTimer.status,
      selectedMinutes: studyTimer.selectedMinutes,
      totalSeconds: studyTimer.totalSeconds,
      remainingSeconds: studyRemainingSeconds,
      endsAtIso: studyTimer.endsAt,
      completedAtIso: studyTimer.completedAt,
      updatedAtIso: new Date().toISOString(),
    },
  };
}

async function ensureConfiguredSession() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase has not been configured yet.');
  }

  let session;

  try {
    session = await ensureAnonymousSession();
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to start a secure partner session right now.');
  }

  if (!session) {
    throw new Error('Firebase has not been configured yet.');
  }

  if (!session.user) {
    throw new Error('Unable to start a secure partner session right now.');
  }

  return session;
}

export async function createPartnerShare(ownerName: string) {
  const session = await ensureConfiguredSession();
  const nowIso = new Date().toISOString();

  for (let attempt = 0; attempt < CREATE_PARTNER_SHARE_ATTEMPTS; attempt += 1) {
    const shareCode = createShareCode();
    const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, shareCode);

    try {
      await setDoc(shareRef, {
        shareCode,
        ownerUid: session.user.uid,
        partnerUid: null,
        ownerName: ownerName.trim() || 'Love',
        partnerName: '',
        sharingEnabled: true,
        locationSharingEnabled: false,
        partnerPushToken: null,
        partnerPushAlertsEnabled: false,
        partnerPushUpdatedAtIso: null,
        latestStatus: null,
        latestCheckIn: null,
        latestPartnerNudge: null,
        latestLocation: null,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      } satisfies PartnerShareDocument);

      return shareCode;
    } catch (caughtError) {
      const errorCode = getPartnerErrorCode(caughtError).toLowerCase();

      // A permission-denied on create usually means the random short code already exists.
      if (errorCode === 'permission-denied' && attempt < CREATE_PARTNER_SHARE_ATTEMPTS - 1) {
        continue;
      }

      throw createPartnerFriendlyError(caughtError, 'Unable to create a share code right now.');
    }
  }

  throw new Error('Unable to create a fresh share code right now. Please try again.');
}

export async function connectToPartnerShare(shareCode: string, partnerName: string) {
  const normalizedCode = normalizeShareCode(shareCode);

  if (normalizedCode.length !== SHARE_CODE_LENGTH) {
    throw new Error('Enter the full 8-character share code.');
  }

  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizedCode);
  
  try {
    await updateDoc(shareRef, {
      partnerUid: session.user.uid,
      partnerName: partnerName.trim() || 'Kai',
      updatedAtIso: new Date().toISOString(),
    });
  } catch (caughtError) {
    const errorCode = getPartnerErrorCode(caughtError);

    if (errorCode === 'not-found' || errorCode === 'permission-denied') {
      throw new Error('That share code is unavailable. Check the code and try again.');
    }

    throw createPartnerFriendlyError(caughtError, 'Unable to open partner view right now.');
  }

  return normalizedCode;
}

export async function updatePartnerSharingPreferences(options: {
  shareCode: string;
  ownerName: string;
  sharingEnabled: boolean;
  locationSharingEnabled: boolean;
}) {
  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizeShareCode(options.shareCode));
  const updates: {
    ownerName: string;
    sharingEnabled: boolean;
    locationSharingEnabled: boolean;
    updatedAtIso: string;
    latestLocation?: null;
  } = {
    ownerName: options.ownerName.trim() || 'Love',
    sharingEnabled: options.sharingEnabled,
    locationSharingEnabled: options.locationSharingEnabled,
    updatedAtIso: new Date().toISOString(),
  };

  if (!options.locationSharingEnabled) {
    updates.latestLocation = null;
  }

  try {
    await updateDoc(shareRef, updates);
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to update sharing right now.');
  }
}

export async function syncPartnerStatus(options: {
  shareCode: string;
  ownerName: string;
  sharingEnabled: boolean;
  snapshot: PartnerStatusSnapshot;
}) {
  if (!options.shareCode || !options.sharingEnabled || !isFirebaseConfigured()) {
    return;
  }

  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizeShareCode(options.shareCode));

  try {
    await updateDoc(shareRef, {
      ownerName: options.ownerName.trim() || 'Love',
      sharingEnabled: options.sharingEnabled,
      latestStatus: options.snapshot,
      updatedAtIso: new Date().toISOString(),
    });
  } catch {
    // Best-effort background sync only.
  }
}

export async function sendPartnerQuickCheckIn(shareCode: string, message: string) {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new Error('Write a little message first.');
  }

  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizeShareCode(shareCode));

  try {
    await updateDoc(shareRef, {
      latestCheckIn: {
        message: trimmedMessage,
        createdAtIso: new Date().toISOString(),
      } satisfies PartnerQuickCheckIn,
      updatedAtIso: new Date().toISOString(),
    });
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to send the check-in right now.');
  }
}

export async function sendPartnerCareNudge(
  shareCode: string,
  nudge: Pick<PartnerGentleNudge, 'type' | 'title' | 'message'>,
) {
  const normalizedCode = normalizeShareCode(shareCode);

  if (!normalizedCode) {
    throw new Error('Reconnect the partner code first.');
  }

  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizedCode);
  const createdAtIso = new Date().toISOString();

  try {
    await updateDoc(shareRef, {
      latestPartnerNudge: {
        type: nudge.type,
        title: nudge.title.trim(),
        message: nudge.message.trim(),
        createdAtIso,
      } satisfies PartnerGentleNudge,
      updatedAtIso: createdAtIso,
    });
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to send the gentle nudge right now.');
  }
}

export async function sharePartnerLocationCheckIn(
  shareCode: string,
  coordinates: Pick<PartnerLocationCheckIn, 'latitude' | 'longitude' | 'accuracy'>,
) {
  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizeShareCode(shareCode));

  try {
    await updateDoc(shareRef, {
      latestLocation: {
        ...coordinates,
        sharedAtIso: new Date().toISOString(),
      } satisfies PartnerLocationCheckIn,
      updatedAtIso: new Date().toISOString(),
    });
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to share the current location right now.');
  }
}

export async function getPartnerShare(shareCode: string) {
  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizeShareCode(shareCode));
  let snapshot;

  try {
    snapshot = await getDoc(shareRef);
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to load partner updates right now.');
  }

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as PartnerShareDocument;
}

export async function updatePartnerPushSubscription(options: {
  shareCode: string;
  pushToken: string | null;
  alertsEnabled: boolean;
}) {
  const normalizedCode = normalizeShareCode(options.shareCode);

  if (!normalizedCode) {
    return;
  }

  const session = await ensureConfiguredSession();
  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizedCode);

  try {
    await updateDoc(shareRef, {
      partnerPushToken: options.alertsEnabled ? options.pushToken : null,
      partnerPushAlertsEnabled: options.alertsEnabled,
      partnerPushUpdatedAtIso: new Date().toISOString(),
    });
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to update partner alerts right now.');
  }
}

export async function subscribeToPartnerShare(
  shareCode: string,
  onValue: (value: PartnerShareDocument | null) => void,
  onError: (error: Error) => void,
) {
  const normalizedCode = normalizeShareCode(shareCode);

  if (!normalizedCode || !isFirebaseConfigured()) {
    onValue(null);
    return (() => {}) as Unsubscribe;
  }

  let session;

  try {
    session = await ensureConfiguredSession();
  } catch (caughtError) {
    onError(createPartnerFriendlyError(caughtError, 'Unable to load partner updates.'));
    return (() => {}) as Unsubscribe;
  }

  const shareRef = doc(session.db, PARTNER_SHARE_COLLECTION, normalizedCode);
  let lastSerializedValue = '';

  const emitSnapshotValue = (snapshot: Awaited<ReturnType<typeof getDoc>>) => {
    const nextValue = snapshot.exists() ? (snapshot.data() as PartnerShareDocument) : null;
    const serializedValue = JSON.stringify(nextValue);

    if (serializedValue === lastSerializedValue) {
      return;
    }

    lastSerializedValue = serializedValue;
    onValue(nextValue);
  };

  const pollLatestValue = async () => {
    try {
      const snapshot = await getDoc(shareRef);
      emitSnapshotValue(snapshot);
    } catch (error) {
      onError(createPartnerFriendlyError(error, 'Unable to refresh partner updates.'));
    }
  };

  const intervalId = window.setInterval(() => {
    void pollLatestValue();
  }, PARTNER_POLL_INTERVAL_MS);

  const handleVisibilityRefresh = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      void pollLatestValue();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleVisibilityRefresh);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityRefresh);
  }

  void pollLatestValue();

  const unsubscribe = onSnapshot(
    shareRef,
    (snapshot) => {
      emitSnapshotValue(snapshot);
    },
    (error) => {
      onError(createPartnerFriendlyError(error, 'Unable to load partner updates.'));
    },
  );

  return () => {
    window.clearInterval(intervalId);

    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleVisibilityRefresh);
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    }

    unsubscribe();
  };
}

export function formatPartnerTimestamp(value: string | null) {
  if (!value) {
    return 'Not shared yet';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getMapsUrl(location: PartnerLocationCheckIn | null) {
  if (!location) {
    return '';
  }

  return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
}
