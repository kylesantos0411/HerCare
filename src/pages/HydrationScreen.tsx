import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, Droplet, History, Bell } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useCurrentDayKey } from '../hooks/useCurrentDayKey';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  formatHydrationAmount,
  getCurrentHydrationCount,
  getTodayHydrationEntries,
  type HydrationEntry,
} from '../utils/wellness';
import './HydrationScreen.css';

interface HydrationScreenProps {
  onBack: () => void;
  onSave: () => void;
}

const intakeOptions = [1, 2, 3];

export const HydrationScreen: React.FC<HydrationScreenProps> = ({ onBack, onSave }) => {
  const { referenceDate } = useCurrentDayKey();
  const [storedGlasses, setStoredGlasses] = useLocalStorage('hercare_hydration_count', 0);
  const [waterGoal] = useLocalStorage('hercare_water_target', 8);
  const [storedHistory, setStoredHistory] = useLocalStorage<HydrationEntry[]>('hercare_hydration_history', []);
  const [storedReminders, setStoredReminders] = useLocalStorage('hercare_hydration_reminders_enabled', true);

  const [draftHistory, setDraftHistory] = useState(storedHistory);
  const [draftReminders, setDraftReminders] = useState(storedReminders);
  const draftGlasses = useMemo(
    () => getCurrentHydrationCount(draftHistory, storedGlasses, referenceDate),
    [draftHistory, referenceDate, storedGlasses],
  );
  const todayHistory = useMemo(() => getTodayHydrationEntries(draftHistory, referenceDate), [draftHistory, referenceDate]);

  const progress = useMemo(() => Math.min((draftGlasses / waterGoal) * 100, 100), [draftGlasses, waterGoal]);

  const addIntake = (amount: number) => {
    const now = new Date();
    const entry: HydrationEntry = {
      id: `${now.getTime()}-${amount}`,
      amount,
      loggedAt: now.toISOString(),
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDraftHistory((currentHistory) => [entry, ...currentHistory]);
  };

  const handleSave = () => {
    setStoredGlasses(draftGlasses);
    setStoredHistory(draftHistory);
    setStoredReminders(draftReminders);
    onSave();
  };

  return (
    <div className="hydration-screen-container animation-slide-in">
      <header className="page-header hydration-screen-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>Hydration</h1>
      </header>

      <Card className="hydration-summary-card">
        <div className="hydration-summary-header">
          <div>
            <p className="hydration-kicker">Today so far</p>
            <h2>{draftGlasses} glasses</h2>
          </div>
          <div className="hydration-goal-chip">Goal {waterGoal}</div>
        </div>
        <div className="hydration-progress-bar">
          <div className="hydration-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-muted">Add a quick intake below, then save when you are ready to head back.</p>
      </Card>

      <section className="hydration-section">
        <label className="hydration-section-label">Intake buttons</label>
        <div className="hydration-intake-grid">
          {intakeOptions.map((amount) => (
            <button key={amount} className="hydration-intake-btn" onClick={() => addIntake(amount)}>
              <Droplet size={18} />
              <span>+{amount}</span>
              <small>{formatHydrationAmount(amount)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="hydration-section">
        <Card className="hydration-reminder-card">
          <div className="hydration-reminder-row">
            <div className="hydration-reminder-copy">
              <div className="hydration-reminder-title">
                <Bell size={18} />
                <span>Reminder setting</span>
              </div>
              <p className="text-muted">Keep a gentle nudge on for long shifts.</p>
            </div>
            <label className="hydration-toggle-switch">
              <input
                type="checkbox"
                checked={draftReminders}
                onChange={(event) => setDraftReminders(event.target.checked)}
                aria-label="Toggle hydration reminders"
              />
              <span className="hydration-toggle-slider"></span>
            </label>
          </div>
        </Card>
      </section>

      <section className="hydration-section">
        <label className="hydration-section-label">History log</label>
        <Card className="hydration-history-card">
          {todayHistory.length > 0 ? (
            <div className="hydration-history-list">
              {todayHistory.slice(0, 6).map((entry) => (
                <div key={entry.id} className="hydration-history-item">
                  <div className="hydration-history-icon">
                    <History size={16} />
                  </div>
                  <div className="hydration-history-copy">
                    <strong>{formatHydrationAmount(entry.amount)}</strong>
                    <span>{entry.timeLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No hydration entries yet for today.</p>
          )}
        </Card>
      </section>

      <div className="hydration-screen-actions">
        <Button variant="primary" fullWidth onClick={handleSave}>
          <Check size={20} className="btn-icon" />
          Save Hydration
        </Button>
      </div>
    </div>
  );
};
