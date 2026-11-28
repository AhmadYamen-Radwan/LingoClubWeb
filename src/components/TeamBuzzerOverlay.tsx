import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { avatarColorForTag } from '../utils/constants';

export const TeamBuzzerOverlay: React.FC = () => {
  const {
    teamBuzzer,
    closeTeamBuzzer,
    triggerTeamBuzz,
    resolveTeamBuzz,
    resetTeamBuzzLock,
    sfx,
  } = useApp();

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!teamBuzzer.open) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 80);
    return () => window.clearInterval(id);
  }, [teamBuzzer.open]);

  // Auto-unlock when 5s timer expires
  useEffect(() => {
    if (!teamBuzzer.open || !teamBuzzer.activeBuzz) return;
    if (nowMs >= teamBuzzer.activeBuzz.lockUntilMs) {
      sfx.playTick();
      resetTeamBuzzLock();
    }
  }, [nowMs, resetTeamBuzzLock, sfx, teamBuzzer.activeBuzz, teamBuzzer.open]);

  // Keyboard shortcuts: Escape closes, 1-4 triggers team pads
  useEffect(() => {
    if (!teamBuzzer.open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        closeTeamBuzzer();
        return;
      }
      const num = Number(ev.key);
      if (num >= 1 && num <= 4) {
        const team = teamBuzzer.teams[num - 1];
        if (team) triggerTeamBuzz(team);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeTeamBuzzer, teamBuzzer.open, teamBuzzer.teams, triggerTeamBuzz]);

  if (!teamBuzzer.open) return null;

  const active = teamBuzzer.activeBuzz;
  const remainingMs = active ? Math.max(0, active.lockUntilMs - nowMs) : 0;
  const pct = active ? Math.min(100, Math.round((remainingMs / 5000) * 100)) : 0;

  return (
    <div
      className="buzzer-root"
      role="dialog"
      aria-modal="true"
      aria-label="Team Fast-Buzz Arena"
      onClick={closeTeamBuzzer}
    >
      <div className="buzzer-card stack-md" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <div className="stack-xs">
            <span className="xs muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Team Fast-Buzz Lockout
            </span>
            <h2 className="section-title" style={{ margin: 0 }}>
              {teamBuzzer.title}
            </h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            aria-label="Close team buzzer"
            onClick={closeTeamBuzzer}
          >
            ✕
          </button>
        </div>

        <p className="small muted" style={{ margin: 0 }}>
          {teamBuzzer.prompt} (Shortcuts: keys 1–4 to buzz, Esc to close)
        </p>

        {active ? (
          <div className="card card-soft-amber stack-sm" style={{ padding: 14 }}>
            <div className="row-between">
              <div className="row">
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: active.avatarColor,
                    display: 'inline-block',
                  }}
                />
                <strong>
                  {active.teamName} locked the floor! ({active.playerName})
                </strong>
              </div>
              <span className="mono tabular-nums" style={{ fontWeight: 800 }}>
                {(remainingMs / 1000).toFixed(1)}s
              </span>
            </div>
            <div className="buzzer-progress-track">
              <div
                className="buzzer-progress-fill"
                style={{ width: `${pct}%`, background: active.avatarColor || 'var(--primary)' }}
              />
            </div>
            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-mint btn-sm"
                onClick={() => resolveTeamBuzz('AWARDED', 100)}
              >
                ✓ Correct (+100 pts)
              </button>
              <button
                type="button"
                className="btn btn-danger-soft btn-sm"
                onClick={() => resolveTeamBuzz('WRONG', 0)}
              >
                ✕ Missed & Unlock
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={resetTeamBuzzLock}
              >
                Reset Lock
              </button>
            </div>
          </div>
        ) : (
          <div className="card card-soft-mint" style={{ padding: '10px 14px' }}>
            <span className="small" style={{ fontWeight: 700 }}>
              🟢 Floor open — tap your squad pad first to lock for 5.0 seconds!
            </span>
          </div>
        )}

        <div className="buzzer-grid">
          {teamBuzzer.teams.slice(0, 4).map((team, idx) => {
            const isWinner = active?.teamId === team.id;
            const lockedOut = Boolean(active && !isWinner);
            const score = teamBuzzer.sessionScores[team.id] || 0;
            const hex = avatarColorForTag(team.accentColor);
            return (
              <button
                key={team.id}
                type="button"
                disabled={lockedOut}
                onClick={() => triggerTeamBuzz(team)}
                className={`buzzer-pad ${isWinner ? 'winner' : ''} ${lockedOut ? 'locked-out' : ''}`}
                style={{ borderColor: isWinner ? hex : undefined }}
              >
                <span className="mono xs muted">KEY {idx + 1}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{team.name}</span>
                <span className="small muted tabular-nums" style={{ fontWeight: 700 }}>
                  {score} pts
                </span>
              </button>
            );
          })}
        </div>

        {teamBuzzer.buzzHistory.length > 0 ? (
          <div className="stack-xs">
            <span className="xs muted" style={{ fontWeight: 700 }}>
              Recent Buzz Log
            </span>
            <div className="row-wrap">
              {teamBuzzer.buzzHistory.slice(0, 4).map((h) => (
                <span key={h.id} className="badge-pill">
                  {h.teamName}: {h.outcome === 'AWARDED' ? `+${h.pointsDelta}` : h.outcome}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
