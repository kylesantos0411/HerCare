import React, { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, Clock3, NotebookPen } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ShiftEntry, ShiftType } from '../utils/shift';
import './ShiftEditor.css';

interface ShiftEditorProps {
  shiftId: string | null;
  onBack: () => void;
  onSave: () => void;
}

const shiftTypes: ShiftType[] = ['Night Duty', 'Day Shift', 'Rotating', 'Manual'];

export const ShiftEditor: React.FC<ShiftEditorProps> = ({ shiftId, onBack, onSave }) => {
  const [scheduledShifts, setScheduledShifts] = useLocalStorage<ShiftEntry[]>('hercare_scheduled_shifts', []);
  const [shiftPreference] = useLocalStorage<ShiftType>('hercare_shift_preference', 'Night Duty');
  const existingShift = useMemo(
    () => scheduledShifts.find((shift) => shift.id === shiftId) ?? null,
    [scheduledShifts, shiftId],
  );

  const [date, setDate] = useState(existingShift?.date ?? '');
  const [shiftType, setShiftType] = useState<ShiftType>(existingShift?.type ?? shiftPreference);
  const [startTime, setStartTime] = useState(existingShift?.startTime ?? '19:20');
  const [endTime, setEndTime] = useState(existingShift?.endTime ?? '07:00');
  const [notes, setNotes] = useState(existingShift?.notes ?? '');

  const handleSave = () => {
    if (!date) {
      return;
    }

    const now = new Date();
    const nextShift: ShiftEntry = {
      id: existingShift?.id ?? now.getTime().toString(),
      date,
      type: shiftType,
      startTime,
      endTime,
      notes: notes.trim(),
    };

    setScheduledShifts((currentShifts) =>
      existingShift
        ? currentShifts.map((shift) => (shift.id === existingShift.id ? nextShift : shift))
        : [nextShift, ...currentShifts],
    );
    onSave();
  };

  return (
    <div className="shift-editor-container animation-slide-in">
      <header className="page-header shift-editor-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>{existingShift ? 'Edit Shift' : 'Add Shift'}</h1>
      </header>

      <section className="shift-editor-section">
        <label className="shift-editor-label">Shift type</label>
        <div className="shift-type-grid">
          {shiftTypes.map((option) => (
            <button
              key={option}
              className={`shift-type-btn ${shiftType === option ? 'active' : ''}`}
              onClick={() => setShiftType(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="shift-editor-section">
        <Card className="shift-editor-card">
          <div className="shift-editor-row">
            <div className="shift-editor-icon">
              <CalendarDays size={20} />
            </div>
            <div className="shift-editor-field">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="shift-editor-input"
              />
            </div>
          </div>

          <div className="shift-editor-divider"></div>

          <div className="shift-editor-row">
            <div className="shift-editor-icon">
              <Clock3 size={20} />
            </div>
            <div className="shift-editor-field">
              <label>Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="shift-editor-input"
              />
            </div>
          </div>

          <div className="shift-editor-divider"></div>

          <div className="shift-editor-row">
            <div className="shift-editor-icon">
              <Clock3 size={20} />
            </div>
            <div className="shift-editor-field">
              <label>End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="shift-editor-input"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="shift-editor-section">
        <label className="shift-editor-label">Notes</label>
        <div className="shift-notes-wrapper">
          <div className="shift-notes-icon">
            <NotebookPen size={18} />
          </div>
          <textarea
            className="shift-notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Handoff details, unit, or anything helpful for later."
          ></textarea>
        </div>
      </section>

      <div className="shift-editor-actions">
        <Button variant="primary" fullWidth onClick={handleSave} disabled={!date}>
          <Check size={20} className="btn-icon" />
          Save Shift
        </Button>
      </div>
    </div>
  );
};
