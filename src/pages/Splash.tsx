import React, { useEffect } from 'react';
import './Splash.css';
import { HeartPulse } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // 2 seconds delay
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="splash-logo-container">
          <HeartPulse size={64} className="splash-icon" />
        </div>
        <h1 className="splash-title">HerCare</h1>
        <p className="splash-subtitle">
          For your long days.
          <br />
          I'm here, even when I'm not beside you.
        </p>
      </div>
      
      {/* Aesthetic soft wave elements */}
      <div className="splash-wave wave-1"></div>
      <div className="splash-wave wave-2"></div>
    </div>
  );
};
