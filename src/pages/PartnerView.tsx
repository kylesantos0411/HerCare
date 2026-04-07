import React, { useEffect, useState } from 'react';
import {
  AlarmClock,
  BellRing,
  ChevronLeft,
  MapPinned,
  Moon,
  Droplet,
  Smile,
  Settings2,
  UtensilsCrossed,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isFirebaseConfigured } from '../utils/firebase';
import {
  formatPartnerTimestamp,
  getMapsUrl,
  sendPartnerCareNudge,
  type PartnerCareNudgeType,
  subscribeToPartnerShare,
  type PartnerStudyStatusSnapshot,
  type PartnerShareDocument,
} from '../utils/partner';
import { formatDuration, formatTargetHours } from '../utils/sleep';
import { formatStudyCountdown, getStudyPresetLabel, getStudyRemainingSeconds, type StudyTimerStatus } from '../utils/study';
import './PartnerView.css';

interface PartnerViewProps {
  shareCode: string;
  onBack: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
}

function getPartnerStudyRemainingSeconds(study: PartnerStudyStatusSnapshot | null, now = new Date()) {
  if (!study) {
    return 0;
  }

  if (study.status === 'running' && study.endsAtIso) {
    return getStudyRemainingSeconds(study.endsAtIso, now);
  }

  return Math.max(study.remainingSeconds, 0);
}

function getPartnerStudyDisplayStatus(
  study: PartnerStudyStatusSnapshot | null,
  remainingSeconds: number,
): StudyTimerStatus {
  if (!study) {
    return 'idle';
  }

  if (study.status === 'running' && remainingSeconds <= 0) {
    return 'completed';
  }

  return study.status;
}

function getPartnerStudyHeadline(status: StudyTimerStatus) {
  switch (status) {
    case 'running':
      return 'Studying now';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Done';
    case 'idle':
    default:
      return 'Not studying right now';
  }
}

function getPartnerStudyPillLabel(status: StudyTimerStatus) {
  switch (status) {
    case 'running':
      return 'Live';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Done';
    case 'idle':
    default:
      return 'Idle';
  }
}

function getPartnerStudyDetail(study: PartnerStudyStatusSnapshot | null, status: StudyTimerStatus, remainingSeconds: number) {
  if (!study || status === 'idle') {
    return 'No active focus timer right now.';
  }

  if (status === 'running') {
    return `${getStudyPresetLabel(study.selectedMinutes)} session in progress.`;
  }

  if (status === 'paused') {
    return `Paused with ${formatStudyCountdown(remainingSeconds)} left.`;
  }

  return study.completedAtIso
    ? `Finished ${formatPartnerTimestamp(study.completedAtIso)}.`
    : 'Session just finished.';
}

function getPartnerStudyClockValue(study: PartnerStudyStatusSnapshot | null, status: StudyTimerStatus, remainingSeconds: number) {
  if (!study || status === 'idle') {
    return '--:--';
  }

  if (status === 'completed') {
    return '00:00';
  }

  return formatStudyCountdown(remainingSeconds);
}

function getCareNudgeCopy(
  type: PartnerCareNudgeType,
  shareDoc: PartnerShareDocument | null,
  status: PartnerShareDocument['latestStatus'] | null,
) {
  const senderName = shareDoc?.partnerName?.trim() || 'Your partner';

  switch (type) {
    case 'hydration': {
      const current = status?.hydration.current ?? 0;
      const goal = status?.hydration.goal ?? 8;

      return {
        buttonLabel: 'Nudge water',
        title: `Little water reminder from ${senderName}`,
        message: `Inom ka muna ng water baby. ${current}/${goal} ka pa lang today.`,
      };
    }
    case 'meals': {
      const needsBreakfast = !!status && !status.meals.hasBreakfast;

      return {
        buttonLabel: 'Nudge meals',
        title: `Little food reminder from ${senderName}`,
        message: needsBreakfast
          ? 'Kumain ka na baby, di ka pa kumakain.'
          : 'Kain ka muna baby kapag may small break ka na.',
      };
    }
    case 'mood':
      return {
        buttonLabel: 'Nudge mood',
        title: `Little check-in from ${senderName}`,
        message: 'Baby, kamusta ka pakiramdam mo?',
      };
    case 'sleep':
    default:
      return {
        buttonLabel: 'Nudge rest',
        title: `Little rest reminder from ${senderName}`,
        message: 'Pahinga ka muna baby, wag masyado pagudin sarili',
      };
  }
}

