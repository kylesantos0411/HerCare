import React, { useState, useEffect } from 'react';
import {
  Moon,
  Droplet,
  Smile,
  Settings as SettingsIcon,
  User,
  Send,
  HeartHandshake,
  MapPinned,
  AlarmClock,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCurrentDayKey } from '../hooks/useCurrentDayKey';
import { getCurrentDeviceLocation } from '../utils/deviceLocation';
import { sendPartnerQuickCheckIn, sharePartnerLocationCheckIn } from '../utils/partner';
import {
  formatDuration,
  formatTargetHours,
  getLatestSleepLog,
  isSleepBelowTarget,
  type SleepLogEntry,
} from '../utils/sleep';
import {
  formatStudyCountdown,
  getStudyPresetDescription,
  getStudyPresetLabel,
  getStudyProgress,
  isStudyPresetMinutes,
  studyPresetOptions,
  type StudyTimerState,
} from '../utils/study';
import {
  getCurrentHydrationCount,
  getLatestMoodEntry,
  getTodayHydrationEntries,
  moodLabels,
  type HydrationEntry,
  type MoodEntry,
  type MoodState,
} from '../utils/wellness';
import {
  formatShiftDateLabel,
  formatShiftTimeRange,
  getNextShift,
  getShiftStatus,
  type ShiftEntry,
} from '../utils/shift';
import './Home.css';

interface HomeProps {
  onNavigate: (view: string) => void;
  studyTimer: StudyTimerState;
}

const QUICK_CHECK_IN_PRESETS = [
  "I'm okay",
  "I'm tired",
  'Still on shift',
  'Going home now',
] as const;

function getTimeBasedGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning, baby. Kumain ka na?';
  }

  if (hour >= 20 || hour < 5) {
    return 'Rest ka na, love.';
  }

  return 'Ready for your shift?';
}

function getInsightMessage(
  glasses: number,
  currentMood: MoodState,
  latestMoodEntry: MoodEntry | null,
  latestSleepLog: SleepLogEntry | null,
  sleepTargetHours: number,
) {
  if (glasses < 4) {
    return 'Insight: You were a bit behind on water yesterday. Try to grab a sip before 2 AM!';
  }

  if (
    latestSleepLog &&
    (isSleepBelowTarget(latestSleepLog, sleepTargetHours) || latestSleepLog.quality === 'poor')
  ) {
    return 'Insight: Your latest sleep log came in a little short. Protect a slower reset after shift if you can.';
  }

  if (latestMoodEntry && latestMoodEntry.stressLevel >= 4) {
    return 'Insight: Your latest mood check showed high stress. Try to claim one quiet reset moment during shift.';
  }

  if (latestMoodEntry && latestMoodEntry.energyLevel <= 2) {
    return 'Insight: Your energy looked low in the last check-in. A snack, water, and a short pause could help.';
  }

  if (currentMood === 'tired') {
    return 'Insight: You logged feeling tired recently. Be gentle with yourself tonight.';
  }

  return "Insight: You're on a great streak! Keep up the amazing work tonight.";
}

function formatFocusStatus(studyTimer: StudyTimerState) {
  const countdownLabel = formatStudyCountdown(studyTimer.remainingSeconds);

  if (studyTimer.status === 'running') {
    return `${countdownLabel} left`;
  }

  if (studyTimer.status === 'paused') {
    return `${countdownLabel} paused`;
  }

  if (studyTimer.status === 'completed') {
    return 'Session complete';
  }

  return `${getStudyPresetLabel(studyTimer.selectedMinutes)} reset ready`;
}

