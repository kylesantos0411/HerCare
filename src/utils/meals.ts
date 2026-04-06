export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type MealStatus = 'planned' | 'packed' | 'eaten' | 'skipped';

export interface MealEntry {
  id: string;
  type: MealType;
  time: string;
  food: string;
  notes: string;
  status: MealStatus;
  photoName: string;
  photoDataUrl: string;
  loggedAt: string;
  dateLabel: string;
}

export interface MealProgress {
  completedCount: number;
  goalCount: number;
  percentage: number;
  completedTypes: MealType[];
}

export interface MealSuggestion {
  id: string;
  title: string;
  description: string;
  variant: 'primary' | 'secondary' | 'accent';
}

interface LegacyMealItem {
  id: string;
  type: string;
  time: string;
  food: string;
  notes: string;
}

const mealTypeOrder: Record<MealType, number> = {
  Breakfast: 1,
  Lunch: 2,
  Dinner: 3,
  Snack: 4,
};

const defaultMealTimes: Record<MealType, string> = {
  Breakfast: '07:00',
  Lunch: '12:30',
  Dinner: '19:30',
  Snack: '15:30',
};

export const mealTypeOptions: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const mealStatusOptions: MealStatus[] = ['planned', 'packed', 'eaten', 'skipped'];

export const mealStatusLabels: Record<MealStatus, string> = {
  planned: 'Planned',
  packed: 'Packed',
  eaten: 'Ate it',
  skipped: 'Skipped',
};

function isMealType(value: string): value is MealType {
  return mealTypeOptions.includes(value as MealType);
}

function safeParseJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeLegacyMealKey(key: string): MealType | null {
  switch (key) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Dinner';
    case 'snack':
    case 'snacks':
      return 'Snack';
    default:
      return null;
  }
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function createMealEntry(
  input: {
    type: MealType;
    time?: string;
    food?: string;
    notes?: string;
    status?: MealStatus;
    photoName?: string;
    photoDataUrl?: string;
  },
  now = new Date(),
): MealEntry {
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    time: input.time ?? defaultMealTimes[input.type],
    food: input.food?.trim() || `${input.type} check-in`,
    notes: input.notes?.trim() ?? '',
    status: input.status ?? 'eaten',
    photoName: input.photoName ?? '',
    photoDataUrl: input.photoDataUrl ?? '',
    loggedAt: now.toISOString(),
    dateLabel: formatDateLabel(now),
  };
}

export function createQuickMealEntry(type: MealType, now = new Date()) {
  return createMealEntry(
    {
      type,
      time: formatTimeInput(now),
      food: `Quick ${type.toLowerCase()}`,
      notes: 'Logged from quick actions.',
      status: 'eaten',
    },
    now,
  );
}

export function sortMealEntries(entries: MealEntry[]) {
  return [...entries].sort((left, right) => {
    const timeDifference = new Date(right.loggedAt).getTime() - new Date(left.loggedAt).getTime();

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return mealTypeOrder[left.type] - mealTypeOrder[right.type];
  });
}

export function getRecentMealEntries(entries: MealEntry[], limit = 6) {
  return sortMealEntries(entries).slice(0, limit);
}

export function getTodayMealEntries(entries: MealEntry[], referenceDate = new Date()) {
  return sortMealEntries(entries).filter((entry) => isSameLocalDay(new Date(entry.loggedAt), referenceDate));
}

export function getMealProgress(entries: MealEntry[], referenceDate = new Date()): MealProgress {
  const todayEntries = getTodayMealEntries(entries, referenceDate);
  const completedTypes = mealTypeOptions.filter((type) =>
    todayEntries.some((entry) => entry.type === type && (entry.status === 'packed' || entry.status === 'eaten')),
  );

  return {
    completedCount: completedTypes.length,
    goalCount: mealTypeOptions.length,
    percentage: (completedTypes.length / mealTypeOptions.length) * 100,
    completedTypes,
  };
}

export function getMealSuggestions(entries: MealEntry[], hydrationCount: number, referenceDate = new Date()) {
  const todayEntries = getTodayMealEntries(entries, referenceDate);
  const progress = getMealProgress(entries, referenceDate);
  const suggestions: MealSuggestion[] = [];

  if (!progress.completedTypes.includes('Breakfast')) {
    suggestions.push({
      id: 'breakfast-anchor',
      title: 'Lock in a steady start',
      description: 'Even something quick like toast, yogurt, or fruit can make the rest of the shift feel less sharp.',
      variant: 'primary',
    });
  }

  if (hydrationCount < 4) {
    suggestions.push({
      id: 'water-pairing',
      title: 'Pair food with water',
      description: 'A glass of water with your next meal is the easiest double win if hydration has been slipping.',
      variant: 'secondary',
    });
  }

  if (todayEntries.some((entry) => entry.status === 'skipped')) {
    suggestions.push({
      id: 'recovery-bite',
      title: 'Go gentle on the rebound',
      description: 'If you skipped a meal, aim for something easy to digest instead of waiting until you are wiped out.',
      variant: 'accent',
    });
  }

  if (!progress.completedTypes.includes('Snack')) {
    suggestions.push({
      id: 'backup-snack',
      title: 'Keep one easy backup',
      description: 'A banana, crackers, or a protein bar can rescue the part of the shift where everything suddenly crashes.',
      variant: 'accent',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'fuel-streak',
      title: 'Nice fueling rhythm',
      description: 'You have kept meals moving today. Keep one easy snack nearby so the later hours stay softer.',
      variant: 'secondary',
    });
  }

  return suggestions.slice(0, 3);
}

export function formatMealTime(time: string) {
  return new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getInitialMealEntries(): MealEntry[] {
  const customMeals = safeParseJson<LegacyMealItem[]>('hercare_custom_meals', []);
  const loggedMeals = safeParseJson<Record<string, boolean>>('hercare_meals_logged', {});
  const now = new Date();
  const existingTypes = new Set<MealType>();

  const migratedCustomMeals = customMeals
    .map((meal, index) => {
      if (!isMealType(meal.type)) {
        return null;
      }

      existingTypes.add(meal.type);

      return createMealEntry(
        {
          type: meal.type,
          time: meal.time,
          food: meal.food,
          notes: meal.notes,
          status: 'eaten',
        },
        new Date(now.getTime() - index * 60_000),
      );
    })
    .filter((meal): meal is MealEntry => meal !== null);

  const migratedQuickLogs = Object.entries(loggedMeals)
    .map(([key, value], index) => {
      const normalizedType = normalizeLegacyMealKey(key);

      if (!value || !normalizedType || existingTypes.has(normalizedType)) {
        return null;
      }

      return createMealEntry(
        {
          type: normalizedType,
          time: defaultMealTimes[normalizedType],
          food: `Quick ${normalizedType.toLowerCase()}`,
          notes: 'Migrated from your earlier meal checklist.',
          status: 'eaten',
        },
        new Date(now.getTime() - (index + migratedCustomMeals.length + 1) * 60_000),
      );
    })
    .filter((meal): meal is MealEntry => meal !== null);

  return sortMealEntries([...migratedCustomMeals, ...migratedQuickLogs]);
}
