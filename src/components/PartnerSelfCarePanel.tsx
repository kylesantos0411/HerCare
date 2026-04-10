import React, { useEffect, useState } from 'react';
import {
  Apple,
  Check,
  Clock,
  Coffee,
  Droplet,
  Moon,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { useCurrentDayKey } from '../hooks/useCurrentDayKey';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  createQuickMealEntry,
  getMealProgress,
  getTodayMealEntries,
  mealTypeOptions,
  type MealEntry,
  type MealType,
} from '../utils/meals';
import {
  buildPartnerWellnessSnapshot,
  formatPartnerTimestamp,
  syncPartnerWellnessStatus,
} from '../utils/partner';
import {
  calculateSleepDuration,
  formatDuration,
  formatTargetHours,
  getLatestSleepLog,
  sleepQualityLabels,
  type SleepLogEntry,
  type SleepQuality,
} from '../utils/sleep';
import {
  formatHydrationAmount,
  getCurrentHydrationCount,
  getTodayHydrationEntries,
  type HydrationEntry,
} from '../utils/wellness';
import './PartnerSelfCarePanel.css';

interface PartnerSelfCarePanelProps {
  shareCode: string;
  ownerName: string;
  isConnected: boolean;
}

const intakeOptions = [1, 2, 3];
const mealIcons: Record<MealType, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: UtensilsCrossed,
  Dinner: UtensilsCrossed,
  Snack: Apple,
};
const qualityOptions: Array<{ value: SleepQuality; caption: string }> = [
  { value: 'poor', caption: 'Restless' },
  { value: 'fair', caption: 'Okay-ish' },
  { value: 'good', caption: 'Steady' },
  { value: 'great', caption: 'Deep rest' },
];

