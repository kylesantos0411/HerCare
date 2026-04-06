import { useEffect, useRef, useState } from 'react';
import './App.css';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Wellness } from './pages/Wellness';
import { ShiftDetails } from './pages/ShiftDetails';
import { Meals } from './pages/Meals';
import { Notes } from './pages/Notes';
import { Study } from './pages/Study';
import { You } from './pages/You';
import { Splash } from './pages/Splash';
import { Welcome } from './pages/Welcome';
import { SetupWizard } from './pages/SetupWizard';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AddMeal } from './pages/AddMeal';
import { NoteEditor } from './pages/NoteEditor';
import { SleepLog } from './pages/SleepLog';
import { HydrationScreen } from './pages/HydrationScreen';
import { MoodCheck } from './pages/MoodCheck';
import { ShiftEditor } from './pages/ShiftEditor';
import { OpenWhenScreen } from './pages/OpenWhenScreen';
import { PartnerLink } from './pages/PartnerLink';
import { PartnerSettings } from './pages/PartnerSettings';
import { PartnerSharing } from './pages/PartnerSharing';
import { PartnerView } from './pages/PartnerView';
import { useCurrentDayKey } from './hooks/useCurrentDayKey';
import { useLocalStorage } from './hooks/useLocalStorage';
import { syncLowSleepAlert, syncScheduledCareNotifications } from './utils/careNotifications';
import { getInitialMealEntries, type MealEntry } from './utils/meals';
import type { NoteCategory } from './utils/notes';
import {
  buildPartnerStatusSnapshot,
  syncPartnerStatus,
  updatePartnerPushSubscription,
} from './utils/partner';
import {
  registerPartnerPushNotifications,
  unregisterPartnerPushNotifications,
} from './utils/partnerPush';
import { getLatestSleepLog, type SleepLogEntry } from './utils/sleep';
import {
  completeStudyTimer,
  createStudyTimerState,
  getStudyRemainingSeconds,
  pauseStudyTimer,
  resetStudyTimer,
  selectStudyPreset,
  startStudyTimer,
  type StudyPresetMinutes,
  type StudyTimerState,
} from './utils/study';
import {
  clearStudyCompletionNotification,
  prepareStudySessionAlerts,
  syncStudyCompletionAlert,
  triggerStudyCompletionFeedback,
} from './utils/studyAlerts';
import type { ShiftEntry, ShiftType } from './utils/shift';
import type { HydrationEntry, MoodEntry, MoodState } from './utils/wellness';

type AppState = 'splash' | 'welcome' | 'setup' | 'login' | 'main' | 'partner_link' | 'partner_dashboard' | 'partner_settings';
type AppTab =
  | 'home'
  | 'meals'
  | 'wellness'
  | 'notes'
  | 'study'
  | 'you'
  | 'shift'
  | 'settings'
  | 'add_meal'
  | 'note_editor'
  | 'sleep_log'
  | 'hydration_screen'
  | 'mood_check'
  | 'shift_editor'
  | 'open_when'
  | 'partner_sharing';