function getFocusHelperCopy(studyTimer: StudyTimerState) {
  if (studyTimer.status === 'running') {
    return 'SUPER GALING BABY, GO GO GO!';
  }

  if (studyTimer.status === 'paused') {
    return 'Okay lang mag-pause. Balik ka lang when ready ka ulit.';
  }

  if (studyTimer.status === 'completed') {
    return 'Good job, baby. Enough na yan for today.';
  }

  if (!isStudyPresetMinutes(studyTimer.selectedMinutes)) {
    return 'Custom focus window ready for today.';
  }

  return `${getStudyPresetDescription(studyTimer.selectedMinutes)} for duty breaks, low energy, or rest days.`;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, studyTimer }) => {
  const { referenceDate } = useCurrentDayKey();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [name] = useLocalStorage('hercare_user_name', 'Sarah');
  const [partnerShareCode] = useLocalStorage('hercare_partner_share_code', '');
  const [partnerSharingEnabled] = useLocalStorage('hercare_partner_sharing_enabled', false);
  const [partnerLocationEnabled] = useLocalStorage('hercare_partner_location_enabled', false);
  const [waterGoal] = useLocalStorage('hercare_water_target', 8);
  const [storedGlasses] = useLocalStorage('hercare_hydration_count', 0);
  const [hydrationHistory] = useLocalStorage<HydrationEntry[]>('hercare_hydration_history', []);
  const [currentMood] = useLocalStorage<MoodState>('hercare_mood', 'good');
  const [moodEntries] = useLocalStorage<MoodEntry[]>('hercare_mood_entries', []);
  const [sleepLogs] = useLocalStorage<SleepLogEntry[]>('hercare_sleep_logs', []);
  const [sleepTargetHours] = useLocalStorage('hercare_sleep_target_hours', 7.5);
  const [scheduledShifts] = useLocalStorage<ShiftEntry[]>('hercare_scheduled_shifts', []);
  const [quickCheckInMessage, setQuickCheckInMessage] = useState('');
  const [quickCheckInStatus, setQuickCheckInStatus] = useState('');
  const [quickCheckInError, setQuickCheckInError] = useState('');
  const [busyAction, setBusyAction] = useState<'checkin' | 'location' | null>(null);

  const latestMoodEntry = getLatestMoodEntry(moodEntries);
  const latestSleepLog = getLatestSleepLog(sleepLogs);
  const nextShift = getNextShift(scheduledShifts);
  const nextShiftStatus = nextShift ? getShiftStatus(nextShift) : null;
  const displayedMood = latestMoodEntry?.mood ?? currentMood;
  const glasses = getCurrentHydrationCount(hydrationHistory, storedGlasses, referenceDate);
  const todayHydrationEntries = getTodayHydrationEntries(hydrationHistory, referenceDate);
  const hydrationContext =
    todayHydrationEntries.length > 0
      ? `Latest ${todayHydrationEntries[0].timeLabel}`
      : 'No water logged today yet';
  const hydrationLabel = waterGoal === 1 ? 'glass' : 'glasses';
  const sleepSummary = latestSleepLog
    ? formatDuration(latestSleepLog.durationMinutes)
    : `Goal ${formatTargetHours(sleepTargetHours)}`;
  const timeBasedGreeting = getTimeBasedGreeting(currentTime);
  const insightMessage = getInsightMessage(
    glasses,
    currentMood,
    latestMoodEntry,
    latestSleepLog,
    sleepTargetHours,
  );
  const focusProgress = studyTimer.status === 'completed' ? 100 : getStudyProgress(studyTimer) * 100;
  const focusActionLabel = studyTimer.status === 'running' ? 'Return to Timer' : 'Open Study';

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const handleSendQuickCheckIn = async (messageOverride?: string) => {
    const messageToSend = (messageOverride ?? quickCheckInMessage).trim();

    if (!partnerShareCode || !partnerSharingEnabled) {
      setQuickCheckInError('Turn on Partner Sharing first in Settings.');
      setQuickCheckInStatus('');
      return;
    }

    if (!messageToSend) {
      setQuickCheckInError('Write a little message first or tap a preset.');
      setQuickCheckInStatus('');
      return;
    }

    setQuickCheckInError('');
    setQuickCheckInStatus('');
    setBusyAction('checkin');

    try {
      await sendPartnerQuickCheckIn(partnerShareCode, messageToSend);
      setQuickCheckInMessage('');
      setQuickCheckInStatus('Check-in sent.');
    } catch (caughtError) {
      setQuickCheckInError(
        caughtError instanceof Error ? caughtError.message : 'Unable to send the check-in right now.',
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleSharePartnerLocation = async () => {
    if (!partnerShareCode || !partnerSharingEnabled) {
      setQuickCheckInError('Turn on Partner Sharing first in Settings.');
      setQuickCheckInStatus('');
      return;
    }

    if (!partnerLocationEnabled) {
      setQuickCheckInError('Turn on location check-ins first in Partner Sharing.');
      setQuickCheckInStatus('');
      return;
    }

    setQuickCheckInError('');
    setQuickCheckInStatus('');
    setBusyAction('location');

    try {
      const position = await getCurrentDeviceLocation();

      await sharePartnerLocationCheckIn(partnerShareCode, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      setQuickCheckInStatus('Location shared.');
    } catch (caughtError) {
      setQuickCheckInError(
        caughtError instanceof Error ? caughtError.message : 'Unable to share your current location right now.',
      );
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="greeting">
          <h1>Hi, {name || 'Love'}!</h1>
          <p className="subtitle">{timeBasedGreeting}</p>
        </div>
        <div className="header-actions">
          <button className="settings-btn-icon" onClick={() => onNavigate('settings')}>
            <SettingsIcon size={24} />
          </button>
          <div className="profile-pic">
            <User size={24} color="var(--color-primary)" />
          </div>
        </div>
      </header>

      <section className="shift-section">
        <Card variant="primary" className="shift-card">
          <div className="shift-header">
            <Moon className="shift-icon" />
            <h2>{nextShift ? nextShift.type : 'Shift Planning'}</h2>
            {nextShiftStatus && <span className="shift-status-chip">{nextShiftStatus}</span>}
          </div>
          <p className="shift-time">
            {nextShift ? formatShiftTimeRange(nextShift.startTime, nextShift.endTime) : 'No shift scheduled yet'}
          </p>
          <p className="shift-meta">
            {nextShift
              ? formatShiftDateLabel(nextShift.date)
              : 'Add your next shift to keep the dashboard grounded.'}
          </p>
          <div className="shift-actions">
            <Button variant="secondary" fullWidth onClick={() => onNavigate('shift')}>
              {nextShift ? 'View Shift' : 'Plan Shift'}
            </Button>
          </div>
        </Card>
      </section>

      <div className="wellness-snapshot">
        <h3>Today's Wellness</h3>
        <div className="snapshot-cards">
          <Card variant="secondary" className="snapshot-card">
            <Droplet size={20} />
            <span>Hydration</span>
            <strong>
              {glasses} / {waterGoal} {hydrationLabel}
            </strong>
            <small>{hydrationContext}</small>
          </Card>

          <Card variant="accent" className="snapshot-card">
            <Smile size={20} />
            <span>Mood</span>
            <strong>{moodLabels[displayedMood]}</strong>
          </Card>

          <Card className="snapshot-card">
            <Moon size={20} color="var(--color-primary)" />
            <span>Sleep</span>
            <strong>{sleepSummary}</strong>
          </Card>
        </div>
      </div>

      <div className="insight-section">
        <Card className="insight-card">
          <p className="insight-kicker">Smart insight</p>
          <p className="insight-message">{insightMessage}</p>
          <p className="insight-context">Based on your latest wellness check-in.</p>
        </Card>
      </div>

      <section className="partner-quick-section">
        <Card className="partner-quick-card">
          <div className="partner-quick-header">
            <div className="partner-quick-copy">
              <HeartHandshake size={18} />
              <div>
                <h3>Quick Partner Check-In</h3>
                {!partnerSharingEnabled || !partnerShareCode ? (
                  <p>Turn on Partner Sharing in Settings first.</p>
                ) : null}
              </div>
            </div>
            <button className="partner-quick-settings-link" onClick={() => onNavigate('settings')}>
              Open
            </button>
          </div>

          <div className="partner-quick-presets">
            {QUICK_CHECK_IN_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="partner-quick-preset-btn"
                onClick={() => void handleSendQuickCheckIn(preset)}
                disabled={!partnerShareCode || !partnerSharingEnabled || busyAction !== null}
              >
                {preset}
              </button>
            ))}
          </div>

          <textarea
            className="partner-quick-textarea"
            value={quickCheckInMessage}
            onChange={(event) => setQuickCheckInMessage(event.target.value)}
            placeholder="Baby, medyo pagod but okay pa naman."
            rows={3}
          />

          <div className="partner-quick-actions">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => void handleSendQuickCheckIn()}
              disabled={!partnerShareCode || !partnerSharingEnabled || busyAction !== null}
            >
              <Send size={16} />
              {busyAction === 'checkin' ? 'Sending...' : 'Send Check-In'}
            </Button>

            <Button
              variant="outline"
              fullWidth
              onClick={() => void handleSharePartnerLocation()}
              disabled={!partnerShareCode || !partnerSharingEnabled || busyAction !== null}
            >
              <MapPinned size={16} />
              {busyAction === 'location' ? 'Sharing...' : 'Share Location'}
            </Button>
          </div>

          {(quickCheckInStatus || quickCheckInError) && (
            <p className={`partner-quick-feedback ${quickCheckInError ? 'error' : 'success'}`}>
              {quickCheckInError || quickCheckInStatus}
            </p>
          )}
        </Card>
      </section>

      <section className="quick-focus-section">
        <Card className={`quick-focus-card status-${studyTimer.status}`}>
          <div className="quick-focus-header">
            <div className="quick-focus-copy">
              <div className="quick-focus-title-row">
                <AlarmClock size={18} />
                <p className="quick-focus-kicker">Quick Focus</p>
              </div>
              <h3>Flexible Pomodoro</h3>
              <p className="quick-focus-description">Kahit few minutes lang, count pa rin, baby. Small study wins still matter.</p>
            </div>

            <div className="quick-focus-badge">{getStudyPresetLabel(studyTimer.selectedMinutes)}</div>
          </div>

          <div className="quick-focus-progress">
            <div className="quick-focus-progress-bar">
              <div className="quick-focus-progress-fill" style={{ width: `${focusProgress}%` }}></div>
            </div>

            <div className="quick-focus-progress-copy">
              <strong>{formatFocusStatus(studyTimer)}</strong>
              <span>{getFocusHelperCopy(studyTimer)}</span>
            </div>
          </div>

          <div className="quick-focus-presets">
            {studyPresetOptions.map((preset) => (
              <span key={preset.minutes}>{preset.label}</span>
            ))}
            {!isStudyPresetMinutes(studyTimer.selectedMinutes) && (
              <span>{getStudyPresetLabel(studyTimer.selectedMinutes)}</span>
            )}
          </div>

          <Button variant="secondary" fullWidth onClick={() => onNavigate('study')}>
            {focusActionLabel}
          </Button>
        </Card>
      </section>
    </div>
  );
};
