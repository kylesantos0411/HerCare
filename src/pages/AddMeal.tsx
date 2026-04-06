import React, { useState } from 'react';
import { Camera, Check, ChevronLeft, Clock, UtensilsCrossed } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  createMealEntry,
  formatMealTime,
  getInitialMealEntries,
  mealStatusLabels,
  mealStatusOptions,
  mealTypeOptions,
  type MealEntry,
  type MealStatus,
  type MealType,
} from '../utils/meals';
import './AddMeal.css';

interface AddMealProps {
  onBack: () => void;
  onSave: () => void;
}

const statusCaptions: Record<MealStatus, string> = {
  planned: 'You are planning it for later.',
  packed: 'It is packed and ready to go.',
  eaten: 'You already had it.',
  skipped: 'You missed it and want to note that.',
};

export const AddMeal: React.FC<AddMealProps> = ({ onBack, onSave }) => {
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [status, setStatus] = useState<MealStatus>('eaten');
  const [time, setTime] = useState('12:30');
  const [food, setFood] = useState('');
  const [notes, setNotes] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [, setMealEntries] = useLocalStorage<MealEntry[]>('hercare_meal_entries', getInitialMealEntries());

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPhotoName('');
      setPhotoDataUrl('');
      return;
    }

    setPhotoName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const newMealEntry = createMealEntry({
      type: mealType,
      time,
      food,
      notes,
      status,
      photoName,
      photoDataUrl,
    });

    setMealEntries((currentEntries) => [newMealEntry, ...currentEntries]);
    onSave();
  };

  return (
    <div className="add-meal-container animation-slide-in">
      <header className="page-header add-meal-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>Log a Meal</h1>
      </header>

      <Card className="meal-preview-card">
        <div className="meal-preview-header">
          <div>
            <p className="meal-preview-kicker">Ready to save</p>
            <h2>{mealType}</h2>
          </div>
          <div className={`meal-preview-status status-${status}`}>{mealStatusLabels[status]}</div>
        </div>
        <p className="meal-preview-meta">
          {food.trim() || `${mealType} check-in`} | {formatMealTime(time)}
        </p>
      </Card>

      <section className="form-section">
        <label className="form-label">Meal type</label>
        <div className="chips-container">
          {mealTypeOptions.map((option) => (
            <button
              key={option}
              className={`chip ${mealType === option ? 'active' : ''}`}
              onClick={() => setMealType(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <label className="form-label">Status</label>
        <div className="status-grid">
          {mealStatusOptions.map((option) => (
            <button
              key={option}
              className={`status-option ${status === option ? 'active' : ''}`}
              onClick={() => setStatus(option)}
            >
              <strong>{mealStatusLabels[option]}</strong>
              <span>{statusCaptions[option]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <Card className="input-card">
          <div className="input-row">
            <div className="input-icon">
              <Clock size={20} />
            </div>
            <div className="input-field-wrapper">
              <label>Time</label>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="clean-input"
              />
            </div>
          </div>

          <div className="input-divider"></div>

          <div className="input-row">
            <div className="input-icon">
              <UtensilsCrossed size={20} />
            </div>
            <div className="input-field-wrapper">
              <label>What are you having?</label>
              <input
                type="text"
                placeholder="e.g. Rice bowl and fruit"
                value={food}
                onChange={(event) => setFood(event.target.value)}
                className="clean-input"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="form-section">
        <label className="form-label">Notes</label>
        <textarea
          className="hercare-textarea"
          placeholder="Rushed, relaxed, easy to pack, actually satisfying..."
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        ></textarea>
      </section>

      <section className="form-section">
        <label className="form-label">Optional photo</label>
        <Card className="attachment-card">
          <label className="attachment-button" htmlFor="meal-photo-input">
            <Camera size={18} />
            <span>{photoName ? 'Change photo' : 'Choose photo'}</span>
          </label>
          <input
            id="meal-photo-input"
            type="file"
            accept="image/*"
            className="attachment-input"
            onChange={handlePhotoChange}
          />

          {photoName ? (
            <div className="attachment-preview">
              {photoDataUrl && <img src={photoDataUrl} alt="Meal preview" className="attachment-thumbnail" />}
              <div className="attachment-copy">
                <strong>{photoName}</strong>
                <p>Attached to this meal entry.</p>
              </div>
            </div>
          ) : (
            <p className="attachment-helper">Totally optional. Add one if a picture helps you remember what actually worked.</p>
          )}
        </Card>
      </section>

      <div className="bottom-action-container">
        <Button variant="primary" fullWidth onClick={handleSave} className="save-btn">
          <Check size={20} className="btn-icon" />
          Save Meal
        </Button>
      </div>
    </div>
  );
};
