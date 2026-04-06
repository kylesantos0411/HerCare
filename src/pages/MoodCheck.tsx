import React, { useState } from 'react';
import { Check, ChevronLeft, HeartPulse } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  getLatestMoodEntry,
  moodLabels,
  type MoodEntry,
  type MoodState,
} from '../utils/wellness';
import './MoodCheck.css';

interface MoodCheckProps {
  onBack: () => void;
  onSave: () => void;
}

const moodOptions: MoodState[] = ['tired', 'neutral', 'good', 'great'];
const scaleOptions = [1, 2, 3, 4, 5];

export const MoodCheck: React.FC<MoodCheckProps> = ({ onBack, onSave }) => {
  const [currentMood, setCurrentMood] = useLocalStorage<MoodState>('hercare_mood', 'good');
  const [moodEntries, setMoodEntries] = useLocalStorage<MoodEntry[]>('hercare_mood_entries', []);
  const latestMoodEntry = getLatestMoodEntry(moodEntries);

  const [selectedMood, setSelectedMood] = useState<MoodState>(latestMoodEntry?.mood ?? currentMood);
  const [energyLevel, setEnergyLevel] = useState(latestMoodEntry?.energyLevel ?? 3);
  const [stressLevel, setStressLevel] = useState(latestMoodEntry?.stressLevel ?? 2);
  const [notes, setNotes] = useState(latestMoodEntry?.notes ?? '');

  const handleSave = () => {
    const now = new Date();
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: selectedMood,
      energyLevel,
      stressLevel,
      notes: notes.trim(),
      loggedAt: now.toISOString(),
      dateLabel: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCurrentMood(selectedMood);
    setMoodEntries((currentEntries) => [newEntry, ...currentEntries]);
    onSave();
  };

  return (
    <div className="mood-check-container animation-slide-in">
      <header className="page-header mood-check-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>Mood Check</h1>
      </header>

      <Card className="mood-preview-card">
        <div className="mood-preview-header">
          <div>
            <p className="mood-kicker">Current check-in</p>
            <h2>{moodLabels[selectedMood]}</h2>
          </div>
          <div className="mood-preview-icon">
            <HeartPulse size={20} />
          </div>
        </div>
        <p className="text-muted">Energy {energyLevel}/5 | Stress {stressLevel}/5</p>
      </Card>

      <section className="mood-section">
        <label className="mood-section-label">How are you feeling?</label>
        <div className="mood-options-grid">
          {moodOptions.map((option) => (
            <button
              key={option}
              className={`mood-option-btn ${selectedMood === option ? 'active' : ''}`}
              onClick={() => setSelectedMood(option)}
            >
              {moodLabels[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="mood-section">
        <label className="mood-section-label">Energy level</label>
        <div className="mood-scale-row">
          {scaleOptions.map((option) => (
            <button
              key={option}
              className={`mood-scale-btn ${energyLevel === option ? 'active' : ''}`}
              onClick={() => setEnergyLevel(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mood-scale-caption">1 = wiped out, 5 = strong and steady</p>
      </section>

      <section className="mood-section">
        <label className="mood-section-label">Stress level</label>
        <div className="mood-scale-row">
          {scaleOptions.map((option) => (
            <button
              key={option}
              className={`mood-scale-btn stress ${stressLevel === option ? 'active' : ''}`}
              onClick={() => setStressLevel(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mood-scale-caption">1 = calm, 5 = maxed out</p>
      </section>

      <section className="mood-section">
        <label className="mood-section-label">Notes</label>
        <textarea
          className="mood-notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything you want to remember about this shift?"
        ></textarea>
      </section>

      <div className="mood-check-actions">
        <Button variant="primary" fullWidth onClick={handleSave}>
          <Check size={20} className="btn-icon" />
          Save Mood Check
        </Button>
      </div>
    </div>
  );
};
