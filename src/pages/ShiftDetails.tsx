import React from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, Clock3, Plus, PencilLine } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  formatShiftDateLabel,
  formatShiftDateShort,
  formatShiftTimeRange,
  getNextShift,
  getShiftStatus,
  getUpcomingShifts,
  type ShiftEntry,
} from '../utils/shift';
import './ShiftDetails.css';

interface ShiftDetailsProps {
  onBack: () => void;
  onAddShift: () => void;
  onEditShift: (shiftId: string) => void;
}

const preShiftTasks = [
  { id: 'pack-meals', label: 'Pack meals' },
  { id: 'check-uniform', label: 'Check uniform' },
  { id: 'drink-water', label: 'Drink water before commute' },
] as const;

export const ShiftDetails: React.FC<ShiftDetailsProps> = ({ onBack, onAddShift, onEditShift }) => {
  const [scheduledShifts] = useLocalStorage<ShiftEntry[]>('hercare_scheduled_shifts', []);
  const [shiftTaskState, setShiftTaskState] = useLocalStorage<Record<string, string[]>>('hercare_shift_task_state', {});
  const nextShift = getNextShift(scheduledShifts);
  const weeklyShifts = getUpcomingShifts(scheduledShifts).slice(0, 7);
  const nextShiftStatus = nextShift ? getShiftStatus(nextShift) : null;
  const nextShiftStatusClass = nextShiftStatus?.toLowerCase().replace(/\s+/g, '-') ?? '';
  const taskStateKey = nextShift?.id ?? 'general';
  const completedTaskIds = shiftTaskState[taskStateKey] ?? [];

  const toggleTask = (taskId: string) => {
    setShiftTaskState((currentState) => {
      const currentTasks = currentState[taskStateKey] ?? [];
      const nextTasks = currentTasks.includes(taskId)
        ? currentTasks.filter((currentTaskId) => currentTaskId !== taskId)
        : [...currentTasks, taskId];

      return {
        ...currentState,
        [taskStateKey]: nextTasks,
      };
    });
  };

  return (
    <div className="shift-details-container">
      <header className="modal-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h1>Shift Schedule</h1>
        <div className="shift-header-spacer"></div>
      </header>

      <section className="current-shift">
        {nextShift ? (
          <Card variant="primary" className="large-shift-card">
            <div className={`status-badge ${nextShiftStatusClass}`}>{nextShiftStatus}</div>
            <p className="shift-card-kicker">Next up</p>
            <h2>{nextShift.type}</h2>
            <div className="shift-info-row">
              <CalendarDays size={18} />
              <span>{formatShiftDateShort(nextShift.date)}</span>
            </div>
            <div className="shift-info-row">
              <Clock3 size={18} />
              <span>{formatShiftTimeRange(nextShift.startTime, nextShift.endTime)}</span>
            </div>
            {nextShift.notes && <p className="current-shift-note">{nextShift.notes}</p>}
          </Card>
        ) : (
          <Card className="empty-shift-card">
            <p className="shift-card-kicker">No shift scheduled</p>
            <h2>Plan your next shift</h2>
            <p className="text-muted">Add a shift to see it on Home and keep the week feeling more grounded.</p>
          </Card>
        )}
      </section>

      <section className="shift-schedule">
        <div className="section-header">
          <div>
            <h3>This Week</h3>
            <p className="section-subtitle">Tap a shift card to edit it.</p>
          </div>
          <Button variant="secondary" onClick={onAddShift}>
            <Plus size={18} />
            Add
          </Button>
        </div>

        {weeklyShifts.length > 0 ? (
          <div className="shift-schedule-list">
            {weeklyShifts.map((shift) => {
              const status = getShiftStatus(shift);
              const statusClass = status.toLowerCase().replace(/\s+/g, '-');

              return (
                <Card key={shift.id} className="shift-schedule-item" onClick={() => onEditShift(shift.id)}>
                  <div className="shift-schedule-copy">
                    <div className="shift-schedule-topline">
                      <h4>{shift.type}</h4>
                      <span className={`schedule-status ${statusClass}`}>{status}</span>
                    </div>
                    <p className="shift-schedule-time">{formatShiftDateLabel(shift.date)}</p>
                    <p className="shift-schedule-time">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
                    {shift.notes && <p className="shift-schedule-notes">{shift.notes}</p>}
                  </div>
                  <div className="shift-edit-icon">
                    <PencilLine size={18} />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="empty-list-card">
            <p className="text-muted">No scheduled shifts yet. Add one to build out your week.</p>
          </Card>
        )}
      </section>

      <div className="shift-tasks">
        <h3>Pre-shift Tasks</h3>
        <Card className="task-card">
          {preShiftTasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);

            return (
              <button
                key={task.id}
                className={`task-item ${isCompleted ? 'completed' : ''}`}
                onClick={() => toggleTask(task.id)}
                aria-pressed={isCompleted}
              >
                <div className={`task-icon ${isCompleted ? 'checked' : 'placeholder'}`}>
                  {isCompleted ? (
                    <CheckCircle2 size={20} color="var(--color-secondary)" />
                  ) : (
                    <Circle size={20} color="var(--color-primary)" />
                  )}
                </div>
                <span>{task.label}</span>
              </button>
            );
          })}
        </Card>
      </div>

      <div className="shift-actions-bottom">
        {nextShift && (
          <Button variant="outline" fullWidth style={{ marginBottom: 12 }} onClick={() => onEditShift(nextShift.id)}>
            Edit Next Shift
          </Button>
        )}
        <Button variant="primary" fullWidth onClick={onAddShift}>
          {nextShift ? 'Add Another Shift' : 'Create First Shift'}
        </Button>
      </div>
    </div>
  );
};
