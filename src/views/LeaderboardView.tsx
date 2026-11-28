import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { avatarColorForTag, CEFR_LEVELS } from '../utils/constants';
import { TrophyCanvas } from '../components/Canvas3D';
import { GlobalTeamLeaderboard } from '../components/GlobalTeamLeaderboard';
import { CefrBadge } from '../components/CefrBadge';

export const LeaderboardView: React.FC = () => {
  const { globalScores, currentUid, navigate, sfx } = useApp();
  const [cefrFilter, setCefrFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return globalScores.filter((s) => {
      if (cefrFilter !== 'ALL' && s.cefrLevel !== cefrFilter) return false;
      if (modeFilter !== 'ALL' && s.gameMode !== modeFilter) return false;
      return true;
    });
  }, [cefrFilter, globalScores, modeFilter]);

  return (
    <div className="stack-lg" data-testid="leaderboard-view">
      <div className="row-between row-wrap">
        <div className="row">
          <TrophyCanvas size={72} />
          <div className="stack-xs" style={{ gap: 2 }}>
            <h1 className="display-title" style={{ margin: 0 }}>
              🏆 Global Hall of Fame
            </h1>
            <span className="small muted">
              Live squad standings & top individual quiz & arcade champions
            </span>
          </div>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      <GlobalTeamLeaderboard onJoinTeamsClick={() => navigate('teams')} />

      <section className="card stack-sm">
        <div className="row-between row-wrap">
          <h2 className="card-title" style={{ margin: 0 }}>
            Individual Champions
          </h2>
          <div className="row-wrap">
            {['ALL', 'LIVE_QUIZ', 'SOLO_BLITZ', 'ARCADE', 'ARCADE_TEAM'].map((m) => (
              <button
                key={m}
                type="button"
                className={`chip ${modeFilter === m ? 'selected' : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setModeFilter(m);
                }}
              >
                {m === 'ALL' ? 'All Modes' : m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="row-wrap">
          {['ALL', ...CEFR_LEVELS].map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`chip ${cefrFilter === lvl ? 'selected' : ''}`}
              onClick={() => setCefrFilter(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="small muted" style={{ margin: '12px 0' }}>
            No scores recorded yet for this filter. Play Quiz Clash or Arcade to claim #1!
          </p>
        ) : (
          <div className="stack-xs">
            {filtered.map((item, idx) => {
              const mine = item.userId === currentUid;
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              return (
                <div
                  key={item.id || `${item.playerName}_${idx}`}
                  className={`reveal-lb-row ${idx < 3 ? 'top3' : ''} ${mine ? 'mine' : ''}`}
                >
                  <div className="reveal-lb-rank">{medal}</div>
                  <div
                    className="gtl-avatar"
                    style={{
                      width: 34,
                      height: 34,
                      background: avatarColorForTag(item.avatarColor),
                    }}
                  >
                    {item.playerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 stack-xs" style={{ gap: 2, minWidth: 0 }}>
                    <span className="small" style={{ fontWeight: 800 }}>
                      {item.playerName} {mine ? '(You)' : ''}
                    </span>
                    <span className="xs muted">
                      {item.quizTitle} · {item.accuracyPct}% acc
                    </span>
                  </div>
                  <CefrBadge level={item.cefrLevel} />
                  <span className="mono small tabular-nums" style={{ fontWeight: 800 }}>
                    {item.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
