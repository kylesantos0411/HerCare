import React, { useEffect, useState } from 'react';
import {
  BellRing,
  ChevronLeft,
  Copy,
  HeartHandshake,
  MapPinned,
  MessageCircleHeart,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getCurrentDeviceLocation } from '../utils/deviceLocation';
import { isFirebaseConfigured } from '../utils/firebase';
import {
  createPartnerShare,
  formatPartnerTimestamp,
  sharePartnerLocationCheckIn,
  sendPartnerQuickCheckIn,
  subscribeToPartnerShare,
  updatePartnerSharingPreferences,
  type PartnerShareDocument,
} from '../utils/partner';
import './PartnerSharing.css';

interface PartnerSharingProps {
  onBack: () => void;
}

function formatShareCode(value: string) {
  return value ? `${value.slice(0, 4)}-${value.slice(4)}` : '---- ----';
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  throw new Error('Copy is not available on this device.');
}

export const PartnerSharing: React.FC<PartnerSharingProps> = ({ onBack }) => {
  const [name] = useLocalStorage('hercare_user_name', 'Love');
  const [shareCode, setShareCode] = useLocalStorage('hercare_partner_share_code', '');
  const [sharingEnabled, setSharingEnabled] = useLocalStorage('hercare_partner_sharing_enabled', false);
  const [locationSharingEnabled, setLocationSharingEnabled] = useLocalStorage('hercare_partner_location_enabled', false);
  const [shareDoc, setShareDoc] = useState<PartnerShareDocument | null>(null);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState<'create' | 'copy' | 'checkin' | 'location' | 'toggle' | null>(null);

  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured || !shareCode) {
      setShareDoc(null);
      return;
    }

    let isCancelled = false;
    let stopListening: (() => void) | undefined;

    void subscribeToPartnerShare(
      shareCode,
      (value) => {
        if (isCancelled) {
          return;
        }

        setShareDoc(value);
      },
      (caughtError) => {
        if (isCancelled) {
          return;
        }

        setError(caughtError.message);
      },
    ).then((unsubscribe) => {
      if (isCancelled) {
        unsubscribe();
        return;
      }

      stopListening = unsubscribe;
    });

    return () => {
      isCancelled = true;
      stopListening?.();
    };
  }, [configured, shareCode]);

  const handleCreateShare = async () => {
    setError('');
    setStatusMessage('');
    setBusyAction('create');

    try {
      const createdCode = await createPartnerShare(name);
      setShareCode(createdCode);
      setSharingEnabled(true);
      setLocationSharingEnabled(false);
      setStatusMessage(`Private share code ready: ${formatShareCode(createdCode)}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create a share code right now.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopy = async () => {
    if (!shareCode) {
      return;
    }

    setError('');
    setStatusMessage('');
    setBusyAction('copy');

    try {
      await copyText(shareCode);
      setStatusMessage('Share code copied.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to copy the share code.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSharingToggle = async (nextValue: boolean) => {
    setError('');
    setStatusMessage('');
    setBusyAction('toggle');

    try {
      let activeShareCode = shareCode;

      if (!activeShareCode && nextValue) {
        activeShareCode = await createPartnerShare(name);
        setShareCode(activeShareCode);
      }

      if (!activeShareCode) {
        setSharingEnabled(false);
        return;
      }

      await updatePartnerSharingPreferences({
        shareCode: activeShareCode,
        ownerName: name,
        sharingEnabled: nextValue,
        locationSharingEnabled: nextValue ? locationSharingEnabled : false,
      });

      setSharingEnabled(nextValue);

      if (!nextValue) {
        setLocationSharingEnabled(false);
      }

      setStatusMessage(nextValue ? 'Partner syncing is on.' : 'Partner syncing is paused.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update sharing right now.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleLocationToggle = async (nextValue: boolean) => {
    if (!shareCode) {
      return;
    }

    setError('');
    setStatusMessage('');
    setBusyAction('toggle');

    try {
      await updatePartnerSharingPreferences({
        shareCode,
        ownerName: name,
        sharingEnabled,
        locationSharingEnabled: nextValue,
      });

      setLocationSharingEnabled(nextValue);
      setStatusMessage(nextValue ? 'Location check-ins are allowed now.' : 'Location check-ins are off now.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update location sharing.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendCheckIn = async () => {
    if (!shareCode) {
      setError('Create a share code first.');
      return;
    }

    setError('');
    setStatusMessage('');
    setBusyAction('checkin');

    try {
      await sendPartnerQuickCheckIn(shareCode, checkInMessage);
      setCheckInMessage('');
      setStatusMessage('Little update sent.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to send the check-in.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleShareLocation = async () => {
    if (!shareCode) {
      setError('Create a share code first.');
      return;
    }

    setError('');
    setStatusMessage('');
    setBusyAction('location');

    try {
      const position = await getCurrentDeviceLocation();
      await sharePartnerLocationCheckIn(shareCode, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setStatusMessage('Current location shared.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to share the current location.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="partner-screen partner-sharing-screen animation-slide-in">
      <header className="page-header partner-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1>Partner Sharing</h1>
          <p className="subtitle">Let her app share status updates and optional location check-ins with you.</p>
        </div>
      </header>

      {!configured ? (
        <Card className="partner-empty-card">
          <div className="partner-empty-icon">
            <HeartHandshake size={22} />
          </div>
          <h3>Firebase setup still needed</h3>
          <p>
            Add your Firebase project values in <strong>`.env.local`</strong> and rebuild once. After that, this screen
            will create share codes and sync live statuses.
          </p>
        </Card>
      ) : (
        <>
          <Card className="partner-share-card" variant="primary">
            <p className="partner-share-kicker">Private share code</p>
            <h2>{formatShareCode(shareCode)}</h2>
            <p>
              {shareCode
                ? 'Use this code in Partner View on the other phone.'
                : 'Create a private code first so only the paired phone can open your dashboard.'}
            </p>
            <div className="partner-share-actions">
              <Button onClick={handleCreateShare} disabled={busyAction === 'create'}>
                {shareCode ? 'Create Fresh Code' : busyAction === 'create' ? 'Creating...' : 'Create Share Code'}
              </Button>
              <Button variant="outline" onClick={handleCopy} disabled={!shareCode || busyAction === 'copy'}>
                <Copy size={16} />
                {busyAction === 'copy' ? 'Copying...' : 'Copy'}
              </Button>
            </div>
          </Card>

          {(statusMessage || error) && (
            <Card className={`partner-feedback-card ${error ? 'error' : 'success'}`}>
              <p>{error || statusMessage}</p>
            </Card>
          )}

          <Card className="partner-status-card">
            <div className="partner-status-row">
              <div className="partner-status-copy">
                <BellRing size={18} />
                <div>
                  <strong>Share live statuses</strong>
                  <p>Hydration, meals, mood, sleep, and next shift summary.</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={sharingEnabled}
                  onChange={(event) => void handleSharingToggle(event.target.checked)}
                  aria-label="Toggle partner sharing"
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-divider"></div>

            <div className="partner-status-row">
              <div className="partner-status-copy">
                <MapPinned size={18} />
                <div>
                  <strong>Allow location check-ins</strong>
                  <p>Only shares location when you tap the button below.</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={locationSharingEnabled}
                  onChange={(event) => void handleLocationToggle(event.target.checked)}
                  disabled={!shareCode || !sharingEnabled}
                  aria-label="Toggle partner location check-ins"
                />
                <span className="slider"></span>
              </label>
            </div>
          </Card>

          <Card className="partner-detail-card">
            <p className="partner-section-kicker">Partner status</p>
            <h3>{shareDoc?.partnerName ? `${shareDoc.partnerName} is connected` : 'Waiting for the other phone'}</h3>
            <p className="partner-detail-note">
              {shareDoc?.partnerName
                ? `Connected with ${shareDoc.partnerName}.`
                : 'Once he enters your code on the other phone, the connection will show up here.'}
            </p>
            {shareDoc?.latestCheckIn && (
              <p className="partner-detail-note">Last shared message: "{shareDoc.latestCheckIn.message}"</p>
            )}
          </Card>

          <Card className="partner-detail-card">
            <div className="partner-detail-header">
              <div>
                <p className="partner-section-kicker">Little message</p>
                <h3>Send a quick check-in</h3>
              </div>
              <MessageCircleHeart size={18} />
            </div>
            <textarea
              className="partner-textarea"
              value={checkInMessage}
              onChange={(event) => setCheckInMessage(event.target.value)}
              placeholder="Example: Baby, still in the middle of shift but okay pa naman."
              rows={4}
            />
            <div className="partner-detail-actions">
              <Button fullWidth onClick={handleSendCheckIn} disabled={!shareCode || busyAction === 'checkin'}>
                {busyAction === 'checkin' ? 'Sending...' : 'Send Check-In'}
              </Button>
            </div>
          </Card>

          <Card className="partner-detail-card">
            <p className="partner-section-kicker">Location</p>
            <h3>Share current location now</h3>
            <p className="partner-detail-note">
              {shareDoc?.latestLocation
                ? `Last shared ${formatPartnerTimestamp(shareDoc.latestLocation.sharedAtIso)}`
                : 'Nothing has been shared yet.'}
            </p>
            <div className="partner-detail-actions">
              <Button
                fullWidth
                variant="secondary"
                onClick={handleShareLocation}
                disabled={!shareCode || !sharingEnabled || !locationSharingEnabled || busyAction === 'location'}
              >
                {busyAction === 'location' ? 'Sharing...' : 'Share Current Location'}
              </Button>
            </div>
          </Card>

        </>
      )}
    </div>
  );
};
