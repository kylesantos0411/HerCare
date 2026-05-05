import type { RealtimeChannel } from '@supabase/supabase-js';
import { ensureAnonymousSession, getSupabaseClient, isFirebaseConfigured } from './firebase';
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

const PARTNER_SHARE_TABLE = 'partner_shares';
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

export interface PartnerWellnessStatusSnapshot {
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
  sleep: {
    durationMinutes: number | null;
    quality: SleepQuality | null;
    qualityLabel: string;
    targetHours: number;
    belowTarget: boolean;
    loggedAt: string | null;
  };
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
  ownerPushToken: string | null;
  ownerPushAlertsEnabled: boolean;
  ownerPushUpdatedAtIso: string | null;
  partnerPushToken: string | null;
  partnerPushAlertsEnabled: boolean;
  partnerPushUpdatedAtIso: string | null;
  latestStatus: PartnerStatusSnapshot | null;
  latestPartnerCareStatus: PartnerWellnessStatusSnapshot | null;
  latestCheckIn: PartnerQuickCheckIn | null;
  latestPartnerNudge: PartnerGentleNudge | null;
  latestOwnerNudge: PartnerGentleNudge | null;
  latestLocation: PartnerLocationCheckIn | null;
  createdAtIso: string;
  updatedAtIso: string;
}

interface PartnerShareRow {
  share_code: string;
  owner_uid: string;
  partner_uid: string | null;
  owner_name: string;
  partner_name: string;
  sharing_enabled: boolean;
  location_sharing_enabled: boolean;
  owner_push_token: string | null;
  owner_push_alerts_enabled: boolean;
  owner_push_updated_at: string | null;
  partner_push_token: string | null;
  partner_push_alerts_enabled: boolean;
  partner_push_updated_at: string | null;
  latest_status: PartnerStatusSnapshot | null;
  latest_partner_care_status: PartnerWellnessStatusSnapshot | null;
  latest_check_in: PartnerQuickCheckIn | null;
  latest_partner_nudge: PartnerGentleNudge | null;
  latest_owner_nudge: PartnerGentleNudge | null;
  latest_location: PartnerLocationCheckIn | null;
  created_at: string;
  updated_at: string;
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

type BuildPartnerWellnessSnapshotOptions = Pick<
  BuildPartnerSnapshotOptions,
  'dayKey' | 'referenceDate' | 'waterGoal' | 'hydrationEntries' | 'legacyHydrationCount' | 'sleepLogs' | 'sleepTargetHours' | 'mealEntries'
>;

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
    errorMessage.includes('offline') ||
    errorMessage.includes('network') ||
    errorMessage.includes('fetch')
  ) {
    return new Error('This phone is offline right now. Reconnect to the internet and try again.');
  }

  if (errorCode === 'unauthenticated' || errorCode === '401') {
    return new Error('Unable to start a secure partner session right now. Try again in a moment.');
  }

  if (errorCode === 'pgrst116' || errorCode === 'not-found') {
    return new Error('That share code is unavailable. Check the code and try again.');
  }

  return new Error(fallbackMessage);
}

