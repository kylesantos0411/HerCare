import { useEffect, useMemo, useState } from 'react';
import {
  AlarmClock,
  Bell,
  BellRing,
  BookOpen,
  Check,
  ChevronRight,
  Droplets,
  GraduationCap,
  HeartPulse,
  House,
  Link2,
  MoonStar,
  NotebookPen,
  Pause,
  Play,
  Plus,
  Settings2,
  Sparkles,
  Stethoscope,
  SunMedium,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import './App.css';
import { useLocalStorage } from './hooks/useLocalStorage';

type Stage = 'splash' | 'welcome' | 'profession' | 'profile' | 'goals' | 'notifications' | 'app';
type Profession = 'nurse' | 'teacher' | 'engineer';
type Tab = 'home' | 'profession' | 'wellness' | 'notes' | 'you';
type ThemeMode = 'light' | 'dark';
type MoodType = 'energized' | 'steady' | 'tired' | 'overloaded';
type SleepQuality = 'rough' | 'okay' | 'good';
type MoodCheckFrequency = 'Once a day' | 'Twice a day' | 'Only when needed';
type NoteCategory = 'General' | 'Work' | 'Personal' | 'Reminder';
type ModalView = null | 'focus' | 'settings' | 'note';

interface TamarProfile {
  name: string;
  greeting: string;
  age: string;
  profession: Profession;
}

interface TamarGoals {
  hydration: number;
  sleep: number;
  moodCheckFrequency: MoodCheckFrequency;
}

interface TamarNotificationPrefs {
  hydration: boolean;
  meals: boolean;
  sleep: boolean;
  work: boolean;
  encouragement: boolean;
}

interface TamarMoodLog {
  mood: MoodType;
  energy: number;
  stress: number;
  notes: string;
  loggedAt: string;
}

interface TamarSleepLog {
  hours: number;
  quality: SleepQuality;
  start: string;
  end: string;
  loggedAt: string;
}

interface TamarNote {
  id: string;
  category: NoteCategory;
  title: string;
  body: string;
  updatedAt: string;
}

interface TamarLinkState {
  code: string;
  buddyName: string;
  connected: boolean;
  nudgesSent: number;
}

interface TamarFocusState {
  presetMinutes: number;
  customMinutes: string;
  status: 'idle' | 'running' | 'paused' | 'done';
  remainingSeconds: number;
  endAt: number | null;
  sessionsToday: number;
  trackedDay: string;
}

interface TrendPoint {
  label: string;
  value: number;
}

interface ProfessionCard {
  kicker: string;
  title: string;
  detail: string;
  meta: string;
}

const APP_VERSION = '0.9.0';
const BRAND_TAGLINE = 'Para sa mga nagtatrabaho ng buong puso.';
const FOCUS_PRESETS = [25, 30, 60, 90, 120];
const NOTE_CATEGORIES: NoteCategory[] = ['General', 'Work', 'Personal', 'Reminder'];

const PROFESSION_META: Record<
  Profession,
  {
    label: string;
    tabLabel: string;
    badge: string;
    primary: string;
    tint: string;
    icon: LucideIcon;
    dashboardKicker: string;
    description: string;
    professionStatus: string;
    heroMetric: string;
    heroMeta: string;
  }
> = {
  nurse: {
    label: 'Nurse',
    tabLabel: 'Duty Hub',
    badge: 'Clinical',
    primary: '#2ab5a0',
    tint: '#dff8f5',
    icon: Stethoscope,
    dashboardKicker: 'Today on duty',
    description: 'Stable, quick, and built for handover-heavy days.',
    professionStatus: 'Shift starts 7:00 PM',
    heroMetric: 'Ward 3B',
    heroMeta: 'Night duty with meds round at 9:30 PM',
  },
  teacher: {
    label: 'Teacher',
    tabLabel: 'Class',
    badge: 'Classroom',
    primary: '#e8a838',
    tint: '#fff2d2',
    icon: GraduationCap,
    dashboardKicker: 'Today in class',
    description: 'Warm structure for schedules, lessons, and student flow.',
    professionStatus: 'First class at 8:00 AM',
    heroMetric: 'Grade 8 Science',
    heroMeta: 'Lesson plan ready with lab materials checked',
  },
  engineer: {
    label: 'Engineer',
    tabLabel: 'Sprint',
    badge: 'Project',
    primary: '#2c5f8a',
    tint: '#dfebf8',
    icon: Wrench,
    dashboardKicker: 'Today in sprint',
    description: 'Clear task pressure, deadlines, and on-site notes in one place.',
    professionStatus: 'Standup at 9:15 AM',
    heroMetric: 'Retrofit Package A',
    heroMeta: 'Four tasks active and one site visit this afternoon',
  },
};

const DEFAULT_PROFILE: TamarProfile = {
  name: '',
  greeting: 'Kaibigan',
  age: '',
  profession: 'nurse',
};

const DEFAULT_GOALS: TamarGoals = {
  hydration: 8,
  sleep: 7.5,
  moodCheckFrequency: 'Twice a day',
};

const DEFAULT_NOTIFICATIONS: TamarNotificationPrefs = {
  hydration: true,
  meals: true,
  sleep: true,
  work: true,
  encouragement: true,
};

const DEFAULT_LINK_STATE: TamarLinkState = {
  code: '',
  buddyName: 'Buddy',
  connected: false,
  nudgesSent: 0,
};

const DEFAULT_NOTES: TamarNote[] = [
  {
    id: 'note-1',
    category: 'Work',
    title: 'Top three for today',
    body: 'Protect the first big task, keep one check-in slot open, and leave a clean handoff.',
    updatedAt: 'Today, 7:15 AM',
  },
  {
    id: 'note-2',
    category: 'Personal',
    title: 'Reset list',
    body: 'Water. Breathe. Stretch shoulders. Reply to one person only after dinner.',
    updatedAt: 'Yesterday, 9:40 PM',
  },
];

const OPEN_WHEN_CARDS = [
  {
    id: 'ow-1',
    title: 'you feel behind',
    message: 'The day can still count even if it started messy. Pick the next useful thing and let that be enough.',
  },
  {
    id: 'ow-2',
    title: 'you want to quit early',
    message: 'Rest is allowed. Giving up and protecting your energy are not the same thing. Check the next smallest win.',
  },
  {
    id: 'ow-3',
    title: 'you need a reminder',
    message: 'You are not a machine. Progress still counts when it is gentle, slow, and unfinished.',
  },
];

const MOOD_META: Record<MoodType, { label: string; emoji: string }> = {
  energized: { label: 'Energized', emoji: ':-)' },
  steady: { label: 'Steady', emoji: ':|' },
  tired: { label: 'Tired', emoji: ':-/' },
  overloaded: { label: 'Overloaded', emoji: ':-(' },
};

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function createDefaultFocusState(referenceDate = new Date()): TamarFocusState {
  return {
    presetMinutes: 25,
    customMinutes: '45',
    status: 'idle',
    remainingSeconds: 25 * 60,
    endAt: null,
    sessionsToday: 0,
    trackedDay: getTodayKey(referenceDate),
  };
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatRelativeTimeStamp(date = new Date()) {
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createShareCode() {
  return Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(6, '7');
}

function toSentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Magandang umaga';
  if (hour < 18) return 'Magandang hapon';
  return 'Magandang gabi';
}

function getEncouragement(mood: TamarMoodLog | null, profession: Profession) {
  if (mood?.mood === 'overloaded') {
    return 'Mabigat today, pero hindi mo kailangan ayusin lahat sabay-sabay. One clean next step lang.';
  }
  if (mood?.mood === 'tired') {
    return 'Pagod is real. Keep the rhythm small and protected so the day does not eat the whole week.';
  }
  if (profession === 'nurse') {
    return 'You do not need a perfect shift to call today meaningful. Safe care and a clear handover already count.';
  }
  if (profession === 'teacher') {
    return 'A calm classroom is built in tiny repeats. One clear instruction can reset the whole room.';
  }
  return 'Steady engineering wins are quiet. Close one high-leverage task and let momentum do the rest.';
}

function getHydrationTrend(todayCount: number, goal: number): TrendPoint[] {
  const offsets = [-2, -1, 1, -2, 0, -1, 0];
  return offsets.map((offset, index) => ({
    label: formatShortDate(new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)),
    value: clamp(index === offsets.length - 1 ? todayCount : goal + offset, 2, goal + 2),
  }));
}

function getSleepTrend(todayHours: number, goal: number): TrendPoint[] {
  const base = [6.2, 7.1, 5.8, 7.8, 6.9, 7.3, todayHours];
  return base.map((value, index) => ({
    label: formatShortDate(new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)),
    value: clamp(value, 4.5, Math.max(goal + 1.5, 8)),
  }));
}

