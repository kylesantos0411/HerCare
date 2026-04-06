export type ShiftType = 'Night Duty' | 'Day Shift' | 'Rotating' | 'Manual';

export interface ShiftEntry {
  id: string;
  date: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  notes: string;
}

const shiftTypeOrder: Record<ShiftType, number> = {
  'Night Duty': 1,
  'Day Shift': 2,
  Rotating: 3,
  Manual: 4,
};

function parseDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function getShiftWindow(shift: ShiftEntry) {
  const start = parseDateTime(shift.date, shift.startTime);
  const end = parseDateTime(shift.date, shift.endTime);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

export function sortShifts(shifts: ShiftEntry[]) {
  return [...shifts].sort((left, right) => {
    const leftStart = getShiftWindow(left).start.getTime();
    const rightStart = getShiftWindow(right).start.getTime();

    if (leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return shiftTypeOrder[left.type] - shiftTypeOrder[right.type];
  });
}

export function getUpcomingShifts(shifts: ShiftEntry[], now = new Date()) {
  return sortShifts(shifts).filter((shift) => getShiftWindow(shift).end >= now);
}

export function getNextShift(shifts: ShiftEntry[], now = new Date()) {
  return getUpcomingShifts(shifts, now)[0] ?? null;
}

export function getShiftStatus(shift: ShiftEntry, now = new Date()) {
  const { start, end } = getShiftWindow(shift);

  if (start <= now && now < end) {
    return 'In Progress';
  }

  if (start > now) {
    return 'Upcoming';
  }

  return 'Completed';
}

export function formatShiftDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShiftDateShort(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatShiftTimeRange(startTime: string, endTime: string) {
  const format = (time: string) =>
    new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  return `${format(startTime)} - ${format(endTime)}`;
}
