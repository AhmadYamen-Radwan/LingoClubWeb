import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CEFR_LABELS,
  CEFR_LEVELS,
  formatRelTime,
  LINGO_BADGES,
} from '../utils/constants';
import { CefrBadge } from '../components/CefrBadge';

export const ProfileView: React.FC = () => {
  const {
    profile,
    isOfflineMode,
    user,
    sessions,
    updateDisplayName,
    setLearningLevel,
    signInWithGoogle,
    signOut,
    sfx,
    navigate,
  } = useApp();

  const [nameInput, setNameInput] = useState(profile.displayName);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playSuccess();
    updateDisplayName(nameInput);
  };

  return (
    <div className="stack-lg" data-testid="profile-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            👤 Player Profile
          </h1>
          <span className="small muted">
            {isOfflineMode
              ? 'Offline Explorer Mode (Saved locally on this browser)'
              : `Signed in as ${user?.email || profile.displayName}`}
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      {/* Identity & Level Settings */}
      <section className="card stack-md">
        <form onSubmit={handleSaveName} className="row row-wrap">
          <input
            type="text"
            className="field flex-1"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your club nickname"
            aria-label="Display name"
          />
          <button type="submit" className="btn btn-primary">
            Update Name
          </button>
        </form>

        <div className="stack-xs">
          <span className="xs muted" style={{ fontWeight: 800 }}>
            ACTIVE CEFR TARGET LEVEL
          </span>
          <div className="row-wrap">
            {CEFR_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`chip ${profile.learningLevel === lvl ? 'selected' : ''}`}
                onClick={() => void setLearningLevel(lvl)}
              >
                {CEFR_LABELS[lvl]}
              </button>
            ))}
          </div>
        </div>

        <div className="row-between row-wrap">
          <div className="row">
            <span className="small muted">SFX Audio:</span>
            <button
              type="button"
              className={`chip ${!sfx.muted ? 'selected' : ''}`}
              onClick={sfx.toggleMute}
            >
              {sfx.muted ? '🔇 Muted' : '🔊 Enabled'}
            </button>
          </div>
          {isOfflineMode ? (
            <button type="button" className="btn btn-soft btn-sm" onClick={() => void signInWithGoogle()}>
              Connect Google Cloud Sync
            </button>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void signOut()}>
              Sign Out
            </button>
          )}
        </div>
      </section>

      {/* Lifetime Stats */}
      <section className="stat-grid">
        <div className="stat-box card-soft-primary">
          <span className="xs muted">Total XP</span>
          <span className="stat-num">{profile.xp.toLocaleString()}</span>
        </div>
        <div className="stat-box card-soft-mint">
          <span className="xs muted">Weekly Words</span>
          <span className="stat-num">{profile.weeklyWordsMastered}</span>
        </div>
        <div className="stat-box card-soft-amber">
          <span className="xs muted">Quizzes Played</span>
          <span className="stat-num">{profile.quizzesPlayed}</span>
        </div>
        <div className="stat-box card-soft-secondary">
          <span className="xs muted">Best Quiz</span>
          <span className="stat-num">{profile.bestLiveQuizScore.toLocaleString()}</span>
        </div>
      </section>

      {/* Badges Grid */}
      <section className="card stack-sm">
        <h2 className="card-title" style={{ margin: 0 }}>
          🏅 Club Badges ({profile.earnedBadges.length}/{LINGO_BADGES.length})
        </h2>
        <div className="grid-3">
          {LINGO_BADGES.map((badge) => {
            const earned = profile.earnedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`card stack-xs ${earned ? 'card-soft-amber' : ''}`}
                style={{ opacity: earned ? 1 : 0.56 }}
              >
                <div className="row-between">
                  <span style={{ fontSize: '1.6rem' }}>{badge.icon}</span>
                  <span className="xs muted">{earned ? 'UNLOCKED' : 'LOCKED'}</span>
                </div>
                <strong className="small">{badge.title}</strong>
                <span className="xs muted">{badge.criteria}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Activity Log */}
      <section className="card stack-sm">
        <h2 className="card-title" style={{ margin: 0 }}>
          Recent Activity Log
        </h2>
        {sessions.length === 0 ? (
          <p className="small muted" style={{ margin: 0 }}>
            Complete quizzes, weekly sessions, or arcade runs to build your timeline.
          </p>
        ) : (
          <div className="stack-xs">
            {sessions.slice(0, 12).map((s, idx) => (
              <div key={s.id || idx} className="row-between card" style={{ padding: 10 }}>
                <div className="stack-xs" style={{ gap: 2 }}>
                  <strong className="small">{s.title}</strong>
                  <span className="xs muted">
                    {s.activityType} · {formatRelTime(s.createdAtMs)}
                  </span>
                </div>
                <div className="row">
                  <CefrBadge level={s.cefrLevel} />
                  <span className="mono small" style={{ fontWeight: 800 }}>
                    {s.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
