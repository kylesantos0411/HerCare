import React from 'react';
import { Button } from '../components/Button';
import { APP_VARIANT_CONFIG } from '../config/appVariant';
import './Welcome.css';
import { Stethoscope } from 'lucide-react';

interface WelcomeProps {
  onNext: () => void;
  onBack: () => void;
  onPartnerView: () => void;
  showPartnerView: boolean;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNext, onBack, onPartnerView, showPartnerView }) => {
  const personalTone = APP_VARIANT_CONFIG.features.personalTone;

  return (
    <div className="welcome-container">
      <div className="welcome-graphics">
        <div className="welcome-circle main-circle">
          <Stethoscope size={64} className="welcome-illustration" />
        </div>
        <div className="welcome-circle decor-1"></div>
        <div className="welcome-circle decor-2"></div>
      </div>
      
      <div className="welcome-text-section">
        <h1 className="welcome-heading">
          {personalTone ? 'This is for you, baby.' : 'Your simple care space.'}
        </h1>
        <p className="welcome-description">
          {personalTone ? (
            <>
              For your long shifts, pagod days, and quiet moments.
              <br />
              A small space where you can pause, breathe,
              <br />
              and remember someone&apos;s always here for you.
            </>
          ) : (
            <>
              Track your basics for long shifts, busy days, and recovery time.
              <br />
              A calm space for hydration, meals, mood,
              <br />
              sleep, notes, and focus.
            </>
          )}
        </p>
      </div>
      
      <div className="welcome-actions">
        <Button variant="primary" fullWidth onClick={onNext} className="mb-12">Get Started</Button>
        {showPartnerView && (
          <Button variant="outline" fullWidth onClick={onPartnerView} className="mb-12">Partner View</Button>
        )}
        <Button variant="ghost" fullWidth onClick={onBack}>Go back</Button>
      </div>
    </div>
  );
};
