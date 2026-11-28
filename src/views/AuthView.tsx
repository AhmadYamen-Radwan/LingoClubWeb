import React, { useState } from 'react';
import { CefrLevel } from '../types';
import { useApp } from '../context/AppContext';
import { CEFR_LEVELS, CEFR_LABELS } from '../utils/constants';
import { LanguageCubeCanvas } from '../components/Canvas3D';

export const AuthView: React.FC = () => {
  const { signInWithGoogle, enterOfflineMode, profile, setLearningLevel, sfx } = useApp();
  const [nickname, setNickname] = useState(
    profile.displayName && profile.displayName !== 'Offline Explorer' ? profile.displayName : ''
  );
  const [selectedCefr, setSelectedCefr] = useState<string>(profile.learningLevel || CefrLevel.B1);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogle = async () => {
    setBusy(true);
    setErrorMsg('');
    sfx.playClick();
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Google sign-in popup was cancelled or unavailable. You can use Offline Club below.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playSuccess();
    await setLearningLevel(selectedCefr);
    enterOfflineMode(nickname || 'Explorer');
  };

  return (
    <div className="stack-lg" style={{ maxWidth: 680, margin: '20px auto' }}>
      <section className="hero-banner">
        <div className="hero-banner-media" style={{ minHeight: 220 }}>
          <img src="/assets/img_hero_studio.jpg" alt="LingoClub social English and Arabic learning studio" />
          <div className="hero-banner-overlay row-between row-wrap">
            <div className="stack-xs" style={{ flex: 1, minWidth: 220 }}>
              <span className="xs" style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                LINGOCLUB STUDIO
              </span>
              <h1 className="display-title" style={{ color: '#FFFFFF', margin: 0 }}>
                Play, Party & Level Up Your English
              </h1>
              <p className="small" style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                Live trivia rooms, detective mysteries, 18 arcade games, bilingual stories, and squad chat with stickers.
              </p>
            </div>
            <LanguageCubeCanvas size={108} />
          </div>
        </div>
      </section>

      <div className="card stack-md">
        <div className="stack-xs">
          <h2 className="section-title" style={{ margin: 0 }}>
            Cloud Account (Firebase Sync)
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            Save your XP, badges, 200-word quest progress, and live multiplayer rooms across devices.
          </p>
        </div>

        {errorMsg ? (
          <div className="card card-soft-secondary" role="alert" style={{ padding: 12 }}>
            <span className="small">{errorMsg}</span>
          </div>
        ) : null}

        <button
          type="button"
          className="btn btn-primary btn-full"
          disabled={busy}
          onClick={handleGoogle}
        >
          {busy ? 'Opening Google Sign-In...' : 'Continue with Google'}
        </button>

        <hr style={{ border: 0, borderTop: '1px solid var(--outline-soft)', margin: '4px 0' }} />

        <form onSubmit={handleOffline} className="stack-sm">
          <div className="stack-xs">
            <h2 className="section-title" style={{ margin: 0 }}>
              Instant Offline & Cross-Tab Club
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              Play solo or host cross-tab local PIN quiz rooms & buzzers without an account.
            </p>
          </div>

          <div className="stack-xs">
            <label htmlFor="auth-nickname" className="field-label">
              Your Display Name
            </label>
            <input
              id="auth-nickname"
              type="text"
              className="field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Maya, Omar, Explorer..."
              maxLength={40}
            />
          </div>

          <div className="stack-xs">
            <span className="field-label">Pick Your Starting CEFR Level</span>
            <div className="row-wrap">
              {CEFR_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`chip ${selectedCefr === lvl ? 'selected' : ''}`}
                  onClick={() => {
                    sfx.playClick();
                    setSelectedCefr(lvl);
                  }}
                >
                  {CEFR_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-mint btn-full">
            Enter Studio Now →
          </button>
        </form>
      </div>
    </div>
  );
};
