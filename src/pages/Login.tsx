import React, { useState } from 'react';
import { KeyRound, LockKeyhole, Stethoscope } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
  onCreateAccount: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onCreateAccount }) => {
  const [savedName, setSavedName] = useLocalStorage('hercare_user_name', '');
  const [draftName, setDraftName] = useState(savedName);

  const handleLogin = () => {
    const trimmedName = draftName.trim();

    if (!trimmedName) {
      return;
    }

    setSavedName(trimmedName);
    onLogin();
  };

  return (
    <div className="login-container">
      <div className="login-hero">
        <div className="login-icon-shell">
          <Stethoscope size={44} />
        </div>
        <h1>Welcome back</h1>
        <p>Use your saved local profile name to get back into HerCare.</p>
      </div>

      <Card className="login-card">
        <div className="login-card-row">
          <div className="login-row-icon">
            <KeyRound size={18} />
          </div>
          <div className="login-field">
            <label>Name</label>
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Enter your saved name"
              className="login-input"
            />
          </div>
        </div>

        <div className="login-divider"></div>

        <div className="login-helper">
          <LockKeyhole size={16} />
          <span>{savedName ? `Saved locally as ${savedName}.` : 'No local profile found yet. You can start setup instead.'}</span>
        </div>
      </Card>

      <div className="login-actions">
        <Button variant="primary" fullWidth onClick={handleLogin} disabled={!draftName.trim()}>
          Log In
        </Button>
        <Button variant="ghost" fullWidth onClick={onCreateAccount}>
          Create New Account
        </Button>
      </div>
    </div>
  );
};
