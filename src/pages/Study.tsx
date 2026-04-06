import React, { useEffect, useState } from 'react';
import { BellRing, CirclePause, Play, RotateCcw, Settings, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import {
  STUDY_MINUTES_MAX,
  STUDY_MINUTES_MIN,
  formatStudyCountdown,
  getStudyPresetDescription,
  getStudyPresetLabel,
  getStudyProgress,
  isStudyPresetMinutes,
  studyPresetOptions,
  type StudyPresetMinutes,
  type StudyTimerState,
} from '../utils/study';
import './Study.css';

interface StudyProps {
  timer: StudyTimerState;
  notificationsEnabled: boolean;
  studyAlertsEnabled: boolean;
  onSelectPreset: (minutes: StudyPresetMinutes) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onStartAnotherSession: () => void;
  onTakeBreak: () => void;
  onGoToYou: () => void;
  onOpenSettings: () => void;
}

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const CUSTOM_MINUTES_DEFAULT = '45';

function parseCustomMinutes(value: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  const roundedValue = Math.round(parsedValue);

  if (roundedValue < STUDY_MINUTES_MIN || roundedValue > STUDY_MINUTES_MAX) {
    return null;
  }

  return roundedValue;
}

function getStudyStateLabel(timer: StudyTimerState) {
  if (timer.status === 'running') {
    return 'Kaya mo yan baby!';
  }

  if (timer.status === 'paused') {
    return 'Pause lang muna';
  }

  if (timer.status === 'completed') {
    return 'Tapos na, baby';
  }

  return 'Goodluck Guppy!';
}

function getStudySupportCopy(timer: StudyTimerState) {
  if (timer.status === 'running') {
    return 'Dahan-dahan lang, take your time baby';
  }

  if (timer.status === 'paused') {
    return 'Okay lang mag-pause. Balik ka lang when nakapag small break ka na.';
  }

  if (timer.status === 'completed') {
    return 'Good job, baby. Kahit maliit lang, proud ako sa iyo.';
  }

  return 'Choose the time na kaya mo lang today. Hindi need perfect baby.';
}

export const Study: React.FC<StudyProps> = ({
  timer,
  notificationsEnabled,
  studyAlertsEnabled,
  onSelectPreset,
  onStart,
  onPause,
  onReset,
  onStartAnotherSession,
  onTakeBreak,
  onGoToYou,
  onOpenSettings,
}) => {
  const [customMinutesInput, setCustomMinutesInput] = useState(CUSTOM_MINUTES_DEFAULT);
  const progress = timer.status === 'completed' ? 1 : getStudyProgress(timer);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const orbitAngle = progress * 360 - 90;
  const orbitX = 50 + RING_RADIUS * Math.cos((orbitAngle * Math.PI) / 180);
  const orbitY = 50 + RING_RADIUS * Math.sin((orbitAngle * Math.PI) / 180);
  const canReset = timer.status !== 'idle' || timer.remainingSeconds !== timer.totalSeconds;
  const customSelectionActive = !isStudyPresetMinutes(timer.selectedMinutes);
  const parsedCustomMinutes = parseCustomMinutes(customMinutesInput);
  const canApplyCustomMinutes =
    timer.status !== 'running' && parsedCustomMinutes !== null && parsedCustomMinutes !== timer.selectedMinutes;

  useEffect(() => {
    if (customSelectionActive) {
      setCustomMinutesInput(String(timer.selectedMinutes));
    }
  }, [customSelectionActive, timer.selectedMinutes]);

  const handleCustomTimeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canApplyCustomMinutes || parsedCustomMinutes === null) {
      return;
    }

    onSelectPreset(parsedCustomMinutes);
  };

  return (
    <div className={`study-container status-${timer.status}`}>
      <header className="page-header study-header">
        <p className="study-kicker">Flexible Pomodoro</p>
        <h1>Focus Time</h1>
        <p className="subtitle">Kahit few minutes lang, enough na yun baby.</p>
      </header>

      <Card className={`study-timer-card status-${timer.status}`}>
        <div className="study-aura" aria-hidden="true"></div>

        <div className="study-card-topline">
          <span className="study-chip">
            <Sparkles size={14} />
            Quick Focus
          </span>
          <span className="study-chip subtle">{getStudyPresetLabel(timer.selectedMinutes)}</span>
        </div>

        <div className="study-ring-shell">
          <svg className="study-ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="study-ring-track" cx="50" cy="50" r={RING_RADIUS}></circle>
            <circle
              className="study-ring-progress"
              cx="50"
              cy="50"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            ></circle>
            <circle className="study-ring-orbit" cx={orbitX} cy={orbitY} r="3.5"></circle>
          </svg>

          <div className="study-ring-center">
            <span className="study-time">{formatStudyCountdown(timer.remainingSeconds)}</span>
            <span className="study-state-label">{getStudyStateLabel(timer)}</span>
          </div>
        </div>

        <p className="study-support-copy">{getStudySupportCopy(timer)}</p>

        <div className="study-preset-row">
          {studyPresetOptions.map((preset) => (
            <button
              key={preset.minutes}
              type="button"
              className={`study-preset-btn ${timer.selectedMinutes === preset.minutes ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset.minutes)}
              disabled={timer.status === 'running'}
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>

        <form className={`study-custom-time ${customSelectionActive ? 'active' : ''}`} onSubmit={handleCustomTimeSubmit}>
          <div className="study-custom-copy">
            <p className="study-custom-title">Other minutes</p>
            <span>
              {customSelectionActive
                ? `Using ${getStudyPresetLabel(timer.selectedMinutes)} right now.`
                : 'Type the time na gusto mo today.'}
            </span>
          </div>

          <div className="study-custom-controls">
            <label className="study-custom-input-shell">
              <input
                type="number"
                min={STUDY_MINUTES_MIN}
                max={STUDY_MINUTES_MAX}
                step={1}
                inputMode="numeric"
                value={customMinutesInput}
                onChange={(event) => setCustomMinutesInput(event.target.value)}
                disabled={timer.status === 'running'}
                placeholder="45"
              />
              <span>mins</span>
            </label>

            <Button variant="outline" type="submit" disabled={!canApplyCustomMinutes}>
              Use Custom
            </Button>
          </div>

          <p className={`study-custom-hint ${customMinutesInput.trim() && parsedCustomMinutes === null ? 'error' : ''}`}>
            {customMinutesInput.trim() && parsedCustomMinutes === null
              ? `Enter ${STUDY_MINUTES_MIN} to ${STUDY_MINUTES_MAX} minutes.`
              : parsedCustomMinutes !== null
                ? `${getStudyPresetLabel(parsedCustomMinutes)} focus window ready.`
                : 'Choose any study time that fits today.'}
          </p>
        </form>

        <div className="study-action-row">
          <Button variant="primary" onClick={onStart} disabled={timer.status === 'running'}>
            <Play size={16} />
            {timer.status === 'paused' ? 'Resume Na' : 'Start'}
          </Button>
          <Button variant="secondary" onClick={onPause} disabled={timer.status !== 'running'}>
            <CirclePause size={16} />
            Pause
          </Button>
          <Button variant="ghost" onClick={onReset} disabled={!canReset}>
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>

        <div className={`study-alert-hint ${notificationsEnabled && studyAlertsEnabled ? 'ready' : 'off'}`}>
          <div className="study-alert-copy">
            <div className="study-alert-title">
              <BellRing size={15} />
              <span>{notificationsEnabled && studyAlertsEnabled ? 'Gentle alert ready' : 'Gentle alert is off'}</span>
            </div>
            <p>
              {notificationsEnabled && studyAlertsEnabled
                ? "Pag time na, may soft sound at little nudge para di mo kailangan bantayan palagi."
                : 'Turn on Notifications and Study timer alerts in Settings if you want a soft reminder when time is up.'}
            </p>
          </div>

          {(!notificationsEnabled || !studyAlertsEnabled) && (
            <button type="button" className="study-alert-settings-btn" onClick={onOpenSettings}>
              <Settings size={14} />
              Open Settings
            </button>
          )}
        </div>
      </Card>

      <Card className="study-context-card">
        <div className="study-context-header">
          <p className="study-complete-kicker">choose kung ano lang ang kaya today</p>
          <span>{timer.completedSessions} done</span>
        </div>

        <div className="study-context-grid">
          {studyPresetOptions.map((preset) => (
            <div
              key={preset.minutes}
              className={`study-context-item ${timer.selectedMinutes === preset.minutes ? 'active' : ''}`}
            >
              <strong>{preset.label}</strong>
              <p>{getStudyPresetDescription(preset.minutes)}</p>
            </div>
          ))}

          <div className={`study-context-item ${customSelectionActive ? 'active' : ''}`}>
            <strong>{customSelectionActive ? getStudyPresetLabel(timer.selectedMinutes) : 'Custom'}</strong>
            <p>
              {customSelectionActive
                ? 'Your own focus time for today.'
                : 'Type any minutes above if you want something in-between.'}
            </p>
          </div>
        </div>
      </Card>

      {timer.status === 'completed' && (
        <div className="study-complete-overlay" role="dialog" aria-modal="true" aria-labelledby="study-complete-title">
          <div className="study-complete-backdrop" aria-hidden="true"></div>

          <Card className="study-complete-modal">
            <p className="study-complete-kicker">You did it</p>
            <h3 id="study-complete-title">Good job, baby. Enough na yan for today.</h3>
            <p className="study-complete-copy">Break muna? Water ka muna, then rest your mind a little.</p>

            <div className="study-complete-actions">
              <Button variant="primary" fullWidth onClick={onStartAnotherSession}>
                One More Round
              </Button>
              <Button variant="secondary" fullWidth onClick={onTakeBreak}>
                Break Muna
              </Button>
              <Button variant="outline" fullWidth onClick={onGoToYou}>
                Go to You
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
