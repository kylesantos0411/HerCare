import React, { useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import { Home } from './Home';
import { HydrationScreen } from './HydrationScreen';
import { Meals } from './Meals';
import { MoodCheck } from './MoodCheck';
import { Notes } from './Notes';
import { OpenWhenScreen } from './OpenWhenScreen';
import { Study } from './Study';
import { ShiftDetails } from './ShiftDetails';
import { SleepLog } from './SleepLog';
import { Splash } from './Splash';
import { Welcome } from './Welcome';
import { Wellness } from './Wellness';
import { You } from './You';
import { isShowcaseCaptureMode, type ShowcaseScreen } from '../utils/showcase';
import { createStudyTimerState, startStudyTimer } from '../utils/study';

interface ShowcaseAppProps {
  screen: ShowcaseScreen;
}

function renderTabShell(activeTab: string, content: React.ReactNode) {
  return (
    <>
      <div className="view-container">{content}</div>
      <BottomNav activeTab={activeTab} onTabChange={() => {}} />
    </>
  );
}

export const ShowcaseApp: React.FC<ShowcaseAppProps> = ({ screen }) => {
  const showcaseStudyTimer = {
    ...startStudyTimer(createStudyTimerState(10)),
    remainingSeconds: 390,
  };

  useEffect(() => {
    const captureMode = isShowcaseCaptureMode();

    document.body.classList.toggle('showcase-capture', captureMode);
    document.body.classList.remove('night-shift-theme');

    return () => {
      document.body.classList.remove('showcase-capture');
    };
  }, []);

  switch (screen) {
    case 'splash':
      return <Splash onComplete={() => {}} />;
    case 'welcome':
      return <Welcome onNext={() => {}} onBack={() => {}} onPartnerView={() => {}} />;
    case 'home':
      return renderTabShell('home', <Home onNavigate={() => {}} studyTimer={createStudyTimerState(5)} />);
    case 'shift':
      return (
        <div className="view-container">
          <ShiftDetails onBack={() => {}} onAddShift={() => {}} onEditShift={() => {}} />
        </div>
      );
    case 'meals':
      return renderTabShell('meals', <Meals onNavigate={() => {}} />);
    case 'wellness':
      return renderTabShell('wellness', <Wellness onNavigate={() => {}} />);
    case 'hydration':
      return (
        <div className="view-container">
          <HydrationScreen onBack={() => {}} onSave={() => {}} />
        </div>
      );
    case 'sleep':
      return (
        <div className="view-container">
          <SleepLog onBack={() => {}} onSave={() => {}} />
        </div>
      );
    case 'mood':
      return (
        <div className="view-container">
          <MoodCheck onBack={() => {}} onSave={() => {}} />
        </div>
      );
    case 'notes':
      return renderTabShell('notes', <Notes onAddNote={() => {}} />);
    case 'study':
      return renderTabShell(
        'study',
        <Study
          timer={showcaseStudyTimer}
          notificationsEnabled={true}
          studyAlertsEnabled={true}
          onSelectPreset={() => {}}
          onStart={() => {}}
          onPause={() => {}}
          onReset={() => {}}
          onStartAnotherSession={() => {}}
          onTakeBreak={() => {}}
          onGoToYou={() => {}}
          onOpenSettings={() => {}}
        />,
      );
    case 'you':
      return renderTabShell('you', <You onOpenCard={() => {}} />);
    case 'open_when':
      return (
        <div className="view-container">
          <OpenWhenScreen cardId="tired" onBack={() => {}} />
        </div>
      );
    default:
      return renderTabShell('home', <Home onNavigate={() => {}} studyTimer={createStudyTimerState(5)} />);
  }
};
