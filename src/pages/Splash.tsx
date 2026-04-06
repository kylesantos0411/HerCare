import React, { useEffect } from 'react';
import './Splash.css';
import { HeartPulse } from 'lucide-react';
import { APP_VARIANT_CONFIG } from '../config/appVariant';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const personalTone = APP_VARIANT_CONFIG.features.personalTone;

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
        <h1 className="splash-title">{APP_VARIANT_CONFIG.appName}</h1>
        <p className="splash-subtitle">
          {personalTone ? (
            <>
              For your long days.
              <br />
              I&apos;m here, even when I&apos;m not beside you.
            </>
          ) : (
            <>
              For your long days.
              <br />
              A simple space to check in and keep the basics steady.
            </>
          )}
        </p>
      </div>
      
      {/* Aesthetic soft wave elements */}
      <div className="splash-wave wave-1"></div>
      <div className="splash-wave wave-2"></div>
    </div>
  );
};