function mapPartnerShareRow(row: PartnerShareRow | null): PartnerShareDocument | null {
  if (!row) {
    return null;
  }

  return {
    shareCode: row.share_code,
    ownerUid: row.owner_uid,
    partnerUid: row.partner_uid,
    ownerName: row.owner_name,
    partnerName: row.partner_name,
    sharingEnabled: row.sharing_enabled,
    locationSharingEnabled: row.location_sharing_enabled,
    ownerPushToken: row.owner_push_token,
    ownerPushAlertsEnabled: row.owner_push_alerts_enabled,
    ownerPushUpdatedAtIso: row.owner_push_updated_at,
    partnerPushToken: row.partner_push_token,
    partnerPushAlertsEnabled: row.partner_push_alerts_enabled,
    partnerPushUpdatedAtIso: row.partner_push_updated_at,
    latestStatus: row.latest_status,
    latestPartnerCareStatus: row.latest_partner_care_status,
    latestCheckIn: row.latest_check_in,
    latestPartnerNudge: row.latest_partner_nudge,
    latestOwnerNudge: row.latest_owner_nudge,
    latestLocation: row.latest_location,
    createdAtIso: row.created_at,
    updatedAtIso: row.updated_at,
  };
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

function buildWellnessSections({
  referenceDate,
  waterGoal,
  hydrationEntries,
  legacyHydrationCount,
  sleepLogs,
  sleepTargetHours,
  mealEntries,
}: Omit<BuildPartnerWellnessSnapshotOptions, 'dayKey'>) {
  const latestSleepLog = getLatestSleepLog(sleepLogs);
  const todayHydrationEntries = getTodayHydrationEntries(hydrationEntries, referenceDate);
  const todayMealEntries = getTodayMealEntries(mealEntries, referenceDate);
  const mealProgress = getMealProgress(mealEntries, referenceDate);

  return {
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
    sleep: {
      durationMinutes: latestSleepLog?.durationMinutes ?? null,
      quality: latestSleepLog?.quality ?? null,
      qualityLabel: latestSleepLog ? sleepQualityLabels[latestSleepLog.quality] : 'No sleep log yet',
      targetHours: sleepTargetHours,
      belowTarget: isSleepBelowTarget(latestSleepLog, sleepTargetHours),
      loggedAt: latestSleepLog?.loggedAt ?? null,
    },
  };
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
  const nextShift = getNextShift(shifts, referenceDate);
  const studyRemainingSeconds =
    studyTimer.status === 'running' && studyTimer.endsAt
      ? getStudyRemainingSeconds(studyTimer.endsAt)
      : studyTimer.remainingSeconds;
  const wellness = buildWellnessSections({
    referenceDate,
    waterGoal,
    hydrationEntries,
    legacyHydrationCount,
    sleepLogs,
    sleepTargetHours,
    mealEntries,
  });

  return {
    dayKey,
    updatedAtIso: new Date().toISOString(),
    hydration: wellness.hydration,
    meals: wellness.meals,
    mood: {
      mood: latestMoodEntry?.mood ?? currentMood,
      label: latestMoodEntry ? moodLabels[latestMoodEntry.mood] : moodLabels[currentMood],
      energyLevel: latestMoodEntry?.energyLevel ?? null,
      stressLevel: latestMoodEntry?.stressLevel ?? null,
      updatedAt: latestMoodEntry?.loggedAt ?? null,
    },
    sleep: wellness.sleep,
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

export function buildPartnerWellnessSnapshot({
  dayKey,
  referenceDate,
  waterGoal,
  hydrationEntries,
  legacyHydrationCount,
  sleepLogs,
  sleepTargetHours,
  mealEntries,
}: BuildPartnerWellnessSnapshotOptions): PartnerWellnessStatusSnapshot {
  return {
    dayKey,
    updatedAtIso: new Date().toISOString(),
    ...buildWellnessSections({
      referenceDate,
      waterGoal,
      hydrationEntries,
      legacyHydrationCount,
      sleepLogs,
      sleepTargetHours,
      mealEntries,
    }),
  };
}

async function ensureConfiguredSession() {
  if (!isFirebaseConfigured()) {
    throw new Error('Supabase has not been configured yet.');
  }

  let session;

  try {
    session = await ensureAnonymousSession();
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to start a secure partner session right now.');
  }

  if (!session?.user) {
    throw new Error('Supabase has not been configured yet.');
  }

  return session;
}

async function getPartnerShareRow(shareCode: string) {
  const session = await ensureConfiguredSession();
  const queryResult = await session.supabase
    .from(PARTNER_SHARE_TABLE)
    .select('*')
    .eq('share_code', normalizeShareCode(shareCode))
    .maybeSingle<PartnerShareRow>();

  if (queryResult.error) {
    throw queryResult.error;
  }

  return queryResult.data;
}

export async function createPartnerShare(ownerName: string) {
  const session = await ensureConfiguredSession();
  const nowIso = new Date().toISOString();

  for (let attempt = 0; attempt < CREATE_PARTNER_SHARE_ATTEMPTS; attempt += 1) {
    const shareCode = createShareCode();

    try {
      const insertResult = await session.supabase.from(PARTNER_SHARE_TABLE).insert({
        share_code: shareCode,
        owner_uid: session.user.id,
        partner_uid: null,
        owner_name: ownerName.trim() || 'Love',
        partner_name: '',
        sharing_enabled: true,
        location_sharing_enabled: false,
        owner_push_token: null,
        owner_push_alerts_enabled: false,
        owner_push_updated_at: null,
        partner_push_token: null,
        partner_push_alerts_enabled: false,
        partner_push_updated_at: null,
        latest_status: null,
        latest_partner_care_status: null,
        latest_check_in: null,
        latest_partner_nudge: null,
        latest_owner_nudge: null,
        latest_location: null,
        created_at: nowIso,
        updated_at: nowIso,
      } satisfies Partial<PartnerShareRow>);

      if (insertResult.error) {
        throw insertResult.error;
      }

      return shareCode;
    } catch (caughtError) {
      const errorCode = getPartnerErrorCode(caughtError).toLowerCase();

      if (errorCode === '23505' && attempt < CREATE_PARTNER_SHARE_ATTEMPTS - 1) {
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
  const updateResult = await session.supabase
    .from(PARTNER_SHARE_TABLE)
    .update({
      partner_uid: session.user.id,
      partner_name: partnerName.trim() || 'Kai',
      updated_at: new Date().toISOString(),
    }, { count: 'exact' })
    .eq('share_code', normalizedCode)
    .or(`partner_uid.is.null,partner_uid.eq.${session.user.id}`);

  if (updateResult.error) {
    throw createPartnerFriendlyError(updateResult.error, 'Unable to open partner view right now.');
  }

  if (!updateResult.count) {
    throw new Error('That share code is unavailable. Check the code and try again.');
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
  const updates: Record<string, unknown> = {
    owner_name: options.ownerName.trim() || 'Love',
    sharing_enabled: options.sharingEnabled,
    location_sharing_enabled: options.locationSharingEnabled,
    updated_at: new Date().toISOString(),
  };

  if (!options.locationSharingEnabled) {
    updates.latest_location = null;
  }

  const updateResult = await session.supabase
    .from(PARTNER_SHARE_TABLE)
    .update(updates)
    .eq('share_code', normalizeShareCode(options.shareCode));

  if (updateResult.error) {
    throw createPartnerFriendlyError(updateResult.error, 'Unable to update sharing right now.');
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

  try {
    const session = await ensureConfiguredSession();
    await session.supabase
      .from(PARTNER_SHARE_TABLE)
      .update({
        owner_name: options.ownerName.trim() || 'Love',
        sharing_enabled: options.sharingEnabled,
        latest_status: options.snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('share_code', normalizeShareCode(options.shareCode));
  } catch {
    // Best-effort background sync only.
  }
}

export async function syncPartnerWellnessStatus(options: {
  shareCode: string;
  snapshot: PartnerWellnessStatusSnapshot;
}) {
  if (!options.shareCode || !isFirebaseConfigured()) {
    return;
  }

  try {
    const session = await ensureConfiguredSession();
    await session.supabase
      .from(PARTNER_SHARE_TABLE)
      .update({
        latest_partner_care_status: options.snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('share_code', normalizeShareCode(options.shareCode));
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
  const nowIso = new Date().toISOString();
  const updateResult = await session.supabase
    .from(PARTNER_SHARE_TABLE)
    .update({
      latest_check_in: {
        message: trimmedMessage,
        createdAtIso: nowIso,
      } satisfies PartnerQuickCheckIn,
      updated_at: nowIso,
    })
    .eq('share_code', normalizeShareCode(shareCode));

  if (updateResult.error) {
    throw createPartnerFriendlyError(updateResult.error, 'Unable to send the check-in right now.');
  }
}

async function sendCareNudgeToField(
  shareCode: string,
  fieldName: 'latest_partner_nudge' | 'latest_owner_nudge',
  nudge: Pick<PartnerGentleNudge, 'type' | 'title' | 'message'>,
  fallbackMessage: string,
) {
  const normalizedCode = normalizeShareCode(shareCode);

  if (!normalizedCode) {
    throw new Error('Reconnect the partner code first.');
  }

  const session = await ensureConfiguredSession();
  const createdAtIso = new Date().toISOString();
  const updateResult = await session.supabase
    .from(PARTNER_SHARE_TABLE)
    .update({
      [fieldName]: {
        type: nudge.type,
        title: nudge.title.trim(),
        message: nudge.message.trim(),
        createdAtIso,
      } satisfies PartnerGentleNudge,
      updated_at: createdAtIso,
    })
    .eq('share_code', normalizedCode);

  if (updateResult.error) {
    throw createPartnerFriendlyError(updateResult.error, fallbackMessage);
  }
}

export async function sendPartnerCareNudge(
  shareCode: string,
  nudge: Pick<PartnerGentleNudge, 'type' | 'title' | 'message'>,
) {
  await sendCareNudgeToField(
    shareCode,
    'latest_partner_nudge',
    nudge,
    'Unable to send the gentle nudge right now.',
  );
}

export async function sendOwnerCareNudge(
  shareCode: string,
  nudge: Pick<PartnerGentleNudge, 'type' | 'title' | 'message'>,
) {
  await sendCareNudgeToField(
    shareCode,
    'latest_owner_nudge',
    nudge,
    'Unable to send the reminder right now.',
  );
}

export async function sharePartnerLocationCheckIn(
  shareCode: string,
  coordinates: Pick<PartnerLocationCheckIn, 'latitude' | 'longitude' | 'accuracy'>,
) {
  const session = await ensureConfiguredSession();
  const nowIso = new Date().toISOString();
  const updateResult = await session.supabase
    .from(PARTNER_SHARE_TABLE)
    .update({
      latest_location: {
        ...coordinates,
        sharedAtIso: nowIso,
      } satisfies PartnerLocationCheckIn,
      updated_at: nowIso,
    })
    .eq('share_code', normalizeShareCode(shareCode));

  if (updateResult.error) {
    throw createPartnerFriendlyError(updateResult.error, 'Unable to share the current location right now.');
  }
}

export async function getPartnerShare(shareCode: string) {
  try {
    const row = await getPartnerShareRow(shareCode);
    return mapPartnerShareRow(row);
  } catch (caughtError) {
    throw createPartnerFriendlyError(caughtError, 'Unable to load partner updates right now.');
  }
}

export async function updatePartnerPushSubscription(options: {
  shareCode: string;
  pushToken: string | null;
  alertsEnabled: boolean;
  role: 'owner' | 'partner';
}) {
  const normalizedCode = normalizeShareCode(options.shareCode);

  if (!normalizedCode) {
    return;
  }

  const session = await ensureConfiguredSession();
  const updates =
    options.role === 'owner'
      ? {
          owner_push_token: options.alertsEnabled ? options.pushToken : null,
          owner_push_alerts_enabled: options.alertsEnabled,
          owner_push_updated_at: new Date().toISOString(),
        }
      : {
          partner_push_token: options.alertsEnabled ? options.pushToken : null,
          partner_push_alerts_enabled: options.alertsEnabled,
          partner_push_updated_at: new Date().toISOString(),
        };

  const updateResult = await session.supabase.from(PARTNER_SHARE_TABLE).update(updates).eq('share_code', normalizedCode);

  if (updateResult.error) {
    throw createPartnerFriendlyError(updateResult.error, 'Unable to update partner alerts right now.');
  }
}

export async function subscribeToPartnerShare(
  shareCode: string,
  onValue: (value: PartnerShareDocument | null) => void,
  onError: (error: Error) => void,
) {
  const normalizedCode = normalizeShareCode(shareCode);
  const supabase = getSupabaseClient();

  if (!normalizedCode || !isFirebaseConfigured() || !supabase) {
    onValue(null);
    return () => {};
  }

  try {
    await ensureConfiguredSession();
  } catch (caughtError) {
    onError(createPartnerFriendlyError(caughtError, 'Unable to load partner updates.'));
    return () => {};
  }

  let lastSerializedValue = '';
  let realtimeChannel: RealtimeChannel | null = null;

  const emitValue = (row: PartnerShareRow | null) => {
    const nextValue = mapPartnerShareRow(row);
    const serializedValue = JSON.stringify(nextValue);

    if (serializedValue === lastSerializedValue) {
      return;
    }

    lastSerializedValue = serializedValue;
    onValue(nextValue);
  };

  const pollLatestValue = async () => {
    try {
      const row = await getPartnerShareRow(normalizedCode);
      emitValue(row);
    } catch (error) {
      onError(createPartnerFriendlyError(error, 'Unable to refresh partner updates.'));
    }
  };

  try {
    realtimeChannel = supabase
      .channel(`partner-share-${normalizedCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: PARTNER_SHARE_TABLE,
          filter: `share_code=eq.${normalizedCode}`,
        },
        () => {
          void pollLatestValue();
        },
      )
      .subscribe();
  } catch {
    realtimeChannel = null;
  }

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

  return () => {
    window.clearInterval(intervalId);

    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleVisibilityRefresh);
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    }

    if (realtimeChannel) {
      void supabase.removeChannel(realtimeChannel);
    }
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
