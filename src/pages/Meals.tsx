import React, { useState } from 'react';
import { Apple, Coffee, Droplet, Image as ImageIcon, Plus, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useCurrentDayKey } from '../hooks/useCurrentDayKey';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  createQuickMealEntry,
  formatMealTime,
  getInitialMealEntries,
  getMealProgress,
  getMealSuggestions,
  getRecentMealEntries,
  getTodayMealEntries,
  mealStatusLabels,
  mealTypeOptions,
  type MealEntry,
  type MealType,
} from '../utils/meals';
import { getCurrentHydrationCount, type HydrationEntry } from '../utils/wellness';
import './Meals.css';

interface MealsProps {
  onNavigate: (tab: string) => void;
}

const mealIcons: Record<MealType, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: UtensilsCrossed,
  Dinner: UtensilsCrossed,
  Snack: Apple,
};

export const Meals: React.FC<MealsProps> = ({ onNavigate }) => {
  const { dayKey, referenceDate } = useCurrentDayKey();
  const [mealEntries, setMealEntries] = useLocalStorage<MealEntry[]>('hercare_meal_entries', getInitialMealEntries());
  const [storedGlasses] = useLocalStorage('hercare_hydration_count', 0);
  const [hydrationHistory] = useLocalStorage<HydrationEntry[]>('hercare_hydration_history', []);
  const [expandedLogDay, setExpandedLogDay] = useState<string | null>(null);
  const glasses = getCurrentHydrationCount(hydrationHistory, storedGlasses, referenceDate);

  const mealProgress = getMealProgress(mealEntries, referenceDate);
  const todayMeals = getTodayMealEntries(mealEntries, referenceDate);
  const todayMealIds = new Set(todayMeals.map((meal) => meal.id));
  const recentMeals = getRecentMealEntries(mealEntries.filter((meal) => !todayMealIds.has(meal.id)));
  const mealSuggestions = getMealSuggestions(mealEntries, glasses, referenceDate);
  const showAllTodayMeals = expandedLogDay === dayKey;
  const visibleTodayMeals = showAllTodayMeals ? todayMeals : todayMeals.slice(0, 3);
  const hiddenTodayMealCount = Math.max(todayMeals.length - visibleTodayMeals.length, 0);

  const handleQuickLog = (mealType: MealType) => {
    setMealEntries((currentEntries) => [createQuickMealEntry(mealType), ...currentEntries]);
  };

  const renderMealHistoryItem = (meal: MealEntry) => {
    const Icon = mealIcons[meal.type];

    return (
      <div key={meal.id} className="meal-history-item">
        <div className="meal-history-icon">
          <Icon size={18} />
        </div>
        <div className="meal-history-copy">
          <div className="meal-history-topline">
            <strong>{meal.food}</strong>
            <span className={`meal-status-chip status-${meal.status}`}>{mealStatusLabels[meal.status]}</span>
          </div>
          <p className="meal-history-meta">
            {meal.type} | {formatMealTime(meal.time)} | {meal.dateLabel}
          </p>
          {meal.notes && <p className="meal-history-note">{meal.notes}</p>}
          {(meal.photoDataUrl || meal.photoName) && (
            <div className="meal-history-photo-row">
              {meal.photoDataUrl ? (
                <img className="meal-history-photo" src={meal.photoDataUrl} alt={`${meal.food} meal`} />
              ) : (
                <div className="meal-history-photo-placeholder">
                  <ImageIcon size={16} />
                </div>
              )}
              <span>{meal.photoName || 'Photo attached'}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="meals-container">
      <header className="page-header">
        <h1>Meals</h1>
        <p className="subtitle">Fuel for your long shifts.</p>
      </header>

      <section className="meals-section">
        <Card className="meal-progress-card">
          <div className="meal-progress-header">
            <div>
              <p className="meal-kicker">Meal progress</p>
              <h2>
                {mealProgress.completedCount} / {mealProgress.goalCount}
              </h2>
            </div>
            <div className="meal-progress-badge">{todayMeals.length} today</div>
          </div>

          <div className="meal-progress-bar">
            <div className="meal-progress-fill" style={{ width: `${mealProgress.percentage}%` }}></div>
          </div>

          <div className="meal-progress-types">
            {mealTypeOptions.map((mealType) => (
              <span
                key={mealType}
                className={`meal-progress-pill ${mealProgress.completedTypes.includes(mealType) ? 'complete' : ''}`}
              >
                {mealType}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section className="meals-section">
        <div className="section-heading">
          <h3>Quick log</h3>
          <p>Tap once when you need to move fast.</p>
        </div>

        <div className="quick-log-grid">
          {mealTypeOptions.map((mealType) => {
            const Icon = mealIcons[mealType];

            return (
              <button key={mealType} className="quick-log-btn" onClick={() => handleQuickLog(mealType)}>
                <div className="quick-log-icon">
                  <Icon size={20} />
                </div>
                <strong>{mealType}</strong>
                <span>Quick save</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="meals-section">
        <div className="section-heading">
          <h3>Suggestions</h3>
          <p>Small ideas for the next few hours.</p>
        </div>

        <div className="meal-suggestion-list">
          {mealSuggestions.map((suggestion) => (
            <Card key={suggestion.id} variant={suggestion.variant} className="meal-suggestion-card">
              <div className="meal-suggestion-topline">
                <Sparkles size={16} />
                <span>Suggestion</span>
              </div>
              <h4>{suggestion.title}</h4>
              <p>{suggestion.description}</p>
            </Card>
          ))}

          <Card className="meal-water-card">
            <div className="meal-water-copy">
              <div className="meal-water-title">
                <Droplet size={20} />
                <span>Water shortcut</span>
              </div>
              <p>You are at {glasses} glasses today. Open Hydration if you want to log water without leaving this rhythm.</p>
            </div>
            <Button variant="secondary" onClick={() => onNavigate('hydration_screen')}>
              Open Hydration
            </Button>
          </Card>
        </div>
      </section>

      <section className="meals-section">
        <div className="section-heading">
          <h3>Today's log</h3>
          <p>These entries reset visually at local midnight.</p>
        </div>

        <Card className="meal-history-card">
          {todayMeals.length > 0 ? (
            <>
              <div className="meal-history-list">{visibleTodayMeals.map(renderMealHistoryItem)}</div>

              {todayMeals.length > 3 && (
                <div className="meal-history-actions">
                  <button
                    className="meal-history-toggle-btn"
                    onClick={() => setExpandedLogDay((currentValue) => (currentValue === dayKey ? null : dayKey))}
                  >
                    {showAllTodayMeals
                      ? 'Show fewer meals'
                      : `Show ${hiddenTodayMealCount} more ${hiddenTodayMealCount === 1 ? 'meal' : 'meals'}`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted">No meals logged yet today. New entries will show here until the next day starts.</p>
          )}
        </Card>
      </section>

      <section className="meals-section">
        <div className="section-heading">
          <h3>Recent history</h3>
          <p>Older check-ins stay saved here across days.</p>
        </div>

        <Card className="meal-history-card meal-history-archive-card">
          {recentMeals.length > 0 ? (
            <div className="meal-history-list">{recentMeals.map(renderMealHistoryItem)}</div>
          ) : mealEntries.length > 0 ? (
            <p className="text-muted">Only today's meals are showing so far. Older entries will stay here once you have them.</p>
          ) : (
            <p className="text-muted">No meal history yet. Try a quick log above or add a full meal entry.</p>
          )}
        </Card>
      </section>

      <div className="meals-actions">
        <Button variant="primary" fullWidth onClick={() => onNavigate('add_meal')}>
          <Plus size={18} />
          Add Meal Details
        </Button>
      </div>
    </div>
  );
};
