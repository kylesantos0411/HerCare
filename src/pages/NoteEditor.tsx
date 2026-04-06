import React, { useState } from 'react';
import { Bell, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  isChecklistCategory,
  noteCategoryOptions,
  type NoteChecklistItem,
  type NoteCategory,
  type NoteItem,
} from '../utils/notes';
import './NoteEditor.css';

interface NoteEditorProps {
  initialCategory: NoteCategory | null;
  onBack: () => void;
  onSave: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ initialCategory, onBack, onSave }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<NoteCategory>(initialCategory ?? 'Personal Notes');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [draftChecklistItem, setDraftChecklistItem] = useState('');
  const [checklistItems, setChecklistItems] = useState<NoteChecklistItem[]>([]);
  const [, setNotes] = useLocalStorage<NoteItem[]>('hercare_user_notes', []);
  const usesChecklist = isChecklistCategory(category);

  const addChecklistItem = () => {
    const trimmedItem = draftChecklistItem.trim();

    if (!trimmedItem) {
      return;
    }

    setChecklistItems((currentItems) => [
      ...currentItems,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: trimmedItem,
        checked: false,
      },
    ]);
    setDraftChecklistItem('');
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklistItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const handleSave = () => {
    const trimmedBody = body.trim();
    const pendingChecklistItems = draftChecklistItem.trim()
      ? [
          ...checklistItems,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: draftChecklistItem.trim(),
            checked: false,
          },
        ]
      : checklistItems;
    const normalizedChecklistItems = pendingChecklistItems
      .map((item) => ({
        ...item,
        text: item.text.trim(),
      }))
      .filter((item) => item.text);

    if (!title.trim() && !trimmedBody && normalizedChecklistItems.length === 0) {
      onBack();
      return;
    }

    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: title.trim() || (usesChecklist ? category : 'Untitled Note'),
      body: trimmedBody,
      category,
      reminderEnabled,
      checklistItems: usesChecklist ? normalizedChecklistItems : undefined,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setNotes((currentNotes) => [newNote, ...currentNotes]);
    onSave();
  };

  return (
    <div className="note-editor-container animation-slide-in">
      <header className="page-header editor-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <button className="text-save-btn" onClick={handleSave}>
          Save
        </button>
      </header>

      <div className="editor-content">
        <div className="editor-meta">
          <div className="editor-category-row">
            {noteCategoryOptions.map((option) => (
              <button
                key={option}
                className={`editor-category-chip ${category === option ? 'active' : ''}`}
                onClick={() => setCategory(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="editor-reminder-toggle">
            <div className="editor-reminder-copy">
              <Bell size={16} />
              <span>Reminder</span>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(event) => setReminderEnabled(event.target.checked)}
            />
          </label>
        </div>

        <input
          type="text"
          className="editor-title"
          placeholder="Title"
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <p className="editor-date">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

        {usesChecklist ? (
          <div className="editor-checklist-layout">
            <div className="editor-checklist-input-row">
              <input
                type="text"
                className="editor-checklist-input"
                placeholder={category === 'Buy List' ? 'Add an item to buy' : 'Add a task to handle'}
                value={draftChecklistItem}
                onChange={(event) => setDraftChecklistItem(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addChecklistItem();
                  }
                }}
              />
              <button type="button" className="editor-checklist-add-btn" onClick={addChecklistItem}>
                <Plus size={18} />
                <span>Add</span>
              </button>
            </div>

            {checklistItems.length > 0 ? (
              <div className="editor-checklist-list">
                {checklistItems.map((item) => (
                  <div key={item.id} className="editor-checklist-item">
                    <div className="editor-checklist-bullet"></div>
                    <span>{item.text}</span>
                    <button
                      type="button"
                      className="editor-checklist-remove-btn"
                      onClick={() => removeChecklistItem(item.id)}
                      aria-label={`Remove ${item.text}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="editor-checklist-empty">
                <p>{category === 'Buy List' ? 'Build your list one item at a time.' : 'Add the tasks you want to check off later.'}</p>
              </div>
            )}

            <textarea
              className="editor-body editor-body-secondary"
              placeholder="Optional details..."
              value={body}
              onChange={(event) => setBody(event.target.value)}
            ></textarea>
          </div>
        ) : (
          <textarea
            className="editor-body"
            placeholder="Start typing..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          ></textarea>
        )}
      </div>
    </div>
  );
};