function getMoodTrend(todayMood: MoodType): TrendPoint[] {
  const moodValues: Record<MoodType, number> = { energized: 4, steady: 3, tired: 2, overloaded: 1 };
  const base = [3, 4, 2, 3, 4, 3, moodValues[todayMood]];
  return base.map((value, index) => ({
    label: formatShortDate(new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)),
    value,
  }));
}

function getProfessionCards(profession: Profession): ProfessionCard[] {
  if (profession === 'nurse') {
    return [
      {
        kicker: 'Shift Planner',
        title: 'Night duty blueprint',
        detail: 'Three scheduled shifts this week with a protected rest block after Wednesday.',
        meta: 'Next: Wed, 7:00 PM to 7:00 AM',
      },
      {
        kicker: 'Handover Notes',
        title: 'Patient endorsements',
        detail: 'Room 308 due for repeat vitals, Room 311 waiting on follow-up order, Room 315 discharge watch.',
        meta: 'Updated 20 minutes ago',
      },
      {
        kicker: 'Med Reminders',
        title: 'Meds round',
        detail: 'Cefuroxime 9:30 PM, insulin check 10:00 PM, fluid balance review 11:00 PM.',
        meta: 'Three reminders tonight',
      },
    ];
  }

  if (profession === 'teacher') {
    return [
      {
        kicker: 'Class Schedule',
        title: 'Six periods today',
        detail: 'Science 8A, 8B, and remedial review before the parent conference block.',
        meta: 'Room 204 opens at 7:40 AM',
      },
      {
        kicker: 'Lesson Plans',
        title: 'Active lesson',
        detail: 'Objective: compare renewable and non-renewable sources using a quick station rotation.',
        meta: 'Materials already checked',
      },
      {
        kicker: 'Attendance and Grades',
        title: 'Quick log',
        detail: 'Two absences to follow up, quiz stack ready for short-form grading after lunch.',
        meta: 'Class 8B attendance still open',
      },
    ];
  }

  return [
    {
      kicker: 'Sprint Board',
      title: 'Retrofit Package A',
      detail: 'Permit pack, concrete check, and procurement follow-up remain the highest leverage moves.',
      meta: 'Sprint progress at 68%',
    },
    {
      kicker: 'Deadline Alerts',
      title: 'Upcoming submissions',
      detail: 'Shop drawings due tomorrow, safety review Friday, and client update before end of week.',
      meta: 'Three deadlines in 72 hours',
    },
    {
      kicker: 'Quick Notes',
      title: 'Field scratch pad',
      detail: 'Verify rebar spacing at south wall and confirm revised site dimensions before sign-off.',
      meta: 'Pinned from site visit',
    },
  ];
}

function getProfessionChecklist(profession: Profession) {
  if (profession === 'nurse') return ['Open Shift Planner', 'Review Handover Notes', 'Check Med Reminders', 'Ping Duty Buddy'];
  if (profession === 'teacher') return ['Open Class Schedule', 'Review Lesson Plan', 'Mark Attendance', 'Log Quick Grades'];
  return ['Open Kanban Board', 'Review Top Task', 'Check Deadline Alerts', 'Capture Site Note'];
}

function SignalRow({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="signal-row">
      <div className="signal-labels">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="signal-track">
        <div className="signal-fill" style={{ width: `${clamp(progress, 0.08, 1) * 100}%` }}></div>
      </div>
    </div>
  );
}

