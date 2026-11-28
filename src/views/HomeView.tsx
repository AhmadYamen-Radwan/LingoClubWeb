import React, { useState } from 'react';
import { AppRoute } from '../types';
import { useApp } from '../context/AppContext';
import { DailyGoalRingCanvas, LanguageCubeCanvas } from '../components/Canvas3D';
import { GlobalTeamLeaderboard } from '../components/GlobalTeamLeaderboard';
import { CefrBadge } from '../components/CefrBadge';

interface ModeTile {
  route: AppRoute;
  title: string;
  subtitle: string;
  icon: string;
  accentBg: string;
}

const MODE_TILES: ModeTile[] = [
  { route: 'quiz', title: 'Live Quiz Clash', subtitle: 'Party PIN rooms, Solo Blitz & CSV', icon: '⚡', accentBg: 'var(--primary-soft)' },
  { route: 'arcade', title: 'Interactive Arcade', subtitle: '18 EN & AR games + Team Buzzer', icon: '🎮', accentBg: 'var(--secondary-soft)' },
  { route: 'guessing', title: 'Taboo & Charades', subtitle: 'Hilarious party word guessing', icon: '🎭', accentBg: 'var(--purple-soft)' },
  { route: 'puzzles', title: 'Word Forge', subtitle: 'Brain-teaser puzzles & matches', icon: '🧩', accentBg: 'var(--sky-soft)' },
  { route: 'roleplay', title: 'Roleplay Stage', subtitle: 'Act out plots & voice coach', icon: '🎙️', accentBg: 'var(--blue-soft)' },
  { route: 'curriculum', title: 'Weekly 200 Words', subtitle: '400 curated words & story quests', icon: '📅', accentBg: 'var(--tertiary-soft)' },
  { route: 'cards', title: 'Flashcard Studio', subtitle: '3D flip decks & custom builder', icon: '🃏', accentBg: 'var(--accent-soft)' },
  { route: 'audiobooks', title: 'Bilingual Stories', subtitle: 'Listen & read EN + AR tales', icon: '🎧', accentBg: 'var(--tertiary-soft)' },
  { route: 'dictionary', title: '18.6K Dictionary', subtitle: 'Instant EN ↔ AR word lookup', icon: '📖', accentBg: 'var(--primary-soft)' },
  { route: 'teams', title: 'Squads & Hangouts', subtitle: 'Team up & battle on radar', icon: '🛡️', accentBg: 'var(--accent-soft)' },
  { route: 'chat', title: 'Squad Chat', subtitle: 'Stickers & tap-to-translate', icon: '💬', accentBg: 'var(--sky-soft)' },
  { route: 'leaderboard', title: 'Hall of Fame', subtitle: 'Top players & squad standings', icon: '🏆', accentBg: 'var(--secondary-soft)' },
];

