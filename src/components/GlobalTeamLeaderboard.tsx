import React from 'react';
import { useApp } from '../context/AppContext';
import { avatarColorForTag } from '../utils/constants';

export const GlobalTeamLeaderboard: React.FC<{
  compact?: boolean;
  onJoinTeamsClick?: () => void;
}> = ({ compact = false, onJoinTeamsClick }) => {
  const { globalTeamLeaderboard, activeArcadeRooms, openTeamBuzzer, navigate } = useApp();
  const list = compact ? globalTeamLeaderboard.slice(0, 4) : globalTeamLeaderboard;
  const maxPoints = Math.max(100, ...list.map((t) => t.totalPoints));

  return (
    <section className="card stack-sm" aria-label="Global Team Standings">
      <div className="row-between row-wrap">
        <div className="stack-xs">
          <h3 className="card-title" style={{ margin: 0 }}>
            Global Squad Standings
          </h3>
          <span className="xs muted">
            {activeArcadeRooms.length > 0
              ? `${activeArcadeRooms.length} live arcade battle(s) active right now`
              : 'Live combined scores across quizzes, arcade battles & buzzers'}
          </span>
        </div>
        <div className="row-wrap">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() =>
              openTeamBuzzer({
                contextKey: 'club_global',
                title: 'Club Team Buzzer',
                prompt: 'First squad to buzz gets 5 seconds to answer!',
              })
            }
          >
            🚨 Buzzer
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => (onJoinTeamsClick ? onJoinTeamsClick() : navigate('teams'))}
          >
            All Squads
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>
          Join a squad in Teams to start earning collective points!
        </p>
      ) : (
        <div className="stack-xs">
          {list.map((team, idx) => {
            const pct = Math.max(6, Math.round((team.totalPoints / maxPoints) * 100));
            const colorHex = avatarColorForTag(team.accentColor);
            return (
              <div
                key={team.id}
                className={`gtl-row ${idx === 0 ? 'leader' : ''} ${team.isMine ? 'mine' : ''}`}
              >
                <span className="mono small" style={{ width: 24, fontWeight: 800 }}>
                  #{idx + 1}
                </span>
                <div className="gtl-avatar" style={{ background: colorHex }}>
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 stack-xs" style={{ gap: 4 }}>
                  <div className="row-between">
                    <span className="small" style={{ fontWeight: 800 }}>
                      {team.name} {team.isMine ? '(Your Squad)' : ''}
                    </span>
                    <span className="mono small tabular-nums" style={{ fontWeight: 800 }}>
                      {team.totalPoints.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="gtl-bar">
                    <div className="gtl-bar-fill" style={{ width: `${pct}%`, background: colorHex }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
