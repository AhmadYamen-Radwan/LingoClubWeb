import React, { useMemo, useState } from 'react';
import { CefrLevel, Team } from '../types';
import { useApp } from '../context/AppContext';
import { avatarColorForTag, CEFR_LEVELS } from '../utils/constants';
import { CefrBadge } from '../components/CefrBadge';

const ACCENT_OPTIONS = ['INDIGO', 'MINT', 'CORAL', 'AMBER', 'PURPLE'] as const;

export const TeamsView: React.FC = () => {
  const {
    teams,
    profile,
    createTeam,
    joinTeam,
    leaveTeam,
    setActiveTeamId,
    hostedSquad,
    hostLocalSquad,
    stopHostingLocalSquad,
    openTeamBuzzer,
    navigate,
    sfx,
    toast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [cefr, setCefr] = useState<string>(profile.learningLevel || CefrLevel.B1);
  const [accent, setAccent] = useState<string>('INDIGO');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.motto.toLowerCase().includes(q) ||
        t.cefrLevel.toLowerCase().includes(q)
    );
  }, [search, teams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Enter a squad name first.', 'error');
      return;
    }
    await createTeam({
      name: name.trim(),
      cefrLevel: cefr,
      motto: motto.trim() || 'Teamwork makes fluency faster!',
      accentColor: accent,
    });
    sfx.playSuccess();
    setCreating(false);
    setName('');
    setMotto('');
  };

  return (
    <div className="stack-lg" data-testid="teams-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            🛡️ Squads & Hangouts
          </h1>
          <span className="small muted">
            Team up with friends, host nearby radar, or launch Squad Chat & Party Buzzer
          </span>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              sfx.playClick();
              setCreating((v) => !v);
            }}
          >
            {creating ? 'Cancel' : '+ Create Squad'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
            ← Home
          </button>
        </div>
      </div>

      {creating ? (
        <form onSubmit={handleCreate} className="card card-soft-primary stack-sm">
          <h2 className="card-title" style={{ margin: 0 }}>
            Create New Club Squad
          </h2>
          <div className="grid-2">
            <input
              type="text"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Squad name (e.g. Phoenix Readers)"
            />
            <select
              className="field"
              value={cefr}
              onChange={(e) => setCefr(e.target.value)}
              aria-label="Squad CEFR level"
            >
              {CEFR_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            className="field"
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
            placeholder="Squad motto..."
          />
          <div className="row-wrap">
            {ACCENT_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${accent === c ? 'selected' : ''}`}
                onClick={() => setAccent(c)}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: avatarColorForTag(c),
                    display: 'inline-block',
                  }}
                />
                {c}
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary">
            Launch Squad
          </button>
        </form>
      ) : null}

      <div className="row-between row-wrap">
        <input
          type="search"
          className="field flex-1"
          style={{ maxWidth: 360 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search squads by name, level, or motto..."
          aria-label="Search squads"
        />
        <div className="row">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() =>
              openTeamBuzzer({
                contextKey: 'teams_arena',
                title: 'Squad Challenge Buzzer',
                prompt: 'First squad to buzz wins the challenge floor!',
              })
            }
          >
            🚨 Buzzer
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('chat')}>
            💬 Open Chat
          </button>
        </div>
      </div>

      <div className="grid-2">
        {filtered.map((team: Team) => {
          const isMine = profile.teamId === team.id;
          const isHosted = hostedSquad?.id === team.id;
          const colorHex = avatarColorForTag(team.accentColor);
          return (
            <div key={team.id} className={`card stack-sm ${isMine ? 'card-soft-primary' : ''}`}>
              <div className="row-between">
                <div className="row">
                  <div
                    className="gtl-avatar"
                    style={{ background: colorHex, width: 42, height: 42 }}
                  >
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="card-title" style={{ margin: 0 }}>
                      {team.name}
                    </h2>
                    <span className="xs muted">
                      {team.memberCount} members · Lead: {team.leaderName}
                    </span>
                  </div>
                </div>
                <CefrBadge level={team.cefrLevel} />
              </div>

              <p className="small muted" style={{ margin: 0 }}>
                {team.motto}
              </p>

              <div className="row-between row-wrap">
                <div className="row">
                  {isMine ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => void leaveTeam()}
                    >
                      Leave
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => void joinTeam(team)}
                    >
                      Join Squad
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setActiveTeamId(team.id);
                      navigate('chat');
                    }}
                  >
                    💬 Chat
                  </button>
                </div>

                {isHosted ? (
                  <button
                    type="button"
                    className="chip selected"
                    onClick={stopHostingLocalSquad}
                  >
                    📡 Stop Radar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="chip"
                    onClick={() => hostLocalSquad(team)}
                  >
                    📡 Host Nearby
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