export const HomeView: React.FC = () => {
  const {
    profile,
    navigate,
    joinRoomByPin,
    toast,
    sfx,
    roomSession,
    openTeamBuzzer,
  } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [joining, setJoining] = useState(false);

  const dailyTargetXp = 250;
  const dailyPct = Math.min(100, Math.round(((profile.xp % dailyTargetXp) / dailyTargetXp) * 100) || (profile.xp > 0 ? 100 : 12));

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim().toUpperCase();
    if (clean.length !== 6) {
      toast('Enter a 6-character Room PIN.', 'error');
      return;
    }
    setJoining(true);
    try {
      await joinRoomByPin({
        roomCode: clean,
        nickname: profile.displayName,
        avatarColor: 'INDIGO',
      });
      sfx.playSuccess();
      navigate('quiz');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Room not found.', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="stack-lg">
      {/* Studio Hero Banner */}
      <section className="hero-banner">
        <div className="hero-banner-media" style={{ minHeight: 205 }}>
          <img src="/assets/img_hero_studio.jpg" alt="LingoClub studio workspace" />
          <div className="hero-banner-overlay row-between row-wrap">
            <div className="stack-xs" style={{ flex: 1, minWidth: 210 }}>
              <div className="row-wrap">
                <CefrBadge level={profile.learningLevel} />
                <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }}>
                  🔥 {profile.streak} day streak
                </span>
              </div>
              <h1 className="display-title" style={{ color: '#FFFFFF', margin: 0 }}>
                Hey {profile.displayName}!
              </h1>
              <p className="small" style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                {profile.teamName
                  ? `Playing with ${profile.teamName} · Jump into party quizzes, arcade games & English quests!`
                  : 'Host a party PIN quiz, play 18 arcade games, or boost your English at your own pace.'}
              </p>
              <div className="row-wrap" style={{ paddingTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('quiz')}
                >
                  ⚡ Start Quiz Clash
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ background: 'rgba(255,255,255,0.16)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.38)' }}
                  onClick={() => navigate('arcade')}
                >
                  🎮 Open Arcade
                </button>
              </div>
            </div>
            <LanguageCubeCanvas size={108} />
          </div>
        </div>
      </section>

      {/* Active Live Room Banner if already inside a room */}
      {roomSession?.room ? (
        <div className="card card-soft-primary row-between row-wrap">
          <div>
            <strong>
              Live Room {roomSession.roomCode} · {roomSession.room.quizTitle}
            </strong>
            <div className="xs muted">
              Phase: {roomSession.room.status} · {roomSession.players.length} player(s) connected
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('quiz')}>
            Return to Room →
          </button>
        </div>
      ) : null}

      {/* Daily Progress Ring & Quick Room PIN Join */}
      <div className="grid-2">
        <div className="card row" style={{ gap: 14 }}>
          <DailyGoalRingCanvas
            progressPct={dailyPct}
            centerLabel={`${profile.xp}`}
            size={98}
          />
          <div className="stack-xs flex-1">
            <span className="xs muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Player Progress
            </span>
            <div className="row-wrap">
              <strong className="tabular-nums">{profile.weeklyWordsMastered} words</strong>
              <span className="muted">·</span>
              <strong className="tabular-nums">{profile.earnedBadges.length} badges</strong>
            </div>
            <p className="xs muted" style={{ margin: 0 }}>
              {profile.quizzesPlayed} quizzes played · {profile.sessionsCompleted} quest rounds done
            </p>
            <div className="row-wrap">
              <button type="button" className="btn btn-soft btn-sm" onClick={() => navigate('leaderboard')}>
                🏆 Hall of Fame
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleQuickJoin} className="card stack-sm">
          <div className="row-between">
            <h2 className="card-title" style={{ margin: 0 }}>
              Join Live PIN Room
            </h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() =>
                openTeamBuzzer({
                  contextKey: 'home_quick_buzz',
                  title: 'Instant Room Buzzer',
                  prompt: 'Tap a squad button first to lock for 5 seconds!',
                })
              }
            >
              🚨 Buzzer
            </button>
          </div>
          <div className="row">
            <label htmlFor="home-pin-input" className="sr-only">
              6-character Room PIN
            </label>
            <input
              id="home-pin-input"
              type="text"
              className="field mono flex-1"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ENTER 6-CHAR PIN"
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={joining}>
              {joining ? '...' : 'Join'}
            </button>
          </div>
          <span className="xs muted">
            Works across browser tabs locally or live via Firebase when signed in.
          </span>
        </form>
      </div>

      {/* Global Squad Standings */}
      <GlobalTeamLeaderboard />

      {/* All 12 Club Studios & Games */}
      <section className="stack-sm" aria-label="Club studios and games">
        <div className="row-between">
          <h2 className="section-title" style={{ margin: 0 }}>
            Explore All Studios
          </h2>
          <span className="xs muted">12 interactive modes</span>
        </div>

        <div className="grid-modes">
          {MODE_TILES.map((tile) => (
            <button
              key={tile.route}
              type="button"
              className="card tactile-card row"
              style={{ textAlign: 'left', gap: 12, padding: 14, width: '100%' }}
              onClick={() => navigate(tile.route)}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: tile.accentBg,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.45rem',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {tile.icon}
              </div>
              <div className="stack-xs flex-1" style={{ gap: 2 }}>
                <strong style={{ fontSize: '0.96rem' }}>{tile.title}</strong>
                <span className="xs muted">{tile.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
