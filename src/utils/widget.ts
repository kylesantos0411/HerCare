import { Capacitor, registerPlugin } from '@capacitor/core';
import type { MealType } from './meals';

export type WidgetLaunchTarget = 'home' | 'hydration' | 'meals' | 'mood' | 'sleep' | 'shift' | 'notes';
export type WidgetPendingQuickAction =
  | {
      kind: 'hydration';
      amount: number;
      loggedAtMillis: number;
    }
  | {
      kind: 'meal';
      mealType: MealType;
      loggedAtMillis: number;
    };

interface WidgetSnapshot {
  trackingDayKey: string;
  hydrationCurrent: number;
  hydrationGoal: number;
  mealGoal: number;
  breakfastLogged: boolean;
  lunchLogged: boolean;
  dinnerLogged: boolean;
  snackLogged: boolean;
  moodText: string;
  sleepText: string;
  supportText: string;
}

interface WidgetBridgePlugin {
  syncSnapshot(snapshot: WidgetSnapshot): Promise<void>;
  consumeLaunchAction(): Promise<{ target?: string | null }>;
  consumePendingQuickActions(): Promise<{ actions?: unknown[] }>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

function isAndroid() {
  return Capacitor.getPlatform() === 'android';
}

function isWidgetLaunchTarget(value: string | null | undefined): value is WidgetLaunchTarget {
  return ['home', 'hydration', 'meals', 'mood', 'sleep', 'shift', 'notes'].includes(value ?? '');
}

export async function syncHerCareWidgetSnapshot(snapshot: WidgetSnapshot) {
  if (!isAndroid()) {
    return;
  }

  try {
    await WidgetBridge.syncSnapshot(snapshot);
  } catch {
    // Keep widget sync best-effort so it never blocks app flows.
  }
}

export async function consumeHerCareWidgetLaunchAction() {
  if (!isAndroid()) {
    return null;
  }

  try {
    const result = await WidgetBridge.consumeLaunchAction();
    return isWidgetLaunchTarget(result.target) ? result.target : null;
  } catch {
    return null;
  }
}

function isMealType(value: string | null | undefined): value is MealType {
  return ['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(value ?? '');
}

function normalizePendingQuickAction(value: unknown): WidgetPendingQuickAction | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const loggedAtMillis = typeof raw.loggedAtMillis === 'number' ? raw.loggedAtMillis : null;

  if (loggedAtMillis === null) {
    return null;
  }

  if (raw.kind === 'hydration' && typeof raw.amount === 'number') {
    return {
      kind: 'hydration',
      amount: raw.amount,
      loggedAtMillis,
    };
  }

  if (raw.kind === 'meal' && typeof raw.mealType === 'string' && isMealType(raw.mealType)) {
    return {
      kind: 'meal',
      mealType: raw.mealType,
      loggedAtMillis,
    };
  }

  return null;
}

export async function consumeHerCareWidgetPendingQuickActions() {
  if (!isAndroid()) {
    return [];
  }

  try {
    const result = await WidgetBridge.consumePendingQuickActions();
    return (result.actions ?? [])
      .map(normalizePendingQuickAction)
      .filter((action): action is WidgetPendingQuickAction => action !== null);
  } catch {
    return [];
  }
}
