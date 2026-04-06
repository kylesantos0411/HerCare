export type NoteCategory = 'Buy List' | 'Duty To-Dos' | 'Personal Notes';

export interface NoteChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  date: string;
  category?: NoteCategory;
  reminderEnabled?: boolean;
  checklistItems?: NoteChecklistItem[];
}

export const noteCategoryOptions: NoteCategory[] = ['Buy List', 'Duty To-Dos', 'Personal Notes'];

export function getNoteCategory(note: NoteItem) {
  return note.category ?? 'Personal Notes';
}

export function isChecklistCategory(category: NoteCategory) {
  return category === 'Buy List' || category === 'Duty To-Dos';
}

export function getChecklistItems(note: NoteItem): NoteChecklistItem[] {
  if (note.checklistItems && note.checklistItems.length > 0) {
    return note.checklistItems;
  }

  if (!isChecklistCategory(getNoteCategory(note)) || !note.body.trim()) {
    return [];
  }

  return note.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `${note.id}-${index}`,
      text,
      checked: false,
    }));
}

export function getCompletedChecklistCount(note: NoteItem) {
  return getChecklistItems(note).filter((item) => item.checked).length;
}

export function getNotesByCategory(notes: NoteItem[], category: NoteCategory | 'All') {
  if (category === 'All') {
    return notes;
  }

  return notes.filter((note) => getNoteCategory(note) === category);
}

export function getNoteCount(notes: NoteItem[], category: NoteCategory) {
  return notes.filter((note) => getNoteCategory(note) === category).length;
}
