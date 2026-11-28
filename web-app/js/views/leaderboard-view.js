// Global Leaderboard View (Individual Ranks + Top-Performing Teams Tab)

import { CEFR_LEVELS, avatarColorForTag, el } from '../models.js';
import { store } from '../store/app-store.js';
import { createTrophyCanvas } from '../components/canvas-3d.js';
import { createCefrBadge } from '../components/ui-shared.js';
import { createGlobalTeamLeaderboard } from '../components/global-team-leaderboard.js';

let selectedMode = 'ALL';
let selectedCefr = 'ALL';

function buildTeamLeaderboardRows() {
  return store.getGlobalTeamLeaderboard(20).allTeams;
}

export function renderLeaderboardView({ navigate }) {
  const modes = [
    { id: 'ALL', label: 'All Modes' },
    { id: 'TEAMS', label: '🛡️ Top Teams' },
    { id: 'LIVE_QUIZ', label: 'Live Quiz' },
    { id: 'SOLO_BLITZ', label: 'Solo Blitz' },
    { id: 'ARCADE', label: 'Arcade' },
    { id: 'WEEKLY_BLITZ', label: 'Weekly Blitz' }
  ];

  const allScores = store.globalScores || [];
  const filtered = allScores
    .filter((s) => (selectedMode === 'ALL' ? true : s.gameMode === selectedMode))
    .filter((s) => (selectedCefr === 'ALL' ? true : s.cefrLevel === selectedCefr))
    .slice(0, 50);

  const rankedTeams = selectedMode === 'TEAMS' ? buildTeamLeaderboardRows() : [];
  const top3 = filtered.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '🏆 Global Leaderboard'),
      el(
        'div',
        { className: 'row', style: { gap: '8px' } },
        el('button', { type: 'button', className: 'btn btn-soft small', onClick: () => navigate('teams') }, '🛡️ Teams'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
      )
    ),

    el(
      'div',
      { className: 'card card-soft-amber row-between' },
      el(
        'div',
        { className: 'stack-xs flex-1' },
        el('div', { className: 'section-title' }, selectedMode === 'TEAMS' ? 'Top-Performing Squads' : 'Club Hall of Fame'),
        el(
          'p',
          { className: 'small', style: { margin: 0 } },
          selectedMode === 'TEAMS'
            ? 'Squad standings ranked by combined Team Play, Team Buzzer, and Quiz points.'
            : store.isOfflineMode
              ? 'Showing local & device best scores. Sign in with Google to compete globally!'
              : 'Live global scores synced from Google-authenticated club members.'
        )
      ),
      createTrophyCanvas({ size: 82 })
    ),

    createGlobalTeamLeaderboard({ navigate, maxTeams: 5 }),

    // Filters
    el(
      'div',
      { className: 'stack-sm' },
      el(
        'div',
        { className: 'scroll-x' },
        ...modes.map((m) =>
          el(
            'button',
            {
              type: 'button',
              className: `chip ${selectedMode === m.id ? 'selected' : ''}`,
              onClick: () => {
                selectedMode = m.id;
                store.emit('change');
              }
            },
            m.label
          )
        )
      ),
      selectedMode !== 'TEAMS'
        ? el(
            'div',
            { className: 'scroll-x' },
            el('button', { type: 'button', className: `chip ${selectedCefr === 'ALL' ? 'selected' : ''}`, onClick: () => { selectedCefr = 'ALL'; store.emit('change'); } }, 'All CEFR'),
            ...CEFR_LEVELS.map((lvl) =>
              el('button', { type: 'button', className: `chip ${selectedCefr === lvl ? 'selected' : ''}`, onClick: () => { selectedCefr = lvl; store.emit('change'); } }, lvl)
            )
          )
        : null
    ),

    selectedMode === 'TEAMS'
      ? el(
          'div',
          { className: 'stack-md' },
          el(
            'div',
            { className: 'grid-stats' },
            ...rankedTeams.slice(0, 3).map((team, idx) =>
              el(
                'div',
                {
                  className: `card stack-xs ${idx === 0 ? 'card-soft-amber' : idx === 1 ? 'card-soft-primary' : 'card-soft-mint'}`,
                  style: { textAlign: 'center', padding: '14px' }
                },
                el('div', { style: { fontSize: '1.8rem' } }, medals[idx]),
                el('div', { className: 'card-title' }, team.name + (team.isMine ? ' ★' : '')),
                el('div', { className: 'display-title mono', style: { fontSize: '1.3rem' } }, `${team.totalPoints} pts`),
                el('div', { className: 'xs' }, `${team.memberCount || 1} members · ${team.gamesCount} team plays`)
              )
            )
          ),
          el(
            'div',
            { className: 'stack-sm' },
            ...rankedTeams.map((team, idx) =>
              el(
                'div',
                { className: `card row-between ${team.isMine ? 'card-soft-primary' : ''}` },
                el(
                  'div',
                  { className: 'row', style: { gap: '12px' } },
                  el('span', { className: 'mono', style: { fontWeight: '800', minWidth: '28px' } }, `#${idx + 1}`),
                  el(
                    'div',
                    {
                      style: {
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: avatarColorForTag(team.accentColor),
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800'
                      }
                    },
                    (team.name || 'T')[0].toUpperCase()
                  ),
                  el(
                    'div',
                    { className: 'stack-xs' },
                    el('div', { className: 'card-title' }, `${team.name}${team.isMine ? ' (Your Team)' : ''}`),
                    el('div', { className: 'xs muted' }, `${team.motto || 'Squad'} · ${team.gamesCount} games played`)
                  )
                ),
                el('span', { className: 'card-title mono' }, `${team.totalPoints} pts`)
              )
            )
          )
        )
      : filtered.length === 0
        ? el(
            'div',
            { className: 'card stack-md', style: { textAlign: 'center', padding: '28px' } },
            el('div', { style: { fontSize: '2.5rem' } }, '🎯'),
            el('div', { className: 'section-title' }, 'No scores recorded yet for this filter'),
            el('p', { className: 'small muted', style: { margin: 0 } }, 'Play Live Quiz Clash, Solo Blitz, or Arcade Mini-Games to claim #1 on the podium!'),
            el('button', { type: 'button', className: 'btn btn-primary', style: { alignSelf: 'center' }, onClick: () => navigate('quiz') }, 'Play Quiz Arena')
          )
        : el(
            'div',
            { className: 'stack-md' },
            // Top 3 Podium
            el(
              'div',
              { className: 'grid-stats' },
              ...top3.map((entry, idx) =>
                el(
                  'div',
                  {
                    className: `card stack-xs ${idx === 0 ? 'card-soft-amber' : idx === 1 ? 'card-soft-primary' : 'card-soft-mint'}`,
                    style: { textAlign: 'center', padding: '14px' }
                  },
                  el('div', { style: { fontSize: '1.8rem' } }, medals[idx]),
                  el('div', { className: 'card-title', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, entry.playerName || 'Player'),
                  el('div', { className: 'display-title mono', style: { fontSize: '1.3rem' } }, String(entry.score || 0)),
                  el('div', { className: 'xs' }, `${entry.accuracyPct || 100}% · 🔥${entry.streak || 0}`)
                )
              )
            ),

            // Full Ranked List
            el(
              'div',
              { className: 'stack-sm' },
              ...filtered.map((entry, idx) => {
                const isMe = entry.userId === store.currentUserId;
                return el(
                  'div',
                  { className: `card row-between ${isMe ? 'card-soft-primary' : ''}` },
                  el(
                    'div',
                    { className: 'row', style: { gap: '12px' } },
                    el('span', { className: 'mono', style: { fontWeight: '800', minWidth: '28px' } }, `#${idx + 1}`),
                    el('div', {
                      style: {
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: avatarColorForTag(entry.avatarColor),
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800'
                      }
                    }, (entry.playerName || 'P')[0].toUpperCase()),
                    el(
                      'div',
                      { className: 'stack-xs' },
                      el('div', { className: 'card-title' }, `${entry.playerName}${isMe ? ' (You)' : ''}`),
                      el('div', { className: 'xs muted' }, `${entry.quizTitle} · ${entry.gameMode} · ${entry.accuracyPct}% acc`)
                    )
                  ),
                  el(
                    'div',
                    { className: 'row', style: { gap: '8px' } },
                    createCefrBadge(entry.cefrLevel || 'B1'),
                    el('span', { className: 'card-title mono' }, String(entry.score || 0))
                  )
                );
              })
            )
          )
  );
}