function App() {
  const { dayKey, referenceDate } = useCurrentDayKey();
  const [hasCompletedSetup, setHasCompletedSetup] = useLocalStorage('hercare_setup_complete', false);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('hercare_logged_in', hasCompletedSetup);
  const [nightShiftEnabled, setNightShiftEnabled] = useLocalStorage('hercare_night_shift_enabled', false);
  const [notificationsEnabled] = useLocalStorage('hercare_notifications_enabled', true);
  const [studyAlertsEnabled] = useLocalStorage('hercare_study_alerts_enabled', true);
  const [hydrationRemindersEnabled] = useLocalStorage('hercare_hydration_reminders_enabled', true);
  const [name] = useLocalStorage('hercare_user_name', 'Love');
  const [partnerShareCode] = useLocalStorage('hercare_partner_share_code', '');
  const [partnerSharingEnabled] = useLocalStorage('hercare_partner_sharing_enabled', false);
  const [partnerViewerEnabled, setPartnerViewerEnabled] = useLocalStorage('hercare_partner_view_enabled', false);
  const [partnerViewCode, setPartnerViewCode] = useLocalStorage('hercare_partner_view_code', '');
  const [partnerDarkModeEnabled, setPartnerDarkModeEnabled] = useLocalStorage('hercare_partner_dark_mode_enabled', true);
  const [partnerAlertsEnabled] = useLocalStorage('hercare_partner_checkin_alerts_enabled', true);
  const [, setPartnerPushStatus] = useLocalStorage(
    'hercare_partner_push_status',
    'Push alerts will be ready after this phone connects.',
  );
  const [partnerPushShareCode, setPartnerPushShareCode] = useLocalStorage('hercare_partner_push_share_code', '');
  const [shiftPreference] = useLocalStorage<ShiftType>('hercare_shift_preference', 'Night Duty');
  const [waterGoal] = useLocalStorage('hercare_water_target', 8);
  const [storedGlasses] = useLocalStorage('hercare_hydration_count', 0);
  const [hydrationHistory] = useLocalStorage<HydrationEntry[]>('hercare_hydration_history', []);
  const [currentMood] = useLocalStorage<MoodState>('hercare_mood', 'good');
  const [moodEntries] = useLocalStorage<MoodEntry[]>('hercare_mood_entries', []);
  const [mealEntries] = useLocalStorage<MealEntry[]>('hercare_meal_entries', getInitialMealEntries());
  const [sleepLogs] = useLocalStorage<SleepLogEntry[]>('hercare_sleep_logs', []);
  const [sleepTargetHours] = useLocalStorage('hercare_sleep_target_hours', 7.5);
  const [scheduledShifts] = useLocalStorage<ShiftEntry[]>('hercare_scheduled_shifts', []);
  const [studyTimer, setStudyTimer] = useLocalStorage<StudyTimerState>('hercare_study_timer', createStudyTimerState());
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );
  const [appState, setAppState] = useState<AppState>(
    partnerViewerEnabled && partnerViewCode ? 'partner_dashboard' : hasCompletedSetup ? (isLoggedIn ? 'main' : 'login') : 'splash',
  );
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [selectedOpenWhenId, setSelectedOpenWhenId] = useState<string | null>(null);
  const [noteEditorCategory, setNoteEditorCategory] = useState<NoteCategory | null>(null);
  const lastHandledStudyCompletionAtRef = useRef(studyTimer.completedAt);
  const latestSleepLog = getLatestSleepLog(sleepLogs);
  const studyAlertsAllowed = notificationsEnabled && studyAlertsEnabled;

  useEffect(() => {
    const isPartnerFlow =
      appState === 'partner_link' || appState === 'partner_dashboard' || appState === 'partner_settings';
    const shouldUseDarkTheme = isPartnerFlow ? partnerDarkModeEnabled : nightShiftEnabled;

    document.body.classList.toggle('night-shift-theme', shouldUseDarkTheme);

    return () => {
      document.body.classList.remove('night-shift-theme');
    };
  }, [appState, nightShiftEnabled, partnerDarkModeEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(typeof document === 'undefined' || document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (studyTimer.status !== 'running' || !studyTimer.endsAt) {
      return;
    }

    const syncStudyTimer = () => {
      setStudyTimer((currentTimer) => {
        if (currentTimer.status !== 'running' || !currentTimer.endsAt) {
          return currentTimer;
        }

        const nextRemainingSeconds = getStudyRemainingSeconds(currentTimer.endsAt);

        if (nextRemainingSeconds <= 0) {
          return completeStudyTimer(currentTimer);
        }

        if (nextRemainingSeconds === currentTimer.remainingSeconds) {
          return currentTimer;
        }

        return {
          ...currentTimer,
          remainingSeconds: nextRemainingSeconds,
        };
      });
    };

    syncStudyTimer();
    const intervalId = window.setInterval(syncStudyTimer, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [studyTimer.endsAt, studyTimer.status]);

  useEffect(() => {
    if (appState !== 'main') {
      void clearStudyCompletionNotification();
      return;
    }

    void syncStudyCompletionAlert({
      notificationsEnabled: studyAlertsAllowed,
      timer: studyTimer,
      isDocumentVisible,
    });
  }, [appState, isDocumentVisible, studyAlertsAllowed, studyTimer.endsAt, studyTimer.status]);

  useEffect(() => {
    if (studyTimer.status !== 'completed' || !studyTimer.completedAt) {
      lastHandledStudyCompletionAtRef.current = studyTimer.completedAt;
      return;
    }

    if (lastHandledStudyCompletionAtRef.current === studyTimer.completedAt) {
      return;
    }

    lastHandledStudyCompletionAtRef.current = studyTimer.completedAt;
    void clearStudyCompletionNotification();

    if (isDocumentVisible) {
      void triggerStudyCompletionFeedback(studyAlertsAllowed);
    }
  }, [isDocumentVisible, studyAlertsAllowed, studyTimer.completedAt, studyTimer.status]);

  useEffect(() => {
    if (appState !== 'main') {
      return;
    }

    void syncScheduledCareNotifications({
      notificationsEnabled,
      hydrationRemindersEnabled,
      shiftPreference,
      waterGoal,
      hydrationEntries: hydrationHistory,
      mealEntries,
      referenceDate,
    });
  }, [
    appState,
    dayKey,
    hydrationHistory,
    hydrationRemindersEnabled,
    mealEntries,
    notificationsEnabled,
    referenceDate,
    shiftPreference,
    waterGoal,
  ]);

  useEffect(() => {
    if (appState !== 'main') {
      return;
    }

    void syncLowSleepAlert({
      notificationsEnabled,
      latestSleepLog,
      sleepTargetHours,
    });
  }, [appState, latestSleepLog, notificationsEnabled, sleepTargetHours]);

  useEffect(() => {
    if (appState !== 'main' || !partnerSharingEnabled || !partnerShareCode) {
      return;
    }

    let isCancelled = false;

    const pushPartnerSnapshot = async () => {
      const snapshot = buildPartnerStatusSnapshot({
        dayKey,
        referenceDate,
        waterGoal,
        hydrationEntries: hydrationHistory,
        legacyHydrationCount: storedGlasses,
        moodEntries,
        currentMood,
      sleepLogs,
      sleepTargetHours,
      mealEntries,
      shifts: scheduledShifts,
      studyTimer,
    });

      try {
        await syncPartnerStatus({
          shareCode: partnerShareCode,
          ownerName: name,
          sharingEnabled: partnerSharingEnabled,
          snapshot,
        });
      } catch {
        if (isCancelled) {
          return;
        }
      }
    };

    const intervalId = window.setInterval(() => {
      void pushPartnerSnapshot();
    }, 4000);

    const handleVisibilityRefresh = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        void pushPartnerSnapshot();
      }
    };

    window.addEventListener('focus', handleVisibilityRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    void pushPartnerSnapshot();

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [
    appState,
    currentMood,
    dayKey,
    hydrationHistory,
    mealEntries,
    moodEntries,
    name,
    partnerShareCode,
    partnerSharingEnabled,
    referenceDate,
    scheduledShifts,
    sleepLogs,
    sleepTargetHours,
    studyTimer.completedAt,
    studyTimer.endsAt,
    studyTimer.selectedMinutes,
    studyTimer.status,
    studyTimer.totalSeconds,
    storedGlasses,
    waterGoal,
  ]);

  useEffect(() => {
    let isCancelled = false;

    const clearPartnerPush = async (shareCode: string) => {
      if (!shareCode) {
        return;
      }

      try {
        await updatePartnerPushSubscription({
          shareCode,
          pushToken: null,
          alertsEnabled: false,
        });
      } catch {
        // Best-effort cleanup only.
      }
    };

    const syncPartnerPush = async () => {
      if (!partnerViewerEnabled || !partnerViewCode) {
        await clearPartnerPush(partnerPushShareCode);

        try {
          await unregisterPartnerPushNotifications();
        } catch {
          // Ignore local unregister issues while disconnecting.
        }

        if (!isCancelled) {
          setPartnerPushShareCode('');
          setPartnerPushStatus('Push alerts are off on this phone until a partner code is connected.');
        }

        return;
      }

      if (!partnerAlertsEnabled) {
        await clearPartnerPush(partnerPushShareCode || partnerViewCode);

        try {
          await unregisterPartnerPushNotifications();
        } catch {
          // Ignore local unregister issues while alerts are paused.
        }

        if (!isCancelled) {
          setPartnerPushShareCode('');
          setPartnerPushStatus('Push alerts are paused on this phone.');
        }

        return;
      }

      try {
        const pushToken = await registerPartnerPushNotifications();

        if (isCancelled) {
          return;
        }

        if (!pushToken) {
          setPartnerPushStatus('Push alerts work only inside the Android app.');
          return;
        }

        if (partnerPushShareCode && partnerPushShareCode !== partnerViewCode) {
          await clearPartnerPush(partnerPushShareCode);

          if (isCancelled) {
            return;
          }
        }

        await updatePartnerPushSubscription({
          shareCode: partnerViewCode,
          pushToken,
          alertsEnabled: true,
        });

        if (isCancelled) {
          return;
        }

        setPartnerPushShareCode(partnerViewCode);
        setPartnerPushStatus('Background push alerts are ready on this phone.');
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setPartnerPushStatus(
          caughtError instanceof Error ? caughtError.message : 'Unable to prepare push alerts on this phone.',
        );
      }
    };

    void syncPartnerPush();

    return () => {
      isCancelled = true;
    };
  }, [
    partnerAlertsEnabled,
    partnerPushShareCode,
    partnerViewCode,
    partnerViewerEnabled,
    setPartnerPushShareCode,
    setPartnerPushStatus,
  ]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AppTab);
  };

  const openShiftEditor = (shiftId: string | null) => {
    setEditingShiftId(shiftId);
    setActiveTab('shift_editor');
  };

  const openOpenWhenCard = (cardId: string) => {
    setSelectedOpenWhenId(cardId);
    setActiveTab('open_when');
  };

  const handleSelectStudyPreset = (minutes: StudyPresetMinutes) => {
    setStudyTimer((currentTimer) => selectStudyPreset(currentTimer, minutes));
  };

  const handleStartStudyTimer = () => {
    void prepareStudySessionAlerts(studyAlertsAllowed);
    setStudyTimer((currentTimer) => startStudyTimer(currentTimer));
  };

  const handlePauseStudyTimer = () => {
    setStudyTimer((currentTimer) => pauseStudyTimer(currentTimer));
  };

  const handleResetStudyTimer = () => {
    setStudyTimer((currentTimer) => resetStudyTimer(currentTimer));
  };

  const handleStartAnotherStudySession = () => {
    void prepareStudySessionAlerts(studyAlertsAllowed);
    setStudyTimer((currentTimer) => startStudyTimer(resetStudyTimer(currentTimer)));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={handleTabChange} studyTimer={studyTimer} />;
      case 'meals':
        return <Meals onNavigate={handleTabChange} />;
      case 'wellness':
        return <Wellness onNavigate={handleTabChange} />;
      case 'notes':
        return (
          <Notes
            onAddNote={(category) => {
              setNoteEditorCategory(category ?? null);
              setActiveTab('note_editor');
            }}
          />
        );
      case 'study':
        return (
          <Study
            timer={studyTimer}
            notificationsEnabled={notificationsEnabled}
            studyAlertsEnabled={studyAlertsEnabled}
            onSelectPreset={handleSelectStudyPreset}
            onStart={handleStartStudyTimer}
            onPause={handlePauseStudyTimer}
            onReset={handleResetStudyTimer}
            onStartAnotherSession={handleStartAnotherStudySession}
            onTakeBreak={() => {
              handleResetStudyTimer();
              setActiveTab('home');
            }}
            onGoToYou={() => setActiveTab('you')}
            onOpenSettings={() => setActiveTab('settings')}
          />
        );
      case 'you':
        return <You onOpenCard={openOpenWhenCard} />;
      case 'open_when':
        return <OpenWhenScreen cardId={selectedOpenWhenId} onBack={() => setActiveTab('you')} />;
      case 'shift':
        return (
          <ShiftDetails
            onBack={() => setActiveTab('home')}
            onAddShift={() => openShiftEditor(null)}
            onEditShift={(shiftId) => openShiftEditor(shiftId)}
          />
        );
      case 'settings':
        return (
          <Settings
            onBack={() => setActiveTab('home')}
            onOpenPartnerSharing={() => setActiveTab('partner_sharing')}
            nightShiftEnabled={nightShiftEnabled}
            onNightShiftChange={setNightShiftEnabled}
            onLogout={() => {
              setIsLoggedIn(false);
              setActiveTab('home');
              setAppState('login');
            }}
          />
        );
      case 'add_meal':
        return <AddMeal onBack={() => setActiveTab('meals')} onSave={() => setActiveTab('meals')} />;
      case 'note_editor':
        return (
          <NoteEditor
            initialCategory={noteEditorCategory}
            onBack={() => setActiveTab('notes')}
            onSave={() => setActiveTab('notes')}
          />
        );
      case 'sleep_log':
        return <SleepLog onBack={() => setActiveTab('wellness')} onSave={() => setActiveTab('wellness')} />;
      case 'hydration_screen':
        return (
          <HydrationScreen
            onBack={() => setActiveTab('wellness')}
            onSave={() => setActiveTab('wellness')}
          />
        );
      case 'mood_check':
        return <MoodCheck onBack={() => setActiveTab('wellness')} onSave={() => setActiveTab('wellness')} />;
      case 'shift_editor':
        return (
          <ShiftEditor
            shiftId={editingShiftId}
            onBack={() => setActiveTab('shift')}
            onSave={() => setActiveTab('shift')}
          />
        );
      case 'partner_sharing':
        return <PartnerSharing onBack={() => setActiveTab('settings')} />;
      default:
        return <Home onNavigate={handleTabChange} studyTimer={studyTimer} />;
    }
  };

  if (appState === 'splash') {
    return (
      <Splash
        onComplete={() => setAppState(partnerViewerEnabled && partnerViewCode ? 'partner_dashboard' : 'welcome')}
      />
    );
  }

  if (appState === 'welcome') {
    return (
      <Welcome
        onNext={() => setAppState('setup')}
        onBack={() => setAppState('splash')}
        onPartnerView={() => setAppState(partnerViewCode ? 'partner_dashboard' : 'partner_link')}
      />
    );
  }

  if (appState === 'setup') {
    return (
      <SetupWizard
        onComplete={() => {
          setHasCompletedSetup(true);
          setIsLoggedIn(true);
          setAppState('main');
        }}
      />
    );
  }

  if (appState === 'login') {
    return (
      <Login
        onLogin={() => {
          setHasCompletedSetup(true);
          setIsLoggedIn(true);
          setAppState('main');
        }}
        onCreateAccount={() => setAppState('setup')}
      />
    );
  }

  if (appState === 'partner_link') {
    return (
      <div className="view-container">
        <PartnerLink
          onBack={() => setAppState('welcome')}
          onConnected={(shareCode) => {
            setPartnerViewerEnabled(true);
            setPartnerViewCode(shareCode);
            setAppState('partner_dashboard');
          }}
        />
      </div>
    );
  }

  if (appState === 'partner_dashboard') {
    return (
      <div className="view-container">
        <PartnerView
          shareCode={partnerViewCode}
          onBack={() => setAppState('welcome')}
          onOpenSettings={() => setAppState('partner_settings')}
          onDisconnect={() => {
            setPartnerViewerEnabled(false);
            setPartnerViewCode('');
            setAppState('welcome');
          }}
        />
      </div>
    );
  }

  if (appState === 'partner_settings') {
    return (
      <div className="view-container">
        <PartnerSettings
          shareCode={partnerViewCode}
          darkModeEnabled={partnerDarkModeEnabled}
          onDarkModeChange={setPartnerDarkModeEnabled}
          onBack={() => setAppState('partner_dashboard')}
          onDisconnect={() => {
            setPartnerViewerEnabled(false);
            setPartnerViewCode('');
            setAppState('welcome');
          }}
        />
      </div>
    );
  }

  const hideBottomNav = activeTab === 'shift' || activeTab === 'shift_editor' || activeTab === 'partner_sharing';

  return (
    <>
      <div className="view-container">{renderContent()}</div>

      {!hideBottomNav && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </>
  );
}

export default App;
