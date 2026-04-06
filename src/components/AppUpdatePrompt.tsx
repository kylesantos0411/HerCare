import React from 'react';
import { Download, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import type { AppUpdateInfo } from '../utils/appUpdate';
import { APP_VERSION } from '../utils/appInfo';
import './AppUpdatePrompt.css';

interface AppUpdatePromptProps {
  update: AppUpdateInfo;
  onLater: () => void;
  onOpenUpdate: () => void;
}

export const AppUpdatePrompt: React.FC<AppUpdatePromptProps> = ({ update, onLater, onOpenUpdate }) => {
  return (
    <div className="app-update-overlay" role="dialog" aria-modal="true" aria-labelledby="app-update-title">
      <div className="app-update-backdrop" aria-hidden="true"></div>

      <Card className="app-update-modal">
        <div className="app-update-kicker">
          <Sparkles size={14} />
          Update ready
        </div>

        <h3 id="app-update-title">A newer HerCare build is available.</h3>
        <p className="app-update-copy">
          Version {update.version} is ready on GitHub. You’re currently on {APP_VERSION}.
        </p>

        <div className="app-update-meta">
          <span>Current {APP_VERSION}</span>
          <span>Latest {update.version}</span>
        </div>

        <div className="app-update-actions">
          <Button variant="secondary" fullWidth onClick={onLater}>
            Later
          </Button>
          <Button variant="primary" fullWidth onClick={onOpenUpdate}>
            <Download size={16} />
            Open GitHub
          </Button>
        </div>
      </Card>
    </div>
  );
};
