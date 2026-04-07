import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronRight, ClipboardList, FileText, Plus, ShoppingBag } from 'lucide-react';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  getChecklistItems,
  getNoteCategory,
  getNoteCount,
  getNotesByCategory,
  getCompletedChecklistCount,
  isChecklistCategory,
  type NoteCategory,
  type NoteItem,
} from '../utils/notes';
import './Notes.css';

interface NotesProps {
  onAddNote: (category?: NoteCategory) => void;
}

const categoryCards: Array<{
  category: NoteCategory;
  icon: typeof ShoppingBag;
  className: string;
  description: string;
}> = [
  {
    category: 'Buy List',
    icon: ShoppingBag,
    className: 'variant-secondary',
    description: 'Groceries, supplies, and tiny errands',
  },
  {
    category: 'Duty To-Dos',
    icon: ClipboardList,
    className: 'variant-accent',
    description: 'Handover reminders and shift follow-ups',
  },
  {
    category: 'Personal Notes',
    icon: BookOpen,
    className: 'variant-primary',
    description: 'Journal thoughts and personal reminders',
  },
];

export const Notes: React.FC<NotesProps> = ({ onAddNote }) => {
  const [notes, setNotes] = useLocalStorage<NoteItem[]>('hercare_user_notes', []);
  const [activeCategory, setActiveCategory] = useState<NoteCategory | 'All'>('All');

  const filteredNotes = useMemo(() => getNotesByCategory(notes, activeCategory), [notes, activeCategory]);
  const recentNotes = filteredNotes.slice(0, 8);

  const toggleChecklistItem = (noteId: string, itemId: string) => {
    setNotes((currentNotes) =>
      currentNotes.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        return {
          ...note,
          checklistItems: getChecklistItems(note).map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        };
      }),
    );
  };

  return (
    <div className="notes-container">
      <header className="page-header">
        <div className="notes-header-row">
          <div>
            <h1>My Notes</h1>
            <p className="subtitle">Jot it down so you can let it go.</p>
          </div>
          <button
            className="add-note-btn-header"
            onClick={() => onAddNote(activeCategory === 'All' ? undefined : activeCategory)}
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      <div className="notes-layout">
        <div className="notes-browser-rail">
          <div className="notes-filter-row">
            <button
              className={`notes-filter-chip ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All Notes
            </button>
          </div>

          <section className="notes-categories">
            {categoryCards.map((card) => {
              const Icon = card.icon;
              const noteCount = getNoteCount(notes, card.category);
              const isActive = activeCategory === card.category;

              return (
                <Card
                  key={card.category}
                  className={`note-card ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(card.category)}
                >
                  <div className="note-card-inner">
                    <div className={`note-icon-wrapper ${card.className}`}>
                      <Icon size={20} />
                    </div>
                    <div className="note-card-content">
                      <h3>{card.category}</h3>
                      <p className="text-muted">
                        {noteCount} {noteCount === 1 ? 'note' : 'notes'} | {card.description}
                      </p>
                    </div>
                    <ChevronRight className="note-arrow" size={20} />
                  </div>
                </Card>
              );
            })}
          </section>
        </div>

        <div className="recent-notes-preview">
        {recentNotes.length > 0 ? (
          <>
            <div className="notes-section-header">
              <h3>{activeCategory === 'All' ? 'Recent Notes' : activeCategory}</h3>
              {activeCategory !== 'All' && (
                <button className="section-add-btn" onClick={() => onAddNote(activeCategory)}>
                  Add Note
                </button>
              )}
            </div>
            <div className="notes-preview-list">
              {recentNotes.map((note) => (
                <Card key={note.id} className="preview-card">
                  <div className="preview-card-topline">
                    <h4>{note.title}</h4>
                    <span>{note.date}</span>
                  </div>
                  <p className="preview-category">{getNoteCategory(note)}</p>

                  {isChecklistCategory(getNoteCategory(note)) && getChecklistItems(note).length > 0 ? (
                    <>
                      <p className="checklist-progress-copy">
                        {getCompletedChecklistCount(note)} of {getChecklistItems(note).length} checked
                      </p>
                      <div className="checklist-preview-list">
                        {getChecklistItems(note)
                          .slice(0, 4)
                          .map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={`checklist-preview-item ${item.checked ? 'checked' : ''}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                toggleChecklistItem(note.id, item.id);
                              }}
                            >
                              <span className="checklist-preview-box">{item.checked ? '✓' : ''}</span>
                              <span className="checklist-preview-text">{item.text}</span>
                            </button>
                          ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted preview-body">{note.body || 'No extra details yet.'}</p>
                  )}

                  {note.reminderEnabled && <span className="note-reminder-chip">Reminder on</span>}
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="notes-section-header">
              <h3>{activeCategory === 'All' ? 'Recent' : activeCategory}</h3>
              <button
                className="section-add-btn"
                onClick={() => onAddNote(activeCategory === 'All' ? undefined : activeCategory)}
              >
                Add Note
              </button>
            </div>
            <Card className="preview-card empty-preview-card">
              <div className="empty-preview-content">
                <FileText size={32} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p className="text-muted">No notes here yet.</p>
              </div>
            </Card>
          </>
        )}
        </div>
      </div>
    </div>
  );
};
