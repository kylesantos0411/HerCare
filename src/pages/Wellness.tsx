import React from 'react';
import { Droplet, Moon, Smile } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCurrentDayKey } from '../hooks/useCurrentDayKey';
import {
  formatDuration,
  formatTargetHours,
  getLatestSleepLog,
  sleepQualityLabels,
  type SleepLogEntry,
} from '../utils/sleep';
import {
  formatHydrationAmount,
  getCurrentHydrationCount,
  getLatestHydrationEntry,
  getLatestMoodEntry,
  moodLabels,
  type HydrationEntry,
  type MoodEntry,
  type MoodState,
} from '../utils/wellness';
import './Wellness.css';

interface WellnessProps {
  onNavigate: (view: string) => void;
}

export const Wellness: React.FC<WellnessProps> = ({ onNavigate }) => {
  const { referenceDate } = useCurrentDayKey();
  const [waterGoal] = useLocalStorage('hercare_water_target', 8);
  const [sleepTargetHours] = useLocalStorage('hercare_sleep_target_hours', 7.5);
  const [storedGlasses] = useLocalStorage('hercare_hydration_count', 0);
  const [hydrationHistory] = useLocalStorage<HydrationEntry[]>('hercare_hydration_history', []);
  const [hydrationRemindersEnabled] = useLocalStorage('hercare_hydration_reminders_enabled', true);
  const [currentMood] = useLocalStorage<MoodState>('hercare_mood', 'good');
  const [moodEntries] = useLocalStorage<MoodEntry[]>('hercare_mood_entries', []);
  const [sleepLogs] = useLocalStorage<SleepLogEntry[]>('hercare_sleep_logs', []);

  const latestSleepLog = getLatestSleepLog(sleepLogs);
  const latestMoodEntry = getLatestMoodEntry(moodEntries);
  const latestHydrationEntry = getLatestHydrationEntry(hydrationHistory);
  const glasses = getCurrentHydrationCount(hydrationHistory, storedGlasses, referenceDate);
  const hydrationProgress = Math.min((glasses / waterGoal) * 100, 100);
  const displayedMood = latestMoodEntry?.mood ?? currentMood;
  const sleepDurationLabel = latestSleepLog ? formatDuration(latestSleepLog.durationMinutes) : 'No log yet';
  const sleepMeta = latestSleepLog
    ? `Quality: ${sleepQualityLabels[latestSleepLog.quality]}`
    : `Target: ${formatTargetHours(sleepTargetHours)}`;

  return (
    <div className="wellness-container">
      <header className="page-header">
        <h1>Wellness</h1>
        <p className="subtitle">Take care of yourself, too.</p>
      </header>

      <section className="tracker-list">
        <Card className="tracker-card">
          <div className="tracker-header">
            <div className="tracker-title">
              <Droplet className="tracker-icon" size={24} color="var(--color-primary)" />
              <h2>Hydration</h2>
            </div>
          </div>
          <div className="tracker-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${hydrationProgress}%` }}></div>
            </div>
            <span>
              {glasses} of {waterGoal} glasses
            </span>
          </div>
          <div className="tracker-stats">
            <p>
              Latest:{' '}
              <strong>
                {latestHydrationEntry
                  ? `${formatHydrationAmount(latestHydrationEntry.amount)} at ${latestHydrationEntry.timeLabel}`
                  : 'No intake history yet'}
              </strong>
            </p>
            <p className="text-muted">
              Reminders {hydrationRemindersEnabled ? 'on for long shifts' : 'currently paused'}
            </p>
          </div>
          <Button variant="secondary" fullWidth className="log-btn" onClick={() => onNavigate('hydration_screen')}>
            Open Hydration
          </Button>
        </Card>

        <Card className="tracker-card">
          <div className="tracker-header">
            <div className="tracker-title">
              <Moon className="tracker-icon" size={24} color="var(--color-secondary)" />
              <h2>Sleep</h2>
            </div>
          </div>
          <div className="tracker-stats">
            <p>
              Last night: <strong>{sleepDurationLabel}</strong>
            </p>
            <p className="text-muted">{sleepMeta}</p>
            {latestSleepLog && <p className="tracker-date">Logged {latestSleepLog.dateLabel}</p>}
          </div>
          <Button variant="outline" fullWidth className="log-btn" onClick={() => onNavigate('sleep_log')}>
            Log Sleep
          </Button>
        </Card>

        <Card className="tracker-card">
          <div className="tracker-header">
            <div className="tracker-title">
              <Smile className="tracker-icon" size={24} color="var(--color-accent)" />
              <h2>Mood Check</h2>
            </div>
          </div>
          <div className="tracker-stats">
            <p>
              Last check-in: <strong>{moodLabels[displayedMood]}</strong>
            </p>
            <p className="text-muted">
              {latestMoodEntry
                ? `Energy ${latestMoodEntry.energyLevel}/5 | Stress ${latestMoodEntry.stressLevel}/5`
                : 'No detailed mood check yet'}
            </p>
            {latestMoodEntry?.notes && <p className="tracker-note">"{latestMoodEntry.notes}"</p>}
          </div>
          <Button variant="secondary" fullWidth className="log-btn" onClick={() => onNavigate('mood_check')}>
            Open Mood Check
          </Button>
        </Card>
      </section>
    </div>
  );
};
