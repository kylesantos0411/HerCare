import React from 'react';
import { ArrowLeft, Heart, Sparkles, Star } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getOpenWhenCard } from '../utils/you';
import './OpenWhenScreen.css';

interface OpenWhenScreenProps {
  cardId: string | null;
  onBack: () => void;
}

export const OpenWhenScreen: React.FC<OpenWhenScreenProps> = ({ cardId, onBack }) => {
  const selectedCard = getOpenWhenCard(cardId);

  if (!selectedCard) {
    return (
      <div className="open-when-screen-container animation-slide-in">
        <header className="page-header open-when-screen-header">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <h1>Open When</h1>
        </header>

        <Card className="open-when-missing-card">
          <p className="open-when-screen-kicker">No card selected</p>
          <h2>Head back to your comfort corner</h2>
          <p className="text-muted">Pick one of the Open When cards from the You tab to see its message.</p>
        </Card>

        <div className="open-when-screen-actions">
          <Button variant="primary" fullWidth onClick={onBack}>
            Back to You
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="open-when-screen-container animation-slide-in">
      <header className="page-header open-when-screen-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h1>Open When</h1>
      </header>

      <Card className={`open-when-hero-card theme-${selectedCard.accent}`}>
        <div className="open-when-hero-topline">
          <span>Open when...</span>
          <Sparkles size={18} />
        </div>
        <h2>{selectedCard.title}</h2>
        <p className="open-when-hero-preview">{selectedCard.preview}</p>
        <p className="open-when-hero-reminder">{selectedCard.gentleReminder}</p>
      </Card>

      <section className="open-when-screen-section">
        <label className="open-when-section-label">Personalized message</label>
        <Card className="open-when-message-card">
          <div className="open-when-message-header">
            <Heart size={18} fill="currentColor" />
            <span>From Kai</span>
          </div>
          <div className="open-when-message-body">
            {selectedCard.message.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Card>
      </section>

      {selectedCard.steps.length > 0 && (
        <section className="open-when-screen-section">
          <label className="open-when-section-label">Try this next</label>
          <Card className="open-when-steps-card">
            {selectedCard.steps.map((step, index) => (
              <div key={step} className="open-when-step">
                <div className="open-when-step-number">0{index + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </Card>
        </section>
      )}

      {selectedCard.keepsakeText && (
        <section className="open-when-screen-section">
          <label className="open-when-section-label">Keepsake</label>
          <Card className="open-when-keepsake-card">
            <div className="open-when-keepsake-header">
              <Star size={18} />
              <span>{selectedCard.keepsakeTitle ?? 'Comfort snapshot'}</span>
            </div>
            <p>{selectedCard.keepsakeText}</p>
          </Card>
        </section>
      )}

      <div className="open-when-screen-actions">
        <Button variant="primary" fullWidth onClick={onBack}>
          Back to You
        </Button>
      </div>
    </div>
  );
};