export const PartnerSelfCarePanel: React.FC<PartnerSelfCarePanelProps> = ({
  shareCode,
  ownerName,
  isConnected,
}) => {
  const { dayKey, referenceDate } = useCurrentDayKey();
  const [waterGoal] = useLocalStorage('hercare_partner_self_water_target', 8);
  const [storedGlasses, setStoredGlasses] = useLocalStorage('hercare_partner_self_hydration_count', 0);
  const [hydrationHistory, setHydrationHistory] = useLocalStorage<HydrationEntry[]>(
    'hercare_partner_self_hydration_history',
    [],
  );
  const [mealEntries, setMealEntries] = useLocalStorage<MealEntry[]>('hercare_partner_self_meal_entries', []);
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLogEntry[]>('hercare_partner_self_sleep_logs', []);
  const [sleepTargetHours] = useLocalStorage('hercare_partner_self_sleep_target_hours', 7.5);
  const [sleepSavedMessage, setSleepSavedMessage] = useState('');

  const latestSleepLog = getLatestSleepLog(sleepLogs);
  const [startTime, setStartTime] = useState(latestSleepLog?.startTime ?? '23:00');
  const [endTime, setEndTime] = useState(latestSleepLog?.endTime ?? '06:30');
  const [quality, setQuality] = useState<SleepQuality>(latestSleepLog?.quality ?? 'good');

  const todayHydrationEntries = getTodayHydrationEntries(hydrationHistory, referenceDate);
  const hydrationCount = getCurrentHydrationCount(hydrationHistory, storedGlasses, referenceDate);
  const hydrationProgress = Math.min((hydrationCount / waterGoal) * 100, 100);
  const todayMeals = getTodayMealEntries(mealEntries, referenceDate);
  const mealProgress = getMealProgress(mealEntries, referenceDate);
  const durationMinutes = calculateSleepDuration(startTime, endTime);

  useEffect(() => {
    setStartTime(latestSleepLog?.startTime ?? '23:00');
    setEndTime(latestSleepLog?.endTime ?? '06:30');
    setQuality(latestSleepLog?.quality ?? 'good');
  }, [latestSleepLog?.id, latestSleepLog?.endTime, latestSleepLog?.quality, latestSleepLog?.startTime]);

  useEffect(() => {
    if (!shareCode) {
      return;
    }

    const snapshot = buildPartnerWellnessSnapshot({
      dayKey,
      referenceDate,
      waterGoal,
      hydrationEntries: hydrationHistory,
      legacyHydrationCount: storedGlasses,
      sleepLogs,
      sleepTargetHours,
      mealEntries,
    });

    void syncPartnerWellnessStatus({
      shareCode,
      snapshot,
    });
  }, [
    dayKey,
    hydrationHistory,
    mealEntries,
    referenceDate,
    shareCode,
    sleepLogs,
    sleepTargetHours,
    storedGlasses,
    waterGoal,
  ]);

  const handleAddHydration = (amount: number) => {
    const now = new Date();
    const entry: HydrationEntry = {
      id: `${now.getTime()}-${amount}`,
      amount,
      loggedAt: now.toISOString(),
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHydrationHistory((currentHistory) => [entry, ...currentHistory]);
    setStoredGlasses((currentValue) => currentValue + amount);
  };

  const handleQuickMeal = (mealType: MealType) => {
    setMealEntries((currentEntries) => [createQuickMealEntry(mealType), ...currentEntries]);
  };

  const handleSaveSleep = () => {
    if (durationMinutes <= 0) {
      return;
    }

    const now = new Date();
    const newSleepLog: SleepLogEntry = {
      id: `${now.getTime()}`,
      startTime,
      endTime,
      quality,
      notes: '',
      durationMinutes,
      loggedAt: now.toISOString(),
      dateLabel: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    setSleepLogs((currentLogs) => [newSleepLog, ...currentLogs]);
    setSleepSavedMessage(`Saved ${formatDuration(durationMinutes)} of rest.`);
  };

  return (
    <div className="partner-selfcare-panel">
      <Card className="partner-selfcare-hero" variant="secondary">
        <p className="partner-selfcare-kicker">My care log</p>
        <h3>Track your own water, meals, and sleep here too.</h3>
        <p>
          {isConnected
            ? `${ownerName || 'The main app'} can now see this summary and send you a gentle reminder when needed.`
            : 'Your entries stay here first, then sync to the main app once this phone is connected.'}
        </p>
      </Card>

      <div className="partner-selfcare-summary-grid">
        <Card className="partner-selfcare-summary-card">
          <Droplet size={18} />
          <span>Water</span>
          <strong>
            {hydrationCount} / {waterGoal}
          </strong>
          <small>
            {todayHydrationEntries[0]
              ? `Last glass ${todayHydrationEntries[0].timeLabel}`
              : 'No water logged today yet'}
          </small>
        </Card>

        <Card className="partner-selfcare-summary-card">
          <UtensilsCrossed size={18} />
          <span>Meals</span>
          <strong>
            {mealProgress.completedCount} / {mealProgress.goalCount}
          </strong>
          <small>{todayMeals.length > 0 ? `${todayMeals.length} food check-ins today` : 'No meals logged today yet'}</small>
        </Card>

        <Card className="partner-selfcare-summary-card">
          <Moon size={18} />
          <span>Sleep</span>
          <strong>{latestSleepLog ? formatDuration(latestSleepLog.durationMinutes) : 'No log'}</strong>
          <small>
            {latestSleepLog
              ? `${sleepQualityLabels[latestSleepLog.quality]} • ${formatPartnerTimestamp(latestSleepLog.loggedAt)}`
              : `Target ${formatTargetHours(sleepTargetHours)}`}
          </small>
        </Card>
      </div>

      <Card className="partner-selfcare-card partner-selfcare-hydration-card">
        <div className="partner-selfcare-card-header">
          <div>
            <p className="partner-selfcare-kicker">Hydration</p>
            <h3>{hydrationCount} glasses today</h3>
          </div>
          <div className="partner-selfcare-badge">Goal {waterGoal}</div>
        </div>

        <div className="partner-selfcare-progress-bar">
          <div className="partner-selfcare-progress-fill" style={{ width: `${hydrationProgress}%` }}></div>
        </div>

        <div className="partner-selfcare-action-grid">
          {intakeOptions.map((amount) => (
            <button
              key={amount}
              type="button"
              className="partner-selfcare-action-btn"
              onClick={() => handleAddHydration(amount)}
            >
              <Droplet size={16} />
              <strong>+{amount}</strong>
              <span>{formatHydrationAmount(amount)}</span>
            </button>
          ))}
        </div>

        <div className="partner-selfcare-history-list">
          {todayHydrationEntries.slice(0, 4).map((entry) => (
            <div key={entry.id} className="partner-selfcare-history-item">
              <span>{formatHydrationAmount(entry.amount)}</span>
              <strong>{entry.timeLabel}</strong>
            </div>
          ))}
          {todayHydrationEntries.length === 0 && <p className="partner-selfcare-empty">No water entries yet today.</p>}
        </div>
      </Card>

      <Card className="partner-selfcare-card partner-selfcare-meals-card">
        <div className="partner-selfcare-card-header">
          <div>
            <p className="partner-selfcare-kicker">Meals</p>
            <h3>Quick food check-ins</h3>
          </div>
          <div className="partner-selfcare-badge">{todayMeals.length} today</div>
        </div>

        <div className="partner-selfcare-action-grid meal-grid">
          {mealTypeOptions.map((mealType) => {
            const Icon = mealIcons[mealType];

            return (
              <button
                key={mealType}
                type="button"
                className="partner-selfcare-action-btn"
                onClick={() => handleQuickMeal(mealType)}
              >
                <Icon size={16} />
                <strong>{mealType}</strong>
                <span>Quick save</span>
              </button>
            );
          })}
        </div>

        <div className="partner-selfcare-pill-row">
          {mealTypeOptions.map((mealType) => (
            <span
              key={mealType}
              className={`partner-selfcare-pill ${mealProgress.completedTypes.includes(mealType) ? 'complete' : ''}`}
            >
              {mealType}
            </span>
          ))}
        </div>

        <div className="partner-selfcare-history-list">
          {todayMeals.slice(0, 4).map((meal) => (
            <div key={meal.id} className="partner-selfcare-history-item">
              <span>{meal.type}</span>
              <strong>{meal.food}</strong>
            </div>
          ))}
          {todayMeals.length === 0 && <p className="partner-selfcare-empty">No meals saved for today yet.</p>}
        </div>
      </Card>

      <Card className="partner-selfcare-card partner-selfcare-sleep-card">
        <div className="partner-selfcare-card-header">
          <div>
            <p className="partner-selfcare-kicker">Sleep</p>
            <h3>{durationMinutes > 0 ? formatDuration(durationMinutes) : 'Set your rest window'}</h3>
          </div>
          <div className="partner-selfcare-badge">Target {formatTargetHours(sleepTargetHours)}</div>
        </div>

        <div className="partner-selfcare-time-grid">
          <label className="partner-selfcare-input">
            <span>Sleep start</span>
            <div>
              <Moon size={16} />
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
          </label>

          <label className="partner-selfcare-input">
            <span>Wake time</span>
            <div>
              <Clock size={16} />
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
          </label>
        </div>

        <div className="partner-selfcare-quality-grid">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`partner-selfcare-quality-btn ${quality === option.value ? 'active' : ''}`}
              onClick={() => setQuality(option.value)}
            >
              <strong>{sleepQualityLabels[option.value]}</strong>
              <span>{option.caption}</span>
            </button>
          ))}
        </div>

        <div className="partner-selfcare-save-row">
          <Button fullWidth onClick={handleSaveSleep} disabled={durationMinutes <= 0}>
            <Check size={16} />
            Save Sleep
          </Button>
        </div>

        {sleepSavedMessage && (
          <p className="partner-selfcare-save-note">
            <Sparkles size={14} />
            {sleepSavedMessage}
          </p>
        )}
      </Card>
    </div>
  );
};
