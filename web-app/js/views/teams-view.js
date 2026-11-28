// Teams Dashboard View (Kahoot-Style Team Competition, Roster & Contributions Breakdown)

import { avatarColorForTag, el } from '../models.js';
import { store } from '../store/app-store.js';
import { createCefrBadge } from '../components/ui-shared.js';
import { audioService } from '../services/audio-service.js';
import { createGlobalTeamLeaderboard } from '../components/global-team-leaderboard.js';

export function renderTeamsView({ navigate }) {
  const clubTeams = store.teams || [];
  const battleTeams = store.getDefaultBattleTeams();
  // Merge club teams and default Kahoot battle squads cleanly by id
  const seen = new Set();
  const allTeams = [];
  [...clubTeams, ...battleTeams].forEach((t) => {
    if (t?.id && !seen.has(t.id)) {
      seen.add(t.id);
      allTeams.push(t);
    }
  });

  const myTeamId = store.profile?.teamId || store.selectedTeamId || allTeams[0]?.id || '';
  const selectedTeam = allTeams.find((t) => t.id === myTeamId) || allTeams[0] || {
    id: 'default_team',
    name: 'Default Squad',
    motto: 'Bilingual Explorers',
    accentColor: 'INDIGO',
    memberCount: 1
  };

  // Aggregate accurate per-team totals from teamScoresMap + explicit teamId globalScores + user's team XP
  const teamScoresMap = {};
  const teamMemberMap = {};
  allTeams.forEach((t) => {
    teamScoresMap[t.id] = Number(store.teamScoresMap?.[t.id] || 0);
    teamMemberMap[t.id] = new Set();
  });

  // Attribute current player's profile XP to their joined team
  if (myTeamId) {
    if (typeof teamScoresMap[myTeamId] !== 'number') teamScoresMap[myTeamId] = 0;
    teamScoresMap[myTeamId] += Number(store.profile?.xp || 0);
    if (!teamMemberMap[myTeamId]) teamMemberMap[myTeamId] = new Set();
    teamMemberMap[myTeamId].add(store.currentUserName);
  }

  // Attribute contributions per team
  const allContribs = store.teamContributions || [];
  allContribs.forEach((c) => {
    if (c.teamId) {
      if (!teamMemberMap[c.teamId]) teamMemberMap[c.teamId] = new Set();
      if (c.playerName) teamMemberMap[c.teamId].add(c.playerName);
    }
  });

  // Also include any cloud globalScores that carry an explicit teamId
  (store.globalScores || []).forEach((s) => {
    if (s.teamId) {
      if (typeof teamScoresMap[s.teamId] !== 'number') teamScoresMap[s.teamId] = 0;
      // Avoid double-counting offline records already tracked in teamScoresMap
      if (!store.isOfflineMode) {
        teamScoresMap[s.teamId] += Number(s.score || 0);
      }
      if (!teamMemberMap[s.teamId]) teamMemberMap[s.teamId] = new Set();
      if (s.playerName) teamMemberMap[s.teamId].add(s.playerName);
    }
  });

  // Include live active room points (Live Quiz PINs, Arcade Team rooms, Buzzer)
  const agg = store.getGlobalTeamLeaderboard(30);
  agg.allTeams.forEach((t) => {
    teamScoresMap[t.id] = Math.max(Number(teamScoresMap[t.id] || 0), t.totalPoints);
  });

  const rankedTeams = [...allTeams].sort((a, b) => (teamScoresMap[b.id] || 0) - (teamScoresMap[a.id] || 0));
  const selectedContribs = allContribs.filter((c) => c.teamId === selectedTeam.id);
  const displayedContribs = (selectedContribs.length > 0 ? selectedContribs : allContribs).slice(0, 10);
  const selectedMembers = [...(teamMemberMap[selectedTeam.id] || [])];
  const medals = ['🥇', '🥈', '🥉', '🏅'];

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '🛡️ Teams & Squad Competition'),
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
    ),

    // Kahoot Team Competition Banner + Direct Buzzer & Arcade Team Play Launchers
    el(
      'div',
      { className: 'card card-soft-primary stack-sm' },
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap', gap: '12px' } },
        el(
          'div',
          { className: 'stack-xs flex-1' },
          el('div', { className: 'section-title' }, 'Kahoot Team Mode & 5s Buzzer ⚡'),
          el('p', { className: 'small', style: { margin: 0 } }, 'Play Team Mode in the Arcade, race to buzz in first with the 5-second lockout buzzer, or host Live Quiz Clash to grow your squad total!')
        ),
        el(
          'div',
          { className: 'row-wrap' },
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-secondary',
              onClick: () =>
                store.openTeamBuzzer({
                  contextKey: 'teams:dashboard',
                  title: '🚨 Squad Showdown Buzzer',
                  prompt: 'First team member to buzz in gets 5 seconds to answer!',
                  teams: rankedTeams.slice(0, 4)
                })
            },
            '🚨 Launch Team Buzzer'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-primary',
              onClick: () => {
                audioService.playCorrect();
                navigate('arcade');
              }
            },
            '🎮 Arcade Team Play'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-mint',
              onClick: () => {
                audioService.playTransition();
                navigate('quiz');
              }
            },
            '⚡ Team Quiz Battle'
          )
        )
      )
    ),

    // Live Cross-Room Top 5 Global Team Leaderboard
    createGlobalTeamLeaderboard({ navigate, maxTeams: 5 }),

    // Team Standings Podium (Kahoot Style)
    el(
      'div',
      { className: 'stack-md' },
      el('h2', { className: 'section-title' }, '🏆 Team Podium Standings'),
      el(
        'div',
        { className: 'grid-stats' },
        ...rankedTeams.map((team, idx) => {
          const isSelected = team.id === selectedTeam.id;
          const totalPts = teamScoresMap[team.id] || 0;
          const memberCount = Math.max(team.memberCount || 1, teamMemberMap[team.id]?.size || 1);
          return el(
            'div',
            {
              className: `card stack-xs ${isSelected ? 'card-soft-amber' : 'card-soft-secondary'}`,
              style: { cursor: 'pointer', textAlign: 'center', padding: '16px', border: isSelected ? '2px solid var(--accent)' : 'none' },
              onClick: () => {
                store.selectTeam(team.id);
                store.emit('change');
              }
            },
            el('div', { className: 'row-between', style: { justifyContent: 'center', gap: '6px' } },
              el('span', { style: { fontSize: '1.8rem' } }, medals[idx] || '🏅'),
              el('span', { className: 'badge-pill', style: { background: 'var(--surface-variant)' } }, team.channelKind === 'CLUB' ? '🏛️ Club' : '🛡️ Team')
            ),
            el('div', { className: 'card-title' }, team.name),
            el('div', { className: 'display-title mono', style: { fontSize: '1.4rem' } }, `${totalPts} pts`),
            el('div', { className: 'xs muted' }, `${memberCount} members · ${team.motto || 'Active Squad'}`),
            team.id !== store.profile?.teamId
              ? el(
                  'button',
                  {
                    type: 'button',
                    className: 'btn btn-outline small',
                    style: { marginTop: '8px' },
                    onClick: async (e) => {
                      e.stopPropagation();
                      await store.joinTeam(team);
                      store.emit('change');
                    }
                  },
                  team.channelKind === 'CLUB' ? 'Join Club' : 'Join Team'
                )
              : el(
                  'div',
                  { className: 'row-wrap', style: { justifyContent: 'center', gap: '6px', marginTop: '6px' } },
                  el('span', { className: 'badge-pill card-soft-mint' }, team.channelKind === 'CLUB' ? 'Your Club ✓' : 'Your Team ✓'),
                  el(
                    'button',
                    {
                      type: 'button',
                      className: 'btn btn-danger-soft',
                      style: { minHeight: '34px', padding: '4px 10px', fontSize: '0.75rem' },
                      onClick: async (e) => {
                        e.stopPropagation();
                        await store.leaveTeam(team);
                      }
                    },
                    team.channelKind === 'CLUB' ? '🚪 Leave Club' : '🚪 Leave Team'
                  )
                )
          );
        })
      )
    ),

    // Selected Team Detail & Contributions Breakdown
    el(
      'div',
      { className: 'card stack-md' },
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap', gap: '10px' } },
        el(
          'div',
          { className: 'stack-xs' },
          el('h2', { className: 'section-title' }, `👥 ${selectedTeam.name} Roster & Contributions`),
          el('p', { className: 'small muted', style: { margin: 0 } }, selectedTeam.motto || 'Collaborative learning squad')
        ),
        el(
          'div',
          { className: 'row-wrap', style: { gap: '8px' } },
          el('span', { className: 'badge-pill card-soft-primary' }, `${teamScoresMap[selectedTeam.id] || 0} Total Team Points`),
          selectedTeam.id === store.profile?.teamId
            ? el(
                'button',
                {
                  type: 'button',
                  className: 'btn btn-danger-soft',
                  style: { minHeight: '36px', padding: '6px 12px', fontSize: '0.8rem' },
                  onClick: () => store.leaveTeam(selectedTeam)
                },
                selectedTeam.channelKind === 'CLUB' ? '🚪 Leave Club' : '🚪 Leave Team'
              )
            : null
        )
      ),

      selectedMembers.length > 0
        ? el(
            'div',
            { className: 'row-wrap' },
            ...selectedMembers.map((name) =>
              el('span', { className: 'badge-pill card-soft-mint' }, `👤 ${name}`)
            )
          )
        : null,

      // Recent Game Contributions Breakdown
      el('h3', { className: 'card-title', style: { marginTop: '6px' } }, selectedContribs.length > 0 ? `${selectedTeam.name} Game Contributions` : 'Recent Squad Game Contributions'),
      displayedContribs.length === 0
        ? el('p', { className: 'small muted' }, 'No team contributions recorded yet. Play Arcade Team Mode, win a Buzzer round, or complete a Quiz to boost your squad!')
        : el(
            'div',
            { className: 'stack-sm' },
            ...displayedContribs.map((item) =>
              el(
                'div',
                { className: 'card row-between', style: { padding: '10px 14px' } },
                el(
                  'div',
                  { className: 'row', style: { gap: '10px' } },
                  el(
                    'div',
                    {
                      style: {
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: avatarColorForTag(item.avatarColor),
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800'
                      }
                    },
                    (item.playerName || 'P')[0].toUpperCase()
                  ),
                  el(
                    'div',
                    { className: 'stack-xs' },
                    el('div', { className: 'card-title' }, `${item.playerName || 'Member'} · ${item.teamName || selectedTeam.name}`),
                    el('div', { className: 'xs muted' }, `${item.title} · ${item.gameMode} · ${item.accuracyPct}% acc`)
                  )
                ),
                el(
                  'div',
                  { className: 'row', style: { gap: '8px' } },
                  createCefrBadge(item.cefrLevel || 'B1'),
                  el('span', { className: 'card-title mono' }, `+${item.points || 0} pts`)
                )
              )
            )
          ),

      el(
        'div',
        { className: 'row-wrap', style: { gap: '10px', marginTop: '8px' } },
        el('button', { type: 'button', className: 'btn btn-primary', onClick: () => navigate('chat') }, '🏛️ Clubs & Squads Chat'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('leaderboard') }, '🏆 Team Leaderboard')
      )
    )
  );
}
