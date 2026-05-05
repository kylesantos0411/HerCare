import React, { useEffect, useState } from 'react';
import { BellRing, ChevronLeft, Link2, Moon, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isSupabaseConfigured } from '../utils/firebase';
import {
  getPartnerFullScreenIntentAccess,
  openPartnerFullScreenIntentSettings,
} from '../utils/partnerReminderService';
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
  const [fullScreenIntentSupported, setFullScreenIntentSupported] = useState(false);
  const [fullScreenIntentAllowed, setFullScreenIntentAllowed] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured || !shareCode) {
      setPartnerPushStatus('Background reminders will be ready after this phone connects.');
    }
  }, [configured, setPartnerPushStatus, shareCode]);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const access = await getPartnerFullScreenIntentAccess();

      if (isCancelled) {
        return;
      }

      setFullScreenIntentSupported(access.supported);
      setFullScreenIntentAllowed(access.allowed);
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

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
          {fullScreenIntentSupported && !fullScreenIntentAllowed ? <ShieldAlert size={18} /> : <BellRing size={18} />}
          <div>
            <strong>Reminder behavior</strong>
            <p>
              The Android app keeps a small background service active while this toggle is on. On newer Android
              versions, automatic full-screen launch usually works only when the phone is locked or the screen is off.
              If the phone is already open, Android may show a heads-up notification instead.
            </p>
          </div>
        </div>
      </Card>

      {fullScreenIntentSupported && !fullScreenIntentAllowed && (
        <Card className="partner-settings-note partner-settings-warning">
          <div className="partner-settings-copy">
            <ShieldAlert size={18} />
            <div>
              <strong>Full-screen notifications are blocked</strong>
              <p>
                HerCare can still post nudges, but Android is currently downgrading them to a normal heads-up
                notification. Turn on Full screen notifications for HerCare if you want the best chance of an automatic
                takeover when the phone is locked.
              </p>
              <button
                type="button"
                className="partner-settings-action-btn"
                onClick={() => {
                  void openPartnerFullScreenIntentSettings();
                }}
              >
                Open full-screen settings
              </button>
            </div>
          </div>
        </Card>
      )}

      <button className="partner-disconnect-btn" onClick={onDisconnect}>
        Disconnect This Phone
      </button>
    </div>
  );
};
