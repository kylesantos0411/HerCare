import React, { useEffect } from 'react';
import { BellRing, ChevronLeft, Link2, Moon, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isSupabaseConfigured } from '../utils/firebase';
import './PartnerSettings.css';

interface PartnerSettingsProps {
  shareCode: string;
  darkModeEnabled: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  onBack: () => void;
  onDisconnect: () => void;
}

export const PartnerSettings: React.FC<PartnerSettingsProps> = ({
  shareCode,
  darkModeEnabled,
  onDarkModeChange,
  onBack,
  onDisconnect,
}) => {
  const [partnerAlertsEnabled, setPartnerAlertsEnabled] = useLocalStorage('hercare_partner_checkin_alerts_enabled', true);
  const [partnerPushStatus, setPartnerPushStatus] = useLocalStorage(
    'hercare_partner_push_status',
    'Background reminders will be ready after this phone connects.',
  );
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured || !shareCode) {
      setPartnerPushStatus('Background reminders will be ready after this phone connects.');
    }
  }, [configured, setPartnerPushStatus, shareCode]);

  return (
    <div className="partner-settings-screen animation-slide-in">
      <header className="page-header partner-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1>Partner Settings</h1>
          <p className="subtitle">Control how this phone receives partner updates.</p>
        </div>
      </header>

      <Card className="partner-settings-card">
        <div className="partner-settings-row">
          <div className="partner-settings-copy">
            <BellRing size={18} />
            <div>
              <strong>Background reminders</strong>
              <p>Run a background reminder service so hydration and meal nudges can appear over other apps.</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={partnerAlertsEnabled}
              onChange={(event) => setPartnerAlertsEnabled(event.target.checked)}
              aria-label="Toggle partner check-in alerts"
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-divider"></div>

        <div className="partner-settings-row">
          <div className="partner-settings-copy">
            <Moon size={18} />
            <div>
              <strong>Dark mode</strong>
              <p>Keep the partner side in dark mode while you check her board.</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={darkModeEnabled}
              onChange={(event) => onDarkModeChange(event.target.checked)}
              aria-label="Toggle partner dark mode"
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-divider"></div>

        <div className="partner-settings-row">
          <div className="partner-settings-copy">
            <Link2 size={18} />
            <div>
              <strong>Connected share code</strong>
              <p>{shareCode || 'No code connected yet.'}</p>
            </div>
          </div>
        </div>

        <div className="settings-divider"></div>

        <div className="partner-settings-row">
          <div className="partner-settings-copy">
            <ShieldCheck size={18} />
            <div>
              <strong>Reminder status</strong>
              <p>{partnerPushStatus}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="partner-settings-note">
        <div className="partner-settings-copy">
          <ShieldCheck size={18} />
          <div>
            <strong>Privacy note</strong>
            <p>Location is still manual only. It appears only when she actively sends it from her phone.</p>
          </div>
        </div>
      </Card>

      <Card className="partner-settings-note">
        <div className="partner-settings-copy">
          <BellRing size={18} />
          <div>
            <strong>Reminder behavior</strong>
            <p>The Android app keeps a small background service active while this toggle is on.</p>
          </div>
        </div>
      </Card>

      <button className="partner-disconnect-btn" onClick={onDisconnect}>
        Disconnect This Phone
      </button>
    </div>
  );
};
