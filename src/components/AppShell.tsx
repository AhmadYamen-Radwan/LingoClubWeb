import React, { useEffect, useRef } from 'react';
import { AppRoute } from '../types';
import { useApp } from '../context/AppContext';
import { CEFR_LEVELS } from '../utils/constants';
import { TeamBuzzerOverlay } from './TeamBuzzerOverlay';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: string;
}

const RAIL_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'quiz', label: 'Quiz', icon: '⚡' },
  { id: 'arcade', label: 'Arcade', icon: '🎮' },
  { id: 'curriculum', label: '200 Words', icon: '📅' },
  { id: 'teams', label: 'Teams', icon: '🛡️' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const MOBILE_TABS: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'quiz', label: 'Quiz', icon: '⚡' },
  { id: 'arcade', label: 'Arcade', icon: '🎮' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const ROUTE_TITLES: Record<AppRoute, string> = {
  auth: 'Welcome to LingoClub',
  home: 'LingoClub Party & Word Studio',
  quiz: 'Live Quiz Clash',
  arcade: 'Interactive Arcade',
  leaderboard: 'Global Hall of Fame',
  teams: 'Squads & Hangouts',
  curriculum: 'Weekly 200-Word Quest',
  audiobooks: 'Bilingual Stories',
  chat: 'Squad Chat & Stickers',
  profile: 'Player Profile & Badges',
  puzzles: 'Word Forge Puzzles',
  cards: 'Flashcard Studio',
  guessing: 'Taboo & Charades',
  roleplay: 'Roleplay Stage',
  dictionary: '18.6K Bilingual Dictionary',
};

const ConfettiOverlay: React.FC<{ trigger: number }> = ({ trigger }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#563AE4', '#FF5A5F', '#0E9F6E', '#F59E0B', '#1368CE'];
    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 6,
      vy: 3 + Math.random() * 5,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let frames = 0;
    const tick = () => {
      frames += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.rot += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (frames < 110) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return <canvas ref={canvasRef} className="confetti-layer" aria-hidden="true" />;
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    route,
    navigate,
    theme,
    toggleTheme,
    sfx,
    profile,
    setLearningLevel,
    isOfflineMode,
    roomSession,
    hostAlerts,
    dismissHostAlert,
    toasts,
    confettiVersion,
    openTeamBuzzer,
  } = useApp();

  const showNav = route !== 'auth';

  return (
    <div className="app-shell">
      {showNav ? (
        <aside className="nav-rail" aria-label="Primary navigation rail">
          <button
            type="button"
            className="rail-brand"
            aria-label="LingoClub Home"
            onClick={() => navigate('home')}
          >
            LC
          </button>
          {RAIL_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rail-btn ${route === item.id ? 'active' : ''}`}
              aria-current={route === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-ic" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>
      ) : null}

      <div className="main-column">
        {showNav ? (
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 40,
              background: 'var(--bg)',
              borderBottom: '1px solid var(--outline-soft)',
              padding: '10px 14px',
            }}
          >
            <div
              className="row-between"
              style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}
            >
              <div className="row" style={{ minWidth: 0 }}>
                {route !== 'home' ? (
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label="Back to Home"
                    onClick={() => navigate('home')}
                  >
                    ←
                  </button>
                ) : null}
                <div className="stack-xs" style={{ gap: 1, minWidth: 0 }}>
                  <span
                    className="card-title"
                    style={{
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ROUTE_TITLES[route]}
                  </span>
                  <span className="xs muted" style={{ fontWeight: 600 }}>
                    {isOfflineMode ? 'Offline Explorer' : 'Cloud Synced'} · {profile.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>

              <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                <label htmlFor="header-cefr-select" className="sr-only">
                  Active CEFR level
                </label>
                <select
                  id="header-cefr-select"
                  className="field"
                  value={profile.learningLevel}
                  onChange={(e) => void setLearningLevel(e.target.value)}
                  aria-label="Active CEFR level"
                  style={{
                    width: 'auto',
                    minHeight: 38,
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                  }}
                >
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Open Team Fast-Buzz Arena"
                  title="Team Buzzer"
                  onClick={() =>
                    openTeamBuzzer({
                      contextKey: 'global_header',
                      title: 'Club Team Buzzer',
                      prompt: 'Buzz in first to claim the floor!',
                    })
                  }
                >
                  🚨
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  data-testid="sfx-mute-toggle"
                  aria-label={sfx.muted ? 'Unmute game sound effects' : 'Mute game sound effects'}
                  aria-pressed={sfx.muted}
                  title={sfx.muted ? 'SFX Muted' : 'SFX Active'}
                  onClick={sfx.toggleMute}
                >
                  {sfx.muted ? '🔇' : '🔊'}
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </header>
        ) : null}

        <main className={`app-root ${showNav ? '' : 'no-nav'}`}>{children}</main>
      </div>

      {showNav ? (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {MOBILE_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`bnav-btn ${route === item.id ? 'active' : ''}`}
              aria-current={route === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-pill" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      ) : null}

      {/* Host-Only Floating Player Departure Notification Stack */}
      {roomSession?.isHost && hostAlerts.length > 0 ? (
        <div
          className="host-alert-stack"
          role="status"
          aria-live="polite"
          data-testid="host-alert-stack"
        >
          {hostAlerts.map((alert) => (
            <div key={alert.id} className="host-alert-card" data-testid="host-alert-card">
              <div className="stack-xs" style={{ gap: 2 }}>
                <span className="xs" style={{ color: '#FCD34D', fontWeight: 800 }}>
                  HOST ALERT · ROOM {alert.roomCode}
                </span>
                <span className="small" style={{ fontWeight: 700 }}>
                  {alert.message}
                </span>
              </div>
              <button
                type="button"
                className="btn-icon"
                style={{ width: 34, height: 34, color: '#FFFFFF', background: 'rgba(255,255,255,0.12)' }}
                aria-label={`Dismiss notification: ${alert.message}`}
                onClick={() => dismissHostAlert(alert.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {toasts.length > 0 ? (
        <div className="toast-root" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item ${t.kind}`}>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      ) : null}

      <TeamBuzzerOverlay />
      <ConfettiOverlay trigger={confettiVersion} />
    </div>
  );
};
