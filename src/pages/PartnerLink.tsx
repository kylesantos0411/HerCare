import React, { useState } from 'react';
import { ChevronLeft, HeartHandshake, Link2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isFirebaseConfigured } from '../utils/firebase';
import { connectToPartnerShare, normalizeShareCode } from '../utils/partner';
import './PartnerLink.css';

interface PartnerLinkProps {
  onBack: () => void;
  onConnected: (shareCode: string) => void;
}

export const PartnerLink: React.FC<PartnerLinkProps> = ({ onBack, onConnected }) => {
  const [partnerName, setPartnerName] = useLocalStorage('hercare_partner_view_name', 'Kai');
  const [shareCode, setShareCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const configured = isFirebaseConfigured();

  const handleConnect = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const normalizedCode = await connectToPartnerShare(shareCode, partnerName);
      onConnected(normalizedCode);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to open partner view right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="partner-screen partner-link-screen animation-slide-in">
      <header className="page-header partner-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1>Partner View</h1>
          <p className="subtitle">Use the private share code from her phone to open the live dashboard.</p>
        </div>
      </header>

      {!configured ? (
        <Card className="partner-empty-card">
          <div className="partner-empty-icon">
            <HeartHandshake size={22} />
          </div>
          <h3>Firebase setup still needed</h3>
          <p>
            This feature is ready in the app, but it still needs your Firebase project keys in
            <strong> `.env.local`</strong> before partner syncing can go online.
          </p>
          <p className="partner-note">
            After that, enable Anonymous Auth and Cloud Firestore once in Firebase, then rebuild the app.
          </p>
        </Card>
      ) : (
        <>
          <Card className="partner-form-card">
            <div className="partner-input-group">
              <label htmlFor="partner-share-code">Private share code</label>
              <div className="partner-input-shell">
                <Link2 size={18} />
                <input
                  id="partner-share-code"
                  className="partner-input"
                  value={shareCode}
                  onChange={(event) => setShareCode(normalizeShareCode(event.target.value))}
                  placeholder="ABCD1234"
                  maxLength={8}
                  autoCapitalize="characters"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div className="partner-input-group">
              <label htmlFor="partner-name">How should you appear?</label>
              <div className="partner-input-shell">
                <HeartHandshake size={18} />
                <input
                  id="partner-name"
                  className="partner-input"
                  value={partnerName}
                  onChange={(event) => setPartnerName(event.target.value)}
                  placeholder="Kai"
                />
              </div>
            </div>

            {error && <p className="partner-error">{error}</p>}

            <Button fullWidth onClick={handleConnect} disabled={isSubmitting}>
              {isSubmitting ? 'Connecting...' : 'Open Partner View'}
            </Button>
          </Card>

          <Card className="partner-tip-card">
            <p className="partner-tip-kicker">Private by design</p>
            <p>
              This only works with the private code created on her phone. Without that code, this dashboard cannot
              connect.
            </p>
          </Card>
        </>
      )}
    </div>
  );
};