export const PartnerView: React.FC<PartnerViewProps> = ({ shareCode, onBack, onDisconnect, onOpenSettings }) => {
  const [shareDoc, setShareDoc] = useState<PartnerShareDocument | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastSeenCheckIn, setLastSeenCheckIn] = useLocalStorage('hercare_partner_last_seen_checkin', '');
  const [toastMessage, setToastMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [sendingNudgeType, setSendingNudgeType] = useState<PartnerCareNudgeType | null>(null);
  const [nudgeFeedback, setNudgeFeedback] = useState<{
    type: PartnerCareNudgeType;
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const configured = isFirebaseConfigured();
  const status = shareDoc?.latestStatus ?? null;
  const mapsUrl = getMapsUrl(shareDoc?.latestLocation ?? null);
  const study = status?.study ?? null;
  const studyRemainingSeconds = getPartnerStudyRemainingSeconds(study, currentTime);
  const studyDisplayStatus = getPartnerStudyDisplayStatus(study, studyRemainingSeconds);

  useEffect(() => {
    if (!configured || !shareCode) {
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

        const latestCheckInAt = value?.latestCheckIn?.createdAtIso ?? '';
        const latestCheckInMessage = value?.latestCheckIn?.message ?? '';
        const ownerName = value?.ownerName || 'Your partner';

        if (latestCheckInAt) {
          if (!lastSeenCheckIn) {
            setLastSeenCheckIn(latestCheckInAt);
          } else if (latestCheckInAt !== lastSeenCheckIn) {
            setLastSeenCheckIn(latestCheckInAt);
            setToastMessage(`${ownerName}: ${latestCheckInMessage}`);

            window.setTimeout(() => {
              setToastMessage('');
            }, 5000);
          }
        }

        setShareDoc(value);
        setIsLoading(false);
        setError(value ? '' : 'This share link is no longer available.');
      },
      (caughtError) => {
        if (isCancelled) {
          return;
        }

        setError(caughtError.message);
        setIsLoading(false);
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
  }, [configured, lastSeenCheckIn, setLastSeenCheckIn, shareCode]);

  useEffect(() => {
    if (!study || study.status !== 'running' || !study.endsAtIso) {
      return;
    }

    setCurrentTime(new Date());
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [study?.endsAtIso, study?.status, study?.updatedAtIso]);

  const handleSendCareNudge = async (type: PartnerCareNudgeType) => {
    if (!shareDoc?.sharingEnabled) {
      setNudgeFeedback({
        type,
        tone: 'error',
        text: 'Her sharing is paused right now, so the nudge cannot go through.',
      });
      return;
    }

    setSendingNudgeType(type);
    setNudgeFeedback(null);

    try {
      const nudge = getCareNudgeCopy(type, shareDoc, status);
      await sendPartnerCareNudge(shareCode, {
        type,
        title: nudge.title,
        message: nudge.message,
      });
      setNudgeFeedback({
        type,
        tone: 'success',
        text: 'Specific nudge sent.',
      });
    } catch (caughtError) {
      setNudgeFeedback({
        type,
        tone: 'error',
        text: caughtError instanceof Error ? caughtError.message : 'Unable to send the nudge right now.',
      });
    } finally {
      setSendingNudgeType(null);
    }
  };

  return (
    <div className="partner-screen partner-dashboard animation-slide-in">
      {toastMessage && (
        <div className="partner-toast">
          <strong>New check-in</strong>
          <p>{toastMessage}</p>
        </div>
      )}

      <header className="page-header partner-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <div className="partner-header-copy">
          <h1>{shareDoc?.ownerName ? `${shareDoc.ownerName}'s care board` : 'Partner View'}</h1>
          <p className="subtitle">
            {shareDoc?.sharingEnabled
              ? `Last updated ${formatPartnerTimestamp(shareDoc.updatedAtIso)}`
              : 'Sharing is currently paused on her phone.'}
          </p>
        </div>
        <button className="partner-settings-btn" onClick={onOpenSettings} aria-label="Open partner settings">
          <Settings2 size={20} />
        </button>
      </header>

      {!configured ? (
        <Card className="partner-empty-card">
          <div className="partner-empty-icon">
            <HeartHandshake size={22} />
          </div>
          <h3>Firebase setup still needed</h3>
          <p>Add your Firebase web config in <strong>`.env.local`</strong>, then rebuild the app to turn this on.</p>
        </Card>
      ) : isLoading ? (
        <Card className="partner-empty-card">
          <h3>Connecting...</h3>
          <p>Pulling the latest shared care updates now.</p>
        </Card>
      ) : error ? (
        <Card className="partner-empty-card">
          <h3>Partner view needs attention</h3>
          <p>{error}</p>
        </Card>
      ) : shareDoc ? (
        <>
          <Card className="partner-hero-card" variant="primary">
            <div className="partner-hero-row">
              <div>
                <p className="partner-hero-kicker">Connected privately</p>
                <h3>{shareDoc.partnerName ? `Seen by ${shareDoc.partnerName}` : 'Partner dashboard active'}</h3>
              </div>
              <span className={`partner-status-pill ${shareDoc.sharingEnabled ? 'live' : 'paused'}`}>
                {shareDoc.sharingEnabled ? 'Live' : 'Paused'}
              </span>
            </div>
            <p className="partner-hero-code">Share code: {shareDoc.shareCode}</p>
          </Card>

          <div className="partner-grid">
            <div className="partner-grid-primary">
              <div className="partner-summary-grid">
              <Card className="partner-summary-card">
                <Droplet size={18} />
                <span>Hydration</span>
                <strong>{status ? `${status.hydration.current} / ${status.hydration.goal}` : '--'}</strong>
                <small>{status ? `Last water ${formatPartnerTimestamp(status.hydration.lastLoggedAt)}` : 'No sync yet'}</small>
                <button
                  type="button"
                  className="partner-summary-nudge-btn"
                  onClick={() => void handleSendCareNudge('hydration')}
                  disabled={!shareDoc.sharingEnabled || sendingNudgeType !== null}
                >
                  <BellRing size={14} />
                  {sendingNudgeType === 'hydration' ? 'Sending...' : getCareNudgeCopy('hydration', shareDoc, status).buttonLabel}
                </button>
                {nudgeFeedback?.type === 'hydration' && (
                  <p className={`partner-summary-feedback ${nudgeFeedback.tone}`}>{nudgeFeedback.text}</p>
                )}
              </Card>

              <Card className="partner-summary-card">
                <UtensilsCrossed size={18} />
                <span>Meals</span>
                  <strong>{status ? `${status.meals.completedCount} / ${status.meals.goalCount}` : '--'}</strong>
                  <small>
                    {status
                      ? status.meals.hasBreakfast
                        ? 'Breakfast logged today'
                        : 'Breakfast still missing today'
                      : 'No sync yet'}
                  </small>
                <button
                  type="button"
                  className="partner-summary-nudge-btn"
                  onClick={() => void handleSendCareNudge('meals')}
                  disabled={!shareDoc.sharingEnabled || sendingNudgeType !== null}
                >
                  <BellRing size={14} />
                  {sendingNudgeType === 'meals' ? 'Sending...' : getCareNudgeCopy('meals', shareDoc, status).buttonLabel}
                </button>
                {nudgeFeedback?.type === 'meals' && (
                  <p className={`partner-summary-feedback ${nudgeFeedback.tone}`}>{nudgeFeedback.text}</p>
                )}
              </Card>

              <Card className="partner-summary-card">
                <Smile size={18} />
                <span>Mood</span>
                <strong>{status?.mood.label ?? 'No mood yet'}</strong>
                <small>
                  {status?.mood.updatedAt ? `Checked ${formatPartnerTimestamp(status.mood.updatedAt)}` : 'No sync yet'}
                </small>
                <button
                  type="button"
                  className="partner-summary-nudge-btn"
                  onClick={() => void handleSendCareNudge('mood')}
                  disabled={!shareDoc.sharingEnabled || sendingNudgeType !== null}
                >
                  <BellRing size={14} />
                  {sendingNudgeType === 'mood' ? 'Sending...' : getCareNudgeCopy('mood', shareDoc, status).buttonLabel}
                </button>
                {nudgeFeedback?.type === 'mood' && (
                  <p className={`partner-summary-feedback ${nudgeFeedback.tone}`}>{nudgeFeedback.text}</p>
                )}
              </Card>

              <Card className="partner-summary-card">
                <Moon size={18} />
                <span>Sleep</span>
                <strong>{status?.sleep.durationMinutes ? formatDuration(status.sleep.durationMinutes) : 'No log'}</strong>
                <small>
                  {status ? `${status.sleep.qualityLabel} - goal ${formatTargetHours(status.sleep.targetHours)}` : 'No sync yet'}
                </small>
                <button
                  type="button"
                  className="partner-summary-nudge-btn"
                  onClick={() => void handleSendCareNudge('sleep')}
                  disabled={!shareDoc.sharingEnabled || sendingNudgeType !== null}
                >
                  <BellRing size={14} />
                  {sendingNudgeType === 'sleep' ? 'Sending...' : getCareNudgeCopy('sleep', shareDoc, status).buttonLabel}
                </button>
                {nudgeFeedback?.type === 'sleep' && (
                  <p className={`partner-summary-feedback ${nudgeFeedback.tone}`}>{nudgeFeedback.text}</p>
                )}
              </Card>
            </div>

              <Card className="partner-detail-card">
                <p className="partner-section-kicker">Shift</p>
                <h3>{status?.shift.type ?? 'No shift scheduled yet'}</h3>
                <p>{status?.shift.label ?? 'No shift has been synced yet.'}</p>
                {status?.shift.status && <p className="partner-detail-note">Status: {status.shift.status}</p>}
              </Card>

              <Card className="partner-detail-card">
                <p className="partner-section-kicker">Quick check-in</p>
                <h3>{shareDoc.latestCheckIn?.message ?? 'No little note yet'}</h3>
                <p className="partner-detail-note">
                  {shareDoc.latestCheckIn
                    ? `Sent ${formatPartnerTimestamp(shareDoc.latestCheckIn.createdAtIso)}`
                    : 'When she sends a small message, it will show up here.'}
                </p>
              </Card>
            </div>

            <div className="partner-grid-secondary">
              <Card className={`partner-detail-card partner-study-card status-${studyDisplayStatus}`}>
                <div className="partner-study-header">
                  <div>
                    <p className="partner-section-kicker">Study</p>
                    <h3>{getPartnerStudyHeadline(studyDisplayStatus)}</h3>
                  </div>
                  <span className={`partner-status-pill partner-study-pill ${studyDisplayStatus}`}>
                    {getPartnerStudyPillLabel(studyDisplayStatus)}
                  </span>
                </div>

                <div className="partner-study-body">
                  <div className="partner-study-clock">
                    <AlarmClock size={18} />
                    <strong>{getPartnerStudyClockValue(study, studyDisplayStatus, studyRemainingSeconds)}</strong>
                  </div>

                  <div className="partner-study-meta">
                    <span>
                      {study && studyDisplayStatus !== 'idle'
                        ? `${getStudyPresetLabel(study.selectedMinutes)} session`
                        : 'No active timer right now'}
                    </span>
                    <span>{study ? `Synced ${formatPartnerTimestamp(study.updatedAtIso)}` : 'No sync yet'}</span>
                  </div>
                </div>

                <p className="partner-detail-note">{getPartnerStudyDetail(study, studyDisplayStatus, studyRemainingSeconds)}</p>
              </Card>

              <Card className="partner-detail-card">
                <p className="partner-section-kicker">Location check-in</p>
                <h3>{shareDoc.latestLocation ? 'Shared current location' : 'Location not shared'}</h3>
                <p className="partner-detail-note">
                  {shareDoc.latestLocation
                    ? `Pinned ${formatPartnerTimestamp(shareDoc.latestLocation.sharedAtIso)}`
                    : 'Location only appears when she turns it on and taps Share Current Location.'}
                </p>
                {mapsUrl && (
                  <a className="partner-map-link" href={mapsUrl} target="_blank" rel="noreferrer">
                    <MapPinned size={16} />
                    Open in Maps
                  </a>
                )}
              </Card>
            </div>
          </div>

          <div className="partner-actions">
            <Button variant="outline" fullWidth onClick={onDisconnect}>
              Disconnect This Phone
            </Button>
          </div>
        </>
      ) : (
        <Card className="partner-empty-card">
          <h3>No shared data yet</h3>
          <p>Create or reconnect the share code from her phone first.</p>
        </Card>
      )}
    </div>
  );
};
