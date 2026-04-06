import React, { useState } from 'react';
import { Check, ChevronLeft, Clock, Moon, Star } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  calculateSleepDuration,
  formatDuration,
  formatTargetHours,
  getLatestSleepLog,
  sleepQualityLabels,
  type SleepLogEntry,
  type SleepQuality,
} from '../utils/sleep';
import './SleepLog.css';

interface SleepLogProps {
  onBack: () => void;
  onSave: () => void;
}

const qualityOptions: Array<{ value: SleepQuality; caption: string }> = [
  { value: 'poor', caption: 'Restless and interrupted' },
  { value: 'fair', caption: 'Enough, but not ideal' },
  { value: 'good', caption: 'Solid and steady' },
  { value: 'great', caption: 'Deep, restorative rest' },
];

export const SleepLog: React.FC<SleepLogProps> = ({ onBack, onSave }) => {
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLogEntry[]>('hercare_sleep_logs', []);
  const [sleepTargetHours] = useLocalStorage('hercare_sleep_target_hours', 7.5);
  const latestSleepLog = getLatestSleepLog(sleepLogs);

  const [startTime, setStartTime] = useState(latestSleepLog?.startTime ?? '23:00');
  const [endTime, setEndTime] = useState(latestSleepLog?.endTime ?? '06:30');
  const [quality, setQuality] = useState<SleepQuality>(latestSleepLog?.quality ?? 'good');
  const [notes, setNotes] = useState(latestSleepLog?.notes ?? '');

  const durationMinutes = calculateSleepDuration(startTime, endTime);
  const durationLabel = formatDuration(durationMinutes);
  const targetLabel = formatTargetHours(sleepTargetHours);
  const isBelowTarget = durationMinutes > 0 && durationMinutes < sleepTargetHours * 60;

  const handleSave = () => {
    const now = new Date();
    const newSleepLog: SleepLogEntry = {
      id: Date.now().toString(),
      startTime,
      endTime,
      quality,
      notes: notes.trim(),
      durationMinutes,
      loggedAt: now.toISOString(),
      dateLabel: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    setSleepLogs((currentLogs) => [newSleepLog, ...currentLogs]);
    onSave();
  };

  return (
    <div className="sleep-log-container animation-slide-in">
      <header className="page-header sleep-log-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>Sleep Log</h1>
      </header>

      <Card className="sleep-preview-card">
        <div className="sleep-preview-header">
          <div>
            <p className="sleep-kicker">Estimated rest</p>
            <h2>{durationLabel}</h2>
          </div>
          <div className={`sleep-preview-badge ${isBelowTarget ? 'low' : ''}`}>
            {isBelowTarget ? `Below ${targetLabel}` : `Target ${targetLabel}`}
          </div>
        </div>
        <p className="text-muted">
          {latestSleepLog
            ? `Last saved ${latestSleepLog.dateLabel} at ${formatDuration(latestSleepLog.durationMinutes)}.`
            : 'Your newest sleep entry will show up on Wellness and Home right away.'}
        </p>
      </Card>

      <section className="sleep-form-section">
        <Card className="sleep-input-card">
          <div className="sleep-input-row">
            <div className="sleep-input-icon">
              <Moon size={20} />
            </div>
            <div className="sleep-input-field">
              <label>Sleep start</label>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="sleep-input"
              />
            </div>
          </div>

          <div className="sleep-input-divider"></div>

          <div className="sleep-input-row">
            <div className="sleep-input-icon">
              <Clock size={20} />
            </div>
            <div className="sleep-input-field">
              <label>Wake time</label>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="sleep-input"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="sleep-form-section">
        <label className="sleep-section-label">Sleep quality</label>
        <div className="sleep-quality-grid">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              className={`sleep-quality-btn ${quality === option.value ? 'active' : ''}`}
              onClick={() => setQuality(option.value)}
            >
              <div className="sleep-quality-heading">
                <Star size={16} />
                <span>{sleepQualityLabels[option.value]}</span>
              </div>
              <span className="sleep-quality-caption">{option.caption}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sleep-form-section">
        <label className="sleep-section-label">Notes</label>
        <textarea
          className="sleep-notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="How did you actually feel when you woke up?"
        ></textarea>
        {durationMinutes === 0 && (
          <p className="sleep-helper-text">Pick different start and end times so we can calculate the duration.</p>
        )}
      </section>

      <div className="sleep-actions">
        <Button variant="primary" fullWidth onClick={handleSave} disabled={durationMinutes === 0}>
          <Check size={20} className="btn-icon" />
          Save Sleep Log
        </Button>
      </div>
    </div>
  );
};