function TrendChart({ data, maxValue, suffix }: { data: TrendPoint[]; maxValue: number; suffix: string }) {
  return (
    <div className="trend-chart">
      {data.map((point) => (
        <div key={point.label} className="trend-column">
          <div className="trend-bar-shell">
            <div className="trend-bar" style={{ height: `${(point.value / maxValue) * 100}%` }}></div>
          </div>
          <strong>
            {point.value % 1 !== 0 ? point.value.toFixed(1) : point.value}
            {suffix}
          </strong>
          <span>{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function KanbanColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="kanban-column">
      <div className="kanban-header">
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      <div className="kanban-items">
        {items.map((item) => (
          <div key={item} className="kanban-item">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeScreen({
  profile,
  goals,
  hydrationCount,
  latestSleep,
  latestMood,
  focus,
  linkState,
  currentDate,
  onOpenFocus,
  onOpenSettings,
}: {
  profile: TamarProfile;
  goals: TamarGoals;
  hydrationCount: number;
  latestSleep: TamarSleepLog | null;
  latestMood: TamarMoodLog | null;
  focus: TamarFocusState;
  linkState: TamarLinkState;
  currentDate: Date;
  onOpenFocus: () => void;
  onOpenSettings: () => void;
}) {
  const professionMeta = PROFESSION_META[profile.profession];
  const ProfessionIcon = professionMeta.icon;
  const sleepLabel = latestSleep ? `${latestSleep.hours.toFixed(1)}h ${toSentenceCase(latestSleep.quality)}` : `${goals.sleep}h target`;
  const moodLabel = latestMood ? MOOD_META[latestMood.mood].label : 'Steady';
  const focusStatus =
    focus.status === 'running'
      ? `${formatTimer(focus.remainingSeconds)} left`
      : focus.status === 'paused'
        ? `${formatTimer(focus.remainingSeconds)} paused`
        : focus.status === 'done'
          ? 'Session complete'
          : `${focus.presetMinutes}m ready`;

  return (
    <div className="screen-stack">
      <section className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow-row">
              <span className="brand-pill">Tamar</span>
              <span className="brand-subpill">{professionMeta.badge}</span>
            </div>
            <p className="hero-kicker">
              {getGreeting(currentDate)}{profile.greeting ? `, ${profile.greeting}` : ''}.
            </p>
            <h1>{profile.name ? `${profile.name}, stay grounded today.` : 'Your workday, held together.'}</h1>
            <p className="hero-description">
              {formatDisplayDate(currentDate)}. A warm, profession-aware dashboard that keeps focus, wellness, and
              your next useful move visible.
            </p>
          </div>

          <button type="button" className="hero-settings" onClick={onOpenSettings} aria-label="Open settings">
            <Settings2 size={18} />
          </button>

          <div className="hero-card hero-card-summary">
            <div className="mini-label">{professionMeta.dashboardKicker}</div>
            <div className="hero-metric-row">
              <div>
                <strong>{professionMeta.heroMetric}</strong>
                <p>{professionMeta.heroMeta}</p>
              </div>
              <div className="icon-badge" style={{ backgroundColor: professionMeta.tint, color: professionMeta.primary }}>
                <ProfessionIcon size={20} />
              </div>
            </div>
          </div>

          <div className="hero-card hero-card-link">
            <div className="mini-label">Tamar Link</div>
            <strong>{linkState.connected ? `${linkState.buddyName} connected` : 'Solo mode active'}</strong>
            <p>
              {linkState.connected
                ? `${linkState.nudgesSent} nudges sent today. Buddy can see wellness and focus status.`
                : 'Generate a share code when you want someone to see your rhythm, not your whole day.'}
            </p>
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel-card panel-card-wide">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Today&apos;s summary</p>
              <h2>{professionMeta.professionStatus}</h2>
            </div>
            <span className="panel-chip">{professionMeta.label}</span>
          </div>
          <p className="summary-copy">{professionMeta.description}</p>
          <div className="summary-rail">
            <div className="summary-stat">
              <span>Hydration</span>
              <strong>
                {hydrationCount}/{goals.hydration}
              </strong>
            </div>
            <div className="summary-stat">
              <span>Sleep</span>
              <strong>{sleepLabel}</strong>
            </div>
            <div className="summary-stat">
              <span>Mood</span>
              <strong>{moodLabel}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Wellness snapshot</p>
              <h2>Signals that matter</h2>
            </div>
          </div>
          <div className="signal-stack">
            <SignalRow label="Hydration" value={`${hydrationCount}/${goals.hydration}`} progress={hydrationCount / goals.hydration} />
            <SignalRow label="Sleep" value={sleepLabel} progress={(latestSleep?.hours ?? goals.sleep) / goals.sleep} />
            <SignalRow label="Mood" value={moodLabel} progress={((latestMood?.energy ?? 3) + (6 - (latestMood?.stress ?? 3))) / 10} />
          </div>
        </article>

        <article className="panel-card panel-card-focus">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Quick focus</p>
              <h2>Flexible Pomodoro</h2>
            </div>
            <AlarmClock size={18} />
          </div>
          <p className="focus-state-copy">{focusStatus}</p>
          <div className="focus-state-line">
            <span>{focus.sessionsToday} sessions today</span>
            <span>{focus.presetMinutes}m preset</span>
          </div>
          <button type="button" className="primary-action" onClick={onOpenFocus}>
            {focus.status === 'running' || focus.status === 'paused' ? 'Return to timer' : 'Launch focus'}
          </button>
        </article>

        <article className="panel-card panel-card-encouragement">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Daily encouragement</p>
              <h2>Taglish check-in</h2>
            </div>
            <Sparkles size={18} />
          </div>
          <p className="encouragement-copy">{getEncouragement(latestMood, profile.profession)}</p>
        </article>
      </section>
    </div>
  );
}

function ProfessionScreen({ profession }: { profession: Profession }) {
  const meta = PROFESSION_META[profession];
  const Icon = meta.icon;
  const cards = getProfessionCards(profession);
  const checklist = getProfessionChecklist(profession);

  return (
    <div className="screen-stack">
      <section className="section-header-block">
        <div>
          <p className="section-kicker">{meta.label} workspace</p>
          <h1>{meta.tabLabel}</h1>
          <p className="section-description">
            The middle tab changes with the profession, so the work layer stays close to the daily core.
          </p>
        </div>
        <div className="section-header-badge" style={{ backgroundColor: meta.tint, color: meta.primary }}>
          <Icon size={22} />
        </div>
      </section>

      <section className="profession-layout">
        <article className="panel-card profession-main-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Priority lane</p>
              <h2>{cards[0].title}</h2>
            </div>
            <span className="panel-chip">{meta.label}</span>
          </div>
          <p className="summary-copy">{cards[0].detail}</p>
          <div className="profession-meta-strip">
            <span>{cards[0].meta}</span>
            <button type="button" className="text-action">
              Open full board
            </button>
          </div>
        </article>

        <article className="panel-card profession-list-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Toolkit</p>
              <h2>What is ready next</h2>
            </div>
          </div>
          <div className="profession-checklist">
            {checklist.map((item) => (
              <div key={item} className="checklist-row">
                <span className="checklist-icon">
                  <Check size={14} />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        {cards.slice(1).map((card) => (
          <article key={card.title} className="panel-card profession-detail-card">
            <p className="section-kicker">{card.kicker}</p>
            <h2>{card.title}</h2>
            <p className="summary-copy">{card.detail}</p>
            <div className="detail-footer">
              <span>{card.meta}</span>
              <ChevronRight size={16} />
            </div>
          </article>
        ))}

        {profession === 'engineer' && (
          <article className="panel-card kanban-card">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Kanban preview</p>
                <h2>Work Sprint Board</h2>
              </div>
            </div>
            <div className="kanban-preview">
              <KanbanColumn title="To Do" items={['Issue RFI for steel detail', 'Update material tracker']} />
              <KanbanColumn title="In Progress" items={['Finalize slab repair sequence', 'Review vendor quotation']} />
              <KanbanColumn title="Done" items={['Daily standup notes', 'Safety checklist']} />
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

function WellnessScreen({
  goals,
  hydrationCount,
  onAddHydration,
  latestSleep,
  sleepDraft,
  onSleepDraftChange,
  onSaveSleep,
  latestMood,
  moodDraft,
  onMoodDraftChange,
  onSaveMood,
}: {
  goals: TamarGoals;
  hydrationCount: number;
  onAddHydration: (amount: number) => void;
  latestSleep: TamarSleepLog | null;
  sleepDraft: TamarSleepLog;
  onSleepDraftChange: (draft: TamarSleepLog) => void;
  onSaveSleep: () => void;
  latestMood: TamarMoodLog | null;
  moodDraft: TamarMoodLog;
  onMoodDraftChange: (draft: TamarMoodLog) => void;
  onSaveMood: () => void;
}) {
  const hydrationTrend = getHydrationTrend(hydrationCount, goals.hydration);
  const sleepTrend = getSleepTrend(latestSleep?.hours ?? goals.sleep, goals.sleep);
  const moodTrend = getMoodTrend(latestMood?.mood ?? 'steady');

  return (
    <div className="screen-stack">
      <section className="section-header-block">
        <div>
          <p className="section-kicker">Universal core</p>
          <h1>Wellness</h1>
          <p className="section-description">Hydration, sleep, and mood should feel fast enough to log on real workdays.</p>
        </div>
      </section>

      <section className="panel-grid wellness-grid">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Hydration</p>
              <h2>
                {hydrationCount}/{goals.hydration} glasses
              </h2>
            </div>
            <Droplets size={18} />
          </div>
          <p className="summary-copy">Tap to add quick glasses without leaving the screen.</p>
          <div className="hydration-actions">
            {[1, 2, 3].map((amount) => (
              <button key={amount} type="button" className="secondary-action" onClick={() => onAddHydration(amount)}>
                <Plus size={14} />
                Add {amount}
              </button>
            ))}
          </div>
          <TrendChart data={hydrationTrend} maxValue={Math.max(goals.hydration + 1, 10)} suffix="" />
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Sleep log</p>
              <h2>{latestSleep ? `${latestSleep.hours.toFixed(1)} hours` : `${goals.sleep}h target`}</h2>
            </div>
            <MoonStar size={18} />
          </div>
          <div className="form-grid">
            <label>
              <span>Start</span>
              <input type="time" value={sleepDraft.start} onChange={(event) => onSleepDraftChange({ ...sleepDraft, start: event.target.value })} />
            </label>
            <label>
              <span>End</span>
              <input type="time" value={sleepDraft.end} onChange={(event) => onSleepDraftChange({ ...sleepDraft, end: event.target.value })} />
            </label>
            <label className="field-span">
              <span>Quality</span>
              <div className="chip-row">
                {(['rough', 'okay', 'good'] as SleepQuality[]).map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    className={`chip-button ${sleepDraft.quality === quality ? 'active' : ''}`}
                    onClick={() => onSleepDraftChange({ ...sleepDraft, quality })}
                  >
                    {toSentenceCase(quality)}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <button type="button" className="primary-action" onClick={onSaveSleep}>
            Save sleep log
          </button>
          <TrendChart data={sleepTrend} maxValue={Math.max(goals.sleep + 2, 9)} suffix="h" />
        </article>

        <article className="panel-card panel-card-wide">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Mood check</p>
              <h2>{latestMood ? MOOD_META[latestMood.mood].label : 'No check-in yet'}</h2>
            </div>
            <HeartPulse size={18} />
          </div>
          <div className="mood-options">
            {(Object.keys(MOOD_META) as MoodType[]).map((moodKey) => (
              <button
                key={moodKey}
                type="button"
                className={`mood-option ${moodDraft.mood === moodKey ? 'active' : ''}`}
                onClick={() => onMoodDraftChange({ ...moodDraft, mood: moodKey })}
              >
                <strong>{MOOD_META[moodKey].emoji}</strong>
                <span>{MOOD_META[moodKey].label}</span>
              </button>
            ))}
          </div>
          <div className="form-grid">
            <label>
              <span>Energy</span>
              <input type="range" min="1" max="5" value={moodDraft.energy} onChange={(event) => onMoodDraftChange({ ...moodDraft, energy: Number(event.target.value) })} />
            </label>
            <label>
              <span>Stress</span>
              <input type="range" min="1" max="5" value={moodDraft.stress} onChange={(event) => onMoodDraftChange({ ...moodDraft, stress: Number(event.target.value) })} />
            </label>
            <label className="field-span">
              <span>Notes</span>
              <textarea rows={3} value={moodDraft.notes} onChange={(event) => onMoodDraftChange({ ...moodDraft, notes: event.target.value })} placeholder="What is making today lighter or heavier?" />
            </label>
          </div>
          <div className="action-row">
            <button type="button" className="primary-action" onClick={onSaveMood}>
              Save mood check
            </button>
            <div className="mood-meta">
              <span>Energy {moodDraft.energy}/5</span>
              <span>Stress {moodDraft.stress}/5</span>
            </div>
          </div>
          <TrendChart data={moodTrend} maxValue={4} suffix="" />
        </article>
      </section>
    </div>
  );
}

function NotesScreen({
  notes,
  filter,
  setFilter,
  onOpenComposer,
}: {
  notes: TamarNote[];
  filter: NoteCategory | 'All';
  setFilter: (filter: NoteCategory | 'All') => void;
  onOpenComposer: (note?: TamarNote) => void;
}) {
  const filteredNotes = filter === 'All' ? notes : notes.filter((note) => note.category === filter);

  return (
    <div className="screen-stack">
      <section className="section-header-block notes-header-block">
        <div>
          <p className="section-kicker">Universal core</p>
          <h1>Notes</h1>
          <p className="section-description">General, work, personal, and reminder notes in one compact rail.</p>
        </div>
        <button type="button" className="floating-add" onClick={() => onOpenComposer()}>
          <Plus size={18} />
          New note
        </button>
      </section>

      <div className="chip-row">
        <button type="button" className={`chip-button ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>
          All
        </button>
        {NOTE_CATEGORIES.map((category) => (
          <button key={category} type="button" className={`chip-button ${filter === category ? 'active' : ''}`} onClick={() => setFilter(category)}>
            {category}
          </button>
        ))}
      </div>

      <section className="note-grid">
        {filteredNotes.map((note) => (
          <button key={note.id} type="button" className="note-card" onClick={() => onOpenComposer(note)}>
            <span className="note-category">{note.category}</span>
            <strong>{note.title}</strong>
            <p>{note.body}</p>
            <div className="detail-footer">
              <span>{note.updatedAt}</span>
              <NotebookPen size={16} />
            </div>
          </button>
        ))}

        {filteredNotes.length === 0 && (
          <div className="panel-card empty-state-card">
            <BookOpen size={20} />
            <h2>No notes here yet</h2>
            <p>Start a note in {filter === 'All' ? 'any lane' : filter.toLowerCase()} and Tamar will keep it close.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function YouScreen({
  profile,
  goals,
  linkState,
  theme,
  notifications,
  onGenerateCode,
  onToggleConnection,
  onOpenSettings,
}: {
  profile: TamarProfile;
  goals: TamarGoals;
  linkState: TamarLinkState;
  theme: ThemeMode;
  notifications: TamarNotificationPrefs;
  onGenerateCode: () => void;
  onToggleConnection: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="screen-stack">
      <section className="section-header-block">
        <div>
          <p className="section-kicker">You</p>
          <h1>{profile.name || 'Your profile'}</h1>
          <p className="section-description">Profile, Tamar Link, Open When cards, and the settings shortcut live here.</p>
        </div>
        <button type="button" className="hero-settings" onClick={onOpenSettings} aria-label="Open settings">
          <Settings2 size={18} />
        </button>
      </section>

      <section className="panel-grid">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Profile summary</p>
              <h2>{profile.profession}</h2>
            </div>
            <UserRound size={18} />
          </div>
          <div className="summary-rail vertical">
            <div className="summary-stat">
              <span>Greeting</span>
              <strong>{profile.greeting || 'Kaibigan'}</strong>
            </div>
            <div className="summary-stat">
              <span>Hydration goal</span>
              <strong>{goals.hydration} glasses</strong>
            </div>
            <div className="summary-stat">
              <span>Theme</span>
              <strong>{toSentenceCase(theme)}</strong>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Tamar Link</p>
              <h2>{linkState.connected ? 'Buddy connected' : 'Share when ready'}</h2>
            </div>
            <Link2 size={18} />
          </div>
          <p className="summary-copy">Buddy can view your wellness snapshot, active work status, and whether your focus timer is running.</p>
          <div className="link-box">
            <span>Share code</span>
            <strong>{linkState.code || '------'}</strong>
          </div>
          <div className="action-row">
            <button type="button" className="secondary-action" onClick={onGenerateCode}>
              {linkState.code ? 'Refresh code' : 'Generate code'}
            </button>
            <button type="button" className="primary-action" onClick={onToggleConnection}>
              {linkState.connected ? 'Disconnect buddy' : 'Mark buddy connected'}
            </button>
          </div>
        </article>

        <article className="panel-card panel-card-wide">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Open When</p>
              <h2>Motivational cards</h2>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="open-when-grid">
            {OPEN_WHEN_CARDS.map((card) => (
              <div key={card.id} className="open-when-card">
                <span className="open-when-title">Open when {card.title}</span>
                <p>{card.message}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Settings shortcut</p>
              <h2>Preferences at a glance</h2>
            </div>
            <Bell size={18} />
          </div>
          <div className="profession-checklist">
            {Object.entries(notifications).map(([key, enabled]) => (
              <div key={key} className="checklist-row">
                <span className={`status-dot ${enabled ? 'on' : 'off'}`}></span>
                <span>{toSentenceCase(key)} reminders</span>
              </div>
            ))}
          </div>
          <button type="button" className="primary-action" onClick={onOpenSettings}>
            Open settings
          </button>
        </article>
      </section>
    </div>
  );
}

function BottomTabs({
  activeTab,
  profession,
  onSelect,
}: {
  activeTab: Tab;
  profession: Profession;
  onSelect: (tab: Tab) => void;
}) {
  const professionMeta = PROFESSION_META[profession];
  const ProfessionIcon = professionMeta.icon;
  const tabs: Array<{ key: Tab; label: string; icon: LucideIcon }> = [
    { key: 'home', label: 'Home', icon: House },
    { key: 'profession', label: professionMeta.tabLabel, icon: ProfessionIcon },
    { key: 'wellness', label: 'Wellness', icon: HeartPulse },
    { key: 'notes', label: 'Notes', icon: NotebookPen },
    { key: 'you', label: 'You', icon: UserRound },
  ];

  return (
    <nav className="bottom-tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button key={tab.key} type="button" className={`tab-button ${isActive ? 'active' : ''}`} onClick={() => onSelect(tab.key)}>
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SplashScreen() {
  return (
    <div className="center-stage">
      <div className="splash-mark">
        <span className="brand-pill">Tamar</span>
        <h1>Tamar</h1>
        <p>{BRAND_TAGLINE}</p>
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="center-stage">
      <div className="welcome-panel">
        <div className="welcome-art">
          <div className="welcome-circle"></div>
          <div className="welcome-card">
            <span className="brand-pill">Tamaraw energy</span>
            <h1>A workday companion with a profession brain.</h1>
            <p>
              Tamar adapts for nurses, teachers, and engineers while keeping one universal core for wellness, focus,
              notes, and connection.
            </p>
          </div>
        </div>
        <div className="welcome-actions">
          <button type="button" className="primary-action" onClick={onStart}>
            Get started
          </button>
          <p className="support-caption">{BRAND_TAGLINE}</p>
        </div>
      </div>
    </div>
  );
}

function FocusModal({
  focus,
  onClose,
  onSelectPreset,
  onChangeCustom,
  onStart,
  onPause,
  onReset,
}: {
  focus: TamarFocusState;
  onClose: () => void;
  onSelectPreset: (minutes: number) => void;
  onChangeCustom: (value: string) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <div className="overlay">
      <div className="sheet">
        <div className="sheet-header">
          <div>
            <p className="section-kicker">Quick Focus</p>
            <h2>Pomodoro board</h2>
          </div>
          <button type="button" className="ghost-action" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="timer-face">
          <strong>{formatTimer(focus.remainingSeconds)}</strong>
          <span>
            {focus.status === 'running'
              ? 'Stay with the next important thing.'
              : focus.status === 'paused'
                ? 'Pause counts when it is deliberate.'
                : 'Choose a window that matches your real energy.'}
          </span>
        </div>

        <div className="preset-grid">
          {FOCUS_PRESETS.map((preset) => (
            <button key={preset} type="button" className={`chip-button ${focus.presetMinutes === preset ? 'active' : ''}`} onClick={() => onSelectPreset(preset)}>
              {preset}m
            </button>
          ))}
        </div>

        <label className="field-span">
          <span>Custom minutes</span>
          <input type="number" min="5" max="180" value={focus.customMinutes} onChange={(event) => onChangeCustom(event.target.value)} />
        </label>

        <div className="action-row">
          <button type="button" className="primary-action" onClick={focus.status === 'running' ? onPause : onStart}>
            {focus.status === 'running' ? (
              <>
                <Pause size={16} />
                Pause
              </>
            ) : (
              <>
                <Play size={16} />
                {focus.status === 'paused' ? 'Resume' : 'Start'}
              </>
            )}
          </button>
          <button type="button" className="secondary-action" onClick={onReset}>
            Reset
          </button>
        </div>

        <div className="sheet-footnote">
          <AlarmClock size={16} />
          <span>{focus.sessionsToday} sessions completed today</span>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({
  profile,
  theme,
  notifications,
  onClose,
  onToggleTheme,
  onToggleNotification,
  onChangeProfession,
}: {
  profile: TamarProfile;
  theme: ThemeMode;
  notifications: TamarNotificationPrefs;
  onClose: () => void;
  onToggleTheme: () => void;
  onToggleNotification: (key: keyof TamarNotificationPrefs) => void;
  onChangeProfession: (profession: Profession) => void;
}) {
  return (
    <div className="overlay">
      <div className="sheet">
        <div className="sheet-header">
          <div>
            <p className="section-kicker">Settings</p>
            <h2>Profile and preferences</h2>
          </div>
          <button type="button" className="ghost-action" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="sheet-block">
          <p className="mini-label">Profession</p>
          <div className="chip-row">
            {(Object.keys(PROFESSION_META) as Profession[]).map((profession) => (
              <button key={profession} type="button" className={`chip-button ${profile.profession === profession ? 'active' : ''}`} onClick={() => onChangeProfession(profession)}>
                {PROFESSION_META[profession].label}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-block">
          <p className="mini-label">Theme</p>
          <button type="button" className="toggle-row" onClick={onToggleTheme}>
            <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            {theme === 'dark' ? <MoonStar size={18} /> : <SunMedium size={18} />}
          </button>
        </div>

        <div className="sheet-block">
          <p className="mini-label">Notifications</p>
          <div className="toggle-stack">
            {(Object.keys(notifications) as Array<keyof TamarNotificationPrefs>).map((key) => (
              <button key={key} type="button" className="toggle-row" onClick={() => onToggleNotification(key)}>
                <span>{toSentenceCase(key)} reminders</span>
                <span className={`status-dot ${notifications[key] ? 'on' : 'off'}`}></span>
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-footnote">
          <BellRing size={16} />
          <span>Tamar version {APP_VERSION}</span>
        </div>
      </div>
    </div>
  );
}

function NoteComposer({
  draft,
  setDraft,
  onClose,
  onSave,
  isEditing,
}: {
  draft: TamarNote;
  setDraft: (draft: TamarNote) => void;
  onClose: () => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  return (
    <div className="overlay">
      <div className="sheet">
        <div className="sheet-header">
          <div>
            <p className="section-kicker">Notes</p>
            <h2>{isEditing ? 'Edit note' : 'New note'}</h2>
          </div>
          <button type="button" className="ghost-action" onClick={onClose}>
            Close
          </button>
        </div>

        <label className="field-span">
          <span>Category</span>
          <div className="chip-row">
            {NOTE_CATEGORIES.map((category) => (
              <button key={category} type="button" className={`chip-button ${draft.category === category ? 'active' : ''}`} onClick={() => setDraft({ ...draft, category })}>
                {category}
              </button>
            ))}
          </div>
        </label>

        <label className="field-span">
          <span>Title</span>
          <input type="text" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What do you need to remember?" />
        </label>

        <label className="field-span">
          <span>Body</span>
          <textarea rows={5} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Write the quick version first. Tamar is for real workdays." />
        </label>

        <button type="button" className="primary-action" onClick={onSave}>
          {isEditing ? 'Save changes' : 'Create note'}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [hasOnboarded, setHasOnboarded] = useLocalStorage('tamar_has_onboarded', false);
  const [profile, setProfile] = useLocalStorage<TamarProfile>('tamar_profile', DEFAULT_PROFILE);
  const [goals, setGoals] = useLocalStorage<TamarGoals>('tamar_goals', DEFAULT_GOALS);
  const [notifications, setNotifications] = useLocalStorage<TamarNotificationPrefs>('tamar_notifications', DEFAULT_NOTIFICATIONS);
  const [theme, setTheme] = useLocalStorage<ThemeMode>('tamar_theme', 'light');
  const [hydrationByDay, setHydrationByDay] = useLocalStorage<Record<string, number>>('tamar_hydration_by_day', {});
  const [sleepByDay, setSleepByDay] = useLocalStorage<Record<string, TamarSleepLog>>('tamar_sleep_by_day', {});
  const [moodByDay, setMoodByDay] = useLocalStorage<Record<string, TamarMoodLog>>('tamar_mood_by_day', {});
  const [notes, setNotes] = useLocalStorage<TamarNote[]>('tamar_notes', DEFAULT_NOTES);
  const [linkState, setLinkState] = useLocalStorage<TamarLinkState>('tamar_link', DEFAULT_LINK_STATE);
  const [focus, setFocus] = useLocalStorage<TamarFocusState>('tamar_focus', createDefaultFocusState());
  const [stage, setStage] = useState<Stage>(hasOnboarded ? 'app' : 'splash');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [activeModal, setActiveModal] = useState<ModalView>(null);
  const [notesFilter, setNotesFilter] = useState<NoteCategory | 'All'>('All');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<TamarNote>({ id: '', category: 'General', title: '', body: '', updatedAt: '' });
  const [sleepDraft, setSleepDraft] = useState<TamarSleepLog>({ hours: goals.sleep, quality: 'okay', start: '22:30', end: '06:00', loggedAt: '' });
  const [moodDraft, setMoodDraft] = useState<TamarMoodLog>({ mood: 'steady', energy: 3, stress: 3, notes: '', loggedAt: '' });

  const todayKey = getTodayKey(currentDate);
  const hydrationCount = hydrationByDay[todayKey] ?? 0;
  const latestSleep = sleepByDay[todayKey] ?? null;
  const latestMood = moodByDay[todayKey] ?? null;

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (stage !== 'splash') return;
    const timeoutId = window.setTimeout(() => setStage(hasOnboarded ? 'app' : 'welcome'), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [hasOnboarded, stage]);

  useEffect(() => {
    if (focus.trackedDay === todayKey) return;
    setFocus((currentFocus) => ({ ...currentFocus, status: 'idle', remainingSeconds: currentFocus.presetMinutes * 60, endAt: null, sessionsToday: 0, trackedDay: todayKey }));
  }, [focus.trackedDay, setFocus, todayKey]);

  useEffect(() => {
    if (focus.status !== 'running' || !focus.endAt) return;
    const intervalId = window.setInterval(() => {
      setFocus((currentFocus) => {
        if (currentFocus.status !== 'running' || !currentFocus.endAt) return currentFocus;
        const nextRemainingSeconds = Math.max(0, Math.ceil((currentFocus.endAt - Date.now()) / 1000));
        if (nextRemainingSeconds === 0) {
          return { ...currentFocus, status: 'done', remainingSeconds: 0, endAt: null, sessionsToday: currentFocus.sessionsToday + 1 };
        }
        if (nextRemainingSeconds === currentFocus.remainingSeconds) return currentFocus;
        return { ...currentFocus, remainingSeconds: nextRemainingSeconds };
      });
    }, 500);
    return () => window.clearInterval(intervalId);
  }, [focus.endAt, focus.status, setFocus]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setSleepDraft((current) => ({ ...current, hours: latestSleep?.hours ?? current.hours, quality: latestSleep?.quality ?? current.quality }));
  }, [latestSleep]);

  useEffect(() => {
    setMoodDraft((current) => ({
      ...current,
      mood: latestMood?.mood ?? current.mood,
      energy: latestMood?.energy ?? current.energy,
      stress: latestMood?.stress ?? current.stress,
      notes: latestMood?.notes ?? current.notes,
    }));
  }, [latestMood]);

  const profileCompletion = useMemo(() => {
    let count = 0;
    if (profile.profession) count += 1;
    if (profile.name.trim()) count += 1;
    if (goals.hydration > 0 && goals.sleep > 0) count += 1;
    if (Object.values(notifications).some(Boolean)) count += 1;
    return Math.round((count / 4) * 100);
  }, [goals.hydration, goals.sleep, notifications, profile.name, profile.profession]);

  const openNoteComposer = (note?: TamarNote) => {
    setEditingNoteId(note?.id ?? null);
    setNoteDraft(note ? { ...note } : { id: '', category: 'General', title: '', body: '', updatedAt: '' });
    setActiveModal('note');
  };

  const saveNote = () => {
    if (!noteDraft.title.trim() || !noteDraft.body.trim()) return;
    const timestamp = `Today, ${formatRelativeTimeStamp(new Date())}`;
    if (editingNoteId) {
      setNotes((currentNotes) => currentNotes.map((note) => (note.id === editingNoteId ? { ...noteDraft, id: editingNoteId, updatedAt: timestamp } : note)));
    } else {
      setNotes((currentNotes) => [{ ...noteDraft, id: `note-${Date.now()}`, updatedAt: timestamp }, ...currentNotes]);
    }
    setActiveModal(null);
  };

  const changeProfession = (profession: Profession) => {
    if (profession === profile.profession) return;
    if (!window.confirm(`Change profession to ${PROFESSION_META[profession].label}? Tamar will update the middle tab and dashboard copy.`)) return;
    setProfile((currentProfile) => ({ ...currentProfile, profession }));
  };

  const addHydration = (amount: number) => {
    setHydrationByDay((current) => ({ ...current, [todayKey]: clamp((current[todayKey] ?? 0) + amount, 0, goals.hydration + 4) }));
  };

  const saveSleep = () => {
    const [startHour, startMinute] = sleepDraft.start.split(':').map(Number);
    const [endHour, endMinute] = sleepDraft.end.split(':').map(Number);
    const startTotal = startHour * 60 + startMinute;
    let endTotal = endHour * 60 + endMinute;
    if (endTotal <= startTotal) endTotal += 24 * 60;
    const hours = Number(((endTotal - startTotal) / 60).toFixed(1));
    setSleepByDay((current) => ({ ...current, [todayKey]: { ...sleepDraft, hours, loggedAt: new Date().toISOString() } }));
  };

  const saveMood = () => {
    setMoodByDay((current) => ({ ...current, [todayKey]: { ...moodDraft, loggedAt: new Date().toISOString() } }));
  };

  const selectFocusPreset = (minutes: number) => {
    setFocus((currentFocus) => ({ ...currentFocus, presetMinutes: minutes, remainingSeconds: currentFocus.status === 'running' || currentFocus.status === 'paused' ? currentFocus.remainingSeconds : minutes * 60 }));
  };

  const startFocus = () => {
    setFocus((currentFocus) => {
      const customMinutes = clamp(Number(currentFocus.customMinutes) || currentFocus.presetMinutes, 5, 180);
      const selectedMinutes = currentFocus.presetMinutes || customMinutes;
      const remainingSeconds = currentFocus.status === 'paused' ? currentFocus.remainingSeconds : selectedMinutes * 60;
      return { ...currentFocus, presetMinutes: selectedMinutes, status: 'running', remainingSeconds, endAt: Date.now() + remainingSeconds * 1000 };
    });
  };

  const pauseFocus = () => setFocus((currentFocus) => ({ ...currentFocus, status: 'paused', endAt: null }));
  const resetFocus = () => setFocus((currentFocus) => ({ ...currentFocus, status: 'idle', remainingSeconds: currentFocus.presetMinutes * 60, endAt: null }));
  const finishOnboarding = () => {
    setHasOnboarded(true);
    setStage('app');
  };

  if (stage === 'splash') return <SplashScreen />;
  if (stage === 'welcome') return <WelcomeScreen onStart={() => setStage('profession')} />;

  if (stage !== 'app') {
    const progressSteps: Stage[] = ['profession', 'profile', 'goals', 'notifications'];
    return (
      <div className={`tamar-shell theme-${theme}`}>
        <div className="center-stage">
          <div className="wizard-panel">
            <div className="wizard-progress">
              {progressSteps.map((progressStage) => (
                <span key={progressStage} className={stage === progressStage ? 'active' : progressSteps.indexOf(progressStage) < progressSteps.indexOf(stage) ? 'complete' : ''}></span>
              ))}
            </div>
            <div className="wizard-topline">
              <span className="brand-pill">Setup</span>
              <strong>{profileCompletion}% ready</strong>
            </div>
            {stage === 'profession' && (
              <>
                <p className="section-kicker">Step 1</p>
                <h1>Choose your profession.</h1>
                <p className="section-description">Tamar keeps a shared wellness core, but the middle tab and summary card adapt to your role.</p>
                <div className="profession-selector">
                  {(Object.keys(PROFESSION_META) as Profession[]).map((profession) => {
                    const meta = PROFESSION_META[profession];
                    const Icon = meta.icon;
                    return (
                      <button key={profession} type="button" className={`profession-option ${profile.profession === profession ? 'active' : ''}`} onClick={() => setProfile((currentProfile) => ({ ...currentProfile, profession }))}>
                        <div className="section-header-badge" style={{ backgroundColor: meta.tint, color: meta.primary }}>
                          <Icon size={20} />
                        </div>
                        <strong>{meta.label}</strong>
                        <p>{meta.description}</p>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="primary-action" onClick={() => setStage('profile')}>
                  Continue
                </button>
              </>
            )}
            {stage === 'profile' && (
              <>
                <p className="section-kicker">Step 2</p>
                <h1>Set up your profile.</h1>
                <div className="form-grid single-column">
                  <label className="field-span">
                    <span>Name</span>
                    <input type="text" value={profile.name} onChange={(event) => setProfile((currentProfile) => ({ ...currentProfile, name: event.target.value }))} placeholder="Tamar user name" />
                  </label>
                  <label>
                    <span>Preferred greeting</span>
                    <input type="text" value={profile.greeting} onChange={(event) => setProfile((currentProfile) => ({ ...currentProfile, greeting: event.target.value }))} placeholder="Kaibigan" />
                  </label>
                  <label>
                    <span>Age (optional)</span>
                    <input type="number" value={profile.age} onChange={(event) => setProfile((currentProfile) => ({ ...currentProfile, age: event.target.value }))} placeholder="28" />
                  </label>
                </div>
                <div className="action-row">
                  <button type="button" className="secondary-action" onClick={() => setStage('profession')}>Back</button>
                  <button type="button" className="primary-action" onClick={() => setStage('goals')}>Continue</button>
                </div>
              </>
            )}
            {stage === 'goals' && (
              <>
                <p className="section-kicker">Step 3</p>
                <h1>Dial in your wellness goals.</h1>
                <div className="goal-grid">
                  <div className="goal-card">
                    <span>Hydration target</span>
                    <strong>{goals.hydration} glasses</strong>
                    <input type="range" min="4" max="12" value={goals.hydration} onChange={(event) => setGoals((currentGoals) => ({ ...currentGoals, hydration: Number(event.target.value) }))} />
                  </div>
                  <div className="goal-card">
                    <span>Sleep target</span>
                    <strong>{goals.sleep} hours</strong>
                    <input type="range" min="5" max="10" step="0.5" value={goals.sleep} onChange={(event) => setGoals((currentGoals) => ({ ...currentGoals, sleep: Number(event.target.value) }))} />
                  </div>
                </div>
                <label className="field-span">
                  <span>Mood check frequency</span>
                  <div className="chip-row">
                    {(['Once a day', 'Twice a day', 'Only when needed'] as MoodCheckFrequency[]).map((frequency) => (
                      <button key={frequency} type="button" className={`chip-button ${goals.moodCheckFrequency === frequency ? 'active' : ''}`} onClick={() => setGoals((currentGoals) => ({ ...currentGoals, moodCheckFrequency: frequency }))}>
                        {frequency}
                      </button>
                    ))}
                  </div>
                </label>
                <div className="action-row">
                  <button type="button" className="secondary-action" onClick={() => setStage('profile')}>Back</button>
                  <button type="button" className="primary-action" onClick={() => setStage('notifications')}>Continue</button>
                </div>
              </>
            )}
            {stage === 'notifications' && (
              <>
                <p className="section-kicker">Step 4</p>
                <h1>Choose your reminders.</h1>
                <div className="toggle-stack">
                  {(Object.keys(notifications) as Array<keyof TamarNotificationPrefs>).map((key) => (
                    <button key={key} type="button" className="toggle-row" onClick={() => setNotifications((currentNotifications) => ({ ...currentNotifications, [key]: !currentNotifications[key] }))}>
                      <span>{toSentenceCase(key)} reminders</span>
                      <span className={`status-dot ${notifications[key] ? 'on' : 'off'}`}></span>
                    </button>
                  ))}
                </div>
                <div className="action-row">
                  <button type="button" className="secondary-action" onClick={() => setStage('goals')}>Back</button>
                  <button type="button" className="primary-action" onClick={finishOnboarding}>Enter Tamar</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tamar-shell theme-${theme}`}>
      <div className="tamar-app">
        <main className="app-content">
          {activeTab === 'home' && <HomeScreen profile={profile} goals={goals} hydrationCount={hydrationCount} latestSleep={latestSleep} latestMood={latestMood} focus={focus} linkState={linkState} currentDate={currentDate} onOpenFocus={() => setActiveModal('focus')} onOpenSettings={() => setActiveModal('settings')} />}
          {activeTab === 'profession' && <ProfessionScreen profession={profile.profession} />}
          {activeTab === 'wellness' && <WellnessScreen goals={goals} hydrationCount={hydrationCount} onAddHydration={addHydration} latestSleep={latestSleep} sleepDraft={sleepDraft} onSleepDraftChange={setSleepDraft} onSaveSleep={saveSleep} latestMood={latestMood} moodDraft={moodDraft} onMoodDraftChange={setMoodDraft} onSaveMood={saveMood} />}
          {activeTab === 'notes' && <NotesScreen notes={notes} filter={notesFilter} setFilter={setNotesFilter} onOpenComposer={openNoteComposer} />}
          {activeTab === 'you' && <YouScreen profile={profile} goals={goals} linkState={linkState} theme={theme} notifications={notifications} onGenerateCode={() => setLinkState((currentLinkState) => ({ ...currentLinkState, code: createShareCode() }))} onToggleConnection={() => setLinkState((currentLinkState) => ({ ...currentLinkState, connected: !currentLinkState.connected, nudgesSent: currentLinkState.connected ? 0 : 3 }))} onOpenSettings={() => setActiveModal('settings')} />}
        </main>
        <BottomTabs activeTab={activeTab} profession={profile.profession} onSelect={setActiveTab} />
      </div>

      {activeModal === 'focus' && <FocusModal focus={focus} onClose={() => setActiveModal(null)} onSelectPreset={selectFocusPreset} onChangeCustom={(value) => setFocus((currentFocus) => ({ ...currentFocus, customMinutes: value }))} onStart={startFocus} onPause={pauseFocus} onReset={resetFocus} />}
      {activeModal === 'settings' && <SettingsModal profile={profile} theme={theme} notifications={notifications} onClose={() => setActiveModal(null)} onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))} onToggleNotification={(key) => setNotifications((currentNotifications) => ({ ...currentNotifications, [key]: !currentNotifications[key] }))} onChangeProfession={changeProfession} />}
      {activeModal === 'note' && <NoteComposer draft={noteDraft} setDraft={setNoteDraft} onClose={() => setActiveModal(null)} onSave={saveNote} isEditing={Boolean(editingNoteId)} />}
    </div>
  );
}

export default App;
