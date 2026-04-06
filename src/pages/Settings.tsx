import React from 'react';
import {
  Bell,
  BellRing,
  ChevronLeft,
  Clock3,
  HeartHandshake,
  Link2,
  MonitorSmartphone,
  Moon,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { APP_NAME, APP_VERSION } from '../utils/appInfo';
import type { ShiftType } from '../utils/shift';
import './Settings.css';

interface SettingsProps {
  onBack: () => void;
  onOpenPartnerSharing: () => void;
  nightShiftEnabled: boolean;
  onNightShiftChange: (enabled: boolean) => void;
  onLogout: () => void;
  showPartnerTools: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  onBack,
  onOpenPartnerSharing,
  nightShiftEnabled,
  onNightShiftChange,
  onLogout,
  showPartnerTools,
}) => {
  const [name] = useLocalStorage('hercare_user_name', '');
  const [shiftPreference, setShiftPreference] = useLocalStorage<ShiftType>('hercare_shift_preference', 'Night Duty');
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage('hercare_notifications_enabled', true);
  const [studyAlertsEnabled, setStudyAlertsEnabled] = useLocalStorage('hercare_study_alerts_enabled', true);
  const shiftOptions: ShiftType[] = ['Night Duty', 'Day Shift', 'Rotating'];

  return (
    <div className="settings-container animation-slide-in">
      <header className="page-header settings-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>Settings</h1>
      </header>

      <section className="settings-section">
        <h3>Profile</h3>
        <Card className="settings-card">
          <div className="settings-item">
            <div className="settings-icon-name">
              <div className="icon-wrapper variant-primary">
                <HeartHandshake size={20} />
              </div>
              <span>{name || 'Your profile'}</span>
            </div>
            <span className="settings-value">Saved</span>
          </div>
          <div className="settings-divider"></div>
          <div className="settings-item">
            <div className="settings-icon-name">
              <div className="icon-wrapper variant-secondary">
                <Clock3 size={20} />
              </div>
              <span>Shift preference</span>
            </div>
            <span className="settings-value">{shiftPreference}</span>
          </div>
        </Card>
      </section>

      <section className="settings-section">
        <h3>Shift Preferences</h3>
        <Card className="settings-card settings-preference-card">
          <div className="settings-preference-grid">
            {shiftOptions.map((option) => (
              <button
                key={option}
                className={`settings-preference-btn ${shiftPreference === option ? 'active' : ''}`}
                onClick={() => setShiftPreference(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="settings-section">
        <h3>Preferences</h3>
        <Card className="settings-card">
          <div className="settings-item">
            <div className="settings-icon-name">
              <div className="icon-wrapper variant-accent">
                <Bell size={20} />
              </div>
              <span>Notifications</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(event) => setNotificationsEnabled(event.target.checked)}
                aria-label="Toggle notifications"
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-divider"></div>
          <div className="settings-item">
            <div className="settings-icon-name">
              <div className="icon-wrapper variant-secondary">
                <BellRing size={20} />
              </div>
              <div className="settings-label-stack">
                <span>Study timer alerts</span>
                <small className="settings-item-hint">Sound, vibration, and gentle timer nudge</small>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={studyAlertsEnabled}
                onChange={(event) => setStudyAlertsEnabled(event.target.checked)}
                aria-label="Toggle study timer alerts"
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-divider"></div>
          <div className="settings-item">
            <div className="settings-icon-name">
              <div className="icon-wrapper variant-primary">
                <Moon size={20} />
              </div>
              <span>Default to Dark Mode</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={nightShiftEnabled}
                onChange={(event) => onNightShiftChange(event.target.checked)}
                aria-label="Toggle dark mode"
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settings-divider"></div>
          <div className="settings-item">
            <div className="settings-icon-name">
              <div className="icon-wrapper variant-secondary">
                <MonitorSmartphone size={20} />
              </div>
              <span>Theme</span>
            </div>
            <span className="settings-value">{nightShiftEnabled ? 'Dark' : 'Light'}</span>
          </div>
        </Card>
      </section>

      {showPartnerTools && (
        <section className="settings-section">
          <h3>Partner</h3>
          <Card className="settings-card">
            <button className="settings-link-item" onClick={onOpenPartnerSharing}>
              <div className="settings-icon-name">
                <div className="icon-wrapper variant-primary">
                  <Link2 size={20} />
                </div>
                <span>Partner Sharing</span>
              </div>
              <span className="settings-action">Open</span>
            </button>
          </Card>
        </section>
      )}

      <div className="settings-footer">
        <button className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
        <p className="app-version">{APP_NAME} Version {APP_VERSION}</p>
      </div>
    </div>
  );
};
