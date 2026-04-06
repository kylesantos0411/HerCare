import React, { useState } from 'react';
import { User, Clock, Target } from 'lucide-react';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ShiftType } from '../utils/shift';
import './SetupWizard.css';

interface SetupWizardProps {
  onComplete: () => void;
}

function formatGoalValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, '');
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const shiftOptions: Array<{ label: string; value: ShiftType }> = [
    { label: 'Night Shift', value: 'Night Duty' },
    { label: 'Day Shift', value: 'Day Shift' },
    { label: 'Rotating', value: 'Rotating' },
  ];

  const [step, setStep] = useState(1);
  const [name, setName] = useLocalStorage('hercare_user_name', '');
  const [waterGoal, setWaterGoal] = useLocalStorage('hercare_water_target', 8);
  const [sleepGoal, setSleepGoal] = useLocalStorage('hercare_sleep_target_hours', 7.5);
  const [shiftPreference, setShiftPreference] = useLocalStorage<ShiftType>('hercare_shift_preference', 'Night Duty');

  const adjustWaterGoal = (change: number) => {
    setWaterGoal((currentGoal) => Math.min(12, Math.max(4, currentGoal + change)));
  };

  const adjustSleepGoal = (change: number) => {
    setSleepGoal((currentGoal) => {
      const nextGoal = Math.min(10, Math.max(5, currentGoal + change));
      return Math.round(nextGoal * 2) / 2;
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    onComplete();
  };

  return (
    <div className="setup-container">
      <div className="setup-progress">
        <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}></div>
        <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}></div>
        <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
        <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}></div>
      </div>

      <div className="setup-content">
        {step === 1 && (
          <div className="setup-step animation-slide-in">
            <div className="step-icon variant-primary">
              <User size={32} />
            </div>
            <h2>Let's get to know you</h2>
            <p className="subtitle">So we can personalize your experience.</p>

            <div className="input-group">
              <label>Your Name / Nickname</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="hercare-input"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step animation-slide-in">
            <div className="step-icon variant-secondary">
              <Clock size={32} />
            </div>
            <h2>Shift Schedule</h2>
            <p className="subtitle">What kind of shifts do you usually work?</p>

            <div className="options-grid">
              {shiftOptions.map((option) => (
                <button
                  key={option.value}
                  className={`option-card ${shiftPreference === option.value ? 'active' : ''}`}
                  onClick={() => setShiftPreference(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step animation-slide-in">
            <div className="step-icon variant-accent">
              <Target size={32} />
            </div>
            <h2>Wellness Goals</h2>
            <p className="subtitle">Small targets for big impact.</p>

            <div className="goal-row">
              <span>Water (Glasses)</span>
              <div className="goal-counter">
                <button className="counter-btn" onClick={() => adjustWaterGoal(-1)} aria-label="Decrease water goal">
                  -
                </button>
                <span>{formatGoalValue(waterGoal)}</span>
                <button className="counter-btn" onClick={() => adjustWaterGoal(1)} aria-label="Increase water goal">
                  +
                </button>
              </div>
            </div>

            <div className="goal-row">
              <span>Sleep (Hours)</span>
              <div className="goal-counter">
                <button className="counter-btn" onClick={() => adjustSleepGoal(-0.5)} aria-label="Decrease sleep goal">
                  -
                </button>
                <span>{formatGoalValue(sleepGoal)}</span>
                <button className="counter-btn" onClick={() => adjustSleepGoal(0.5)} aria-label="Increase sleep goal">
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="setup-actions">
        <Button variant="primary" fullWidth onClick={handleNext}>
          {step === 3 ? 'Finish Setup' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
