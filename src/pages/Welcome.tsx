import React from 'react';
import { Button } from '../components/Button';
import './Welcome.css';
import { Stethoscope } from 'lucide-react';

interface WelcomeProps {
  onNext: () => void;
  onBack: () => void;
  onPartnerView: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNext, onBack, onPartnerView }) => {
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
        <h1 className="welcome-heading">This is for you, baby.</h1>
        <p className="welcome-description">
          For your long shifts, pagod days, and quiet moments.
          <br />
          A small space where you can pause, breathe,
          <br />
          and remember someone's always here for you.
        </p>
      </div>
      
      <div className="welcome-actions">
        <Button variant="primary" fullWidth onClick={onNext} className="mb-12">Get Started</Button>
        <Button variant="outline" fullWidth onClick={onPartnerView} className="mb-12">Partner View</Button>
        <Button variant="ghost" fullWidth onClick={onBack}>Go back</Button>
      </div>
    </div>
  );
};
