import React from 'react';
import { ArrowRight, Heart, Sparkles, Star } from 'lucide-react';
import { Card } from '../components/Card';
import {
  comfortCornerItems,
  getFeaturedMessage,
  getSavedMessages,
  openWhenCards,
} from '../utils/you';
import './You.css';

interface YouProps {
  onOpenCard: (cardId: string) => void;
}

export const You: React.FC<YouProps> = ({ onOpenCard }) => {
  const featuredMessage = getFeaturedMessage();
  const savedMessages = getSavedMessages();

  return (
    <div className="you-container">
      <header className="page-header">
        <h1>For You</h1>
        <p className="subtitle">Your personal comfort corner.</p>
      </header>

      <section className="message-section">
        <Card variant="primary" className="hero-msg-card">
          <div className="hero-msg-header">
            <Heart size={20} fill="white" />
            <h3>Message From Kai</h3>
          </div>
          <p className="hero-msg-kicker">{featuredMessage.title}</p>
          <p className="hero-msg-text">"{featuredMessage.body}"</p>
          <span className="hero-msg-signoff">{featuredMessage.signoff}</span>
        </Card>

        <div className="saved-message-list">
          {savedMessages.map((message) => (
            <Card key={message.id} className="saved-message-card">
              <p className="saved-message-tag">{message.title}</p>
              <p className="saved-message-body">{message.snippet}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="comfort-corner-section">
        <div className="section-title">
          <div className="section-title-row">
            <Star size={18} color="var(--color-accent)" />
            <h3>Comfort Corner</h3>
          </div>
          <p className="section-caption">Keep it tiny. Tiny still counts.</p>
        </div>

        <Card className="comfort-corner-card">
          <p className="comfort-kicker">Right now</p>
          <h3>Three small ways to soften the edge of a hard shift.</h3>

          <div className="comfort-list">
            {comfortCornerItems.map((item, index) => (
              <div key={item.id} className="comfort-item">
                <div className="comfort-number">0{index + 1}</div>
                <div className="comfort-copy">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="comfort-note">You don't have to fix everything right now. Hindi ka robot, baby. Small resets lang, okay na.</p>
        </Card>
      </section>

      <section className="open-when-section">
        <div className="section-title">
          <div className="section-title-row">
            <Sparkles size={18} color="var(--color-accent)" />
            <h3>Open When</h3>
          </div>
          <p className="section-caption">Tap a card for the longer version.</p>
        </div>

        <div className="open-when-cards">
          {openWhenCards.map((card) => (
            <Card key={card.id} className={`open-when-item theme-${card.accent}`} onClick={() => onOpenCard(card.id)}>
              <div className="open-when-header">
                <div className="open-when-copy">
                  <p className="open-when-kicker">Open when...</p>
                  <span className="open-when-title">{card.title}</span>
                  <p className="open-when-preview">{card.preview}</p>
                </div>
                <div className="open-when-action">
                  <span>Open now</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
