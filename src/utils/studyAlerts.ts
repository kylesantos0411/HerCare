import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { APP_VARIANT_CONFIG } from '../config/appVariant';
import type { StudyTimerState } from './study';

const STUDY_ALERT_CHANNEL_ID = 'hercare-study-alerts-soft-v1';
const STUDY_ALERT_ID = 4100;
const STUDY_ALERT_SOUND = 'study_bell_soft.wav';

let studyAudioContext: AudioContext | null = null;

function getStudyCompletionAlertBody() {
  return APP_VARIANT_CONFIG.features.personalTone
    ? 'Good job, baby. Enough na yan for today. Water muna or short break ka lang.'
    : 'Nice work. Your focus block is complete. Take a short water or stretch break.';
}

function isLocalNotificationsAvailable() {
  return Capacitor.getPlatform() !== 'web';
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

async function ensureStudyAlertChannel() {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }

  await LocalNotifications.createChannel({
    id: STUDY_ALERT_CHANNEL_ID,
    name: 'Study timer',
    description: 'Focus timer completion reminders from HerCare.',
    importance: 4,
    visibility: 1,
    sound: STUDY_ALERT_SOUND,
    vibration: true,
    lights: true,
    lightColor: '#D7A2B8',
  });
}

function getAudioContext() {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return null;
  }

  if (!studyAudioContext) {
    studyAudioContext = new window.AudioContext();
  }

  return studyAudioContext;
}

async function playStudyCompletionTone() {
  const audioContext = getAudioContext();

  if (!audioContext) {
    return;
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  if (audioContext.state !== 'running') {
    return;
  }

  const now = audioContext.currentTime;
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

  [
    { frequency: 660, startOffset: 0, duration: 0.18 },
    { frequency: 880, startOffset: 0.22, duration: 0.18 },
    { frequency: 988, startOffset: 0.44, duration: 0.22 },
  ].forEach((tone) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(tone.frequency, now + tone.startOffset);
    gainNode.gain.setValueAtTime(0.0001, now + tone.startOffset);
    gainNode.gain.exponentialRampToValueAtTime(0.35, now + tone.startOffset + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + tone.startOffset + tone.duration);
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start(now + tone.startOffset);
    oscillator.stop(now + tone.startOffset + tone.duration);
  });
}

export async function prepareStudySessionAlerts(notificationsEnabled: boolean) {
  try {
    const audioContext = getAudioContext();

    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  } catch {
    // Audio warmup is best-effort only.
  }

  if (!notificationsEnabled || !isLocalNotificationsAvailable()) {
    return;
  }

  const granted = await ensureNotificationAccess();

  if (!granted) {
    return;
  }

  await ensureStudyAlertChannel();
}

export async function clearStudyCompletionNotification() {
  if (!isLocalNotificationsAvailable()) {
    return;
  }

  await LocalNotifications.cancel({
    notifications: [{ id: STUDY_ALERT_ID }],
  });

  const delivered = await LocalNotifications.getDeliveredNotifications();
  const matchedDelivered = delivered.notifications.filter((notification) => notification.id === STUDY_ALERT_ID);

  if (matchedDelivered.length > 0) {
    await LocalNotifications.removeDeliveredNotifications({
      notifications: matchedDelivered,
    });
  }
}

interface SyncStudyCompletionAlertOptions {
  notificationsEnabled: boolean;
  timer: StudyTimerState;
  isDocumentVisible: boolean;
}

export async function syncStudyCompletionAlert({
  notificationsEnabled,
  timer,
  isDocumentVisible,
}: SyncStudyCompletionAlertOptions) {
  if (!isLocalNotificationsAvailable()) {
    return;
  }

  if (!notificationsEnabled || timer.status !== 'running' || !timer.endsAt || isDocumentVisible) {
    await clearStudyCompletionNotification();
    return;
  }

  const endTime = new Date(timer.endsAt);

  if (Number.isNaN(endTime.getTime()) || endTime.getTime() <= Date.now()) {
    await clearStudyCompletionNotification();
    return;
  }

  const granted = await ensureNotificationAccess();

  if (!granted) {
    return;
  }

  await ensureStudyAlertChannel();
  await clearStudyCompletionNotification();

  await LocalNotifications.schedule({
    notifications: [
      {
        id: STUDY_ALERT_ID,
        title: 'Focus Time complete',
        body: getStudyCompletionAlertBody(),
        schedule: {
          at: endTime,
          allowWhileIdle: true,
        },
        channelId: STUDY_ALERT_CHANNEL_ID,
        sound: STUDY_ALERT_SOUND,
        autoCancel: true,
      },
    ],
  });
}

export async function triggerStudyCompletionFeedback(notificationsEnabled: boolean) {
  if (!notificationsEnabled || typeof window === 'undefined') {
    return;
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([180, 120, 180]);
  }

  try {
    await playStudyCompletionTone();
  } catch {
    // Audio playback is best-effort only.
  }
}
