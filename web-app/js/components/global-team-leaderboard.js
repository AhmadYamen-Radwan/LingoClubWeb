// Global Team Leaderboard Component (Aggregates all active game rooms + Top 5 animated FLIP rank transitions)

import { avatarColorForTag, clearEl, el } from '../models.js';
import { store } from '../store/app-store.js';

const lastRankMap = new Map();
const lastScoreMap = new Map();

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export function createGlobalTeamLeaderboard({
  navigate,
  maxTeams = 5,
  compact = false,
  title = '🏆 Global Team Leaderboard'
} = {}) {
  const widgetId = `gtl_${Math.random().toString(36).slice(2, 8)}`;
  const rowCache = new Map();

  const activeRoomsBadge = el('span', { className: 'badge-pill card-soft-mint mono' }, '🟢 0 Active Rooms');
  const activeRoomsStrip = el('div', { className: 'gtl-rooms-strip row-wrap' });
  const listEl = el('div', { id: `gtl-list-${widgetId}`, className: 'gtl-list stack-xs' });

  const headerActions = compact
    ? el(
        'div',
        { className: 'row', style: { gap: '6px' } },
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-soft small',
            onClick: () => store.openTeamBuzzer({ contextKey: 'global:leaderboard', title: '🚨 Global Team Buzzer' })
          },
          '🚨 Buzzer'
        ),
        typeof navigate === 'function'
          ? el(
              'button',
              { type: 'button', className: 'btn btn-outline small', onClick: () => navigate('leaderboard') },
              'Full →'
            )
          : null
      )
    : el(
        'div',
        { className: 'row', style: { gap: '8px' } },
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-soft small',
            onClick: () => store.openTeamBuzzer({ contextKey: 'global:leaderboard', title: '🚨 Global Team Buzzer' })
          },
          '🚨 Buzzer'
        ),
        typeof navigate === 'function'
          ? el(
              'button',
              { type: 'button', className: 'btn btn-outline small', onClick: () => navigate('teams') },
              '🛡️ Teams'
            )
          : null
      );

  const card = el(
    'div',
    { className: 'card gtl-card stack-sm', id: `gtl-card-${widgetId}` },
    el(
      'div',
      { className: 'row-between', style: { flexWrap: 'wrap', gap: '8px' } },
      el(
        'div',
        { className: 'stack-xs' },
        el(
          'div',
          { className: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
          el('h2', { className: 'section-title' }, title),
          activeRoomsBadge
        ),
        el(
          'p',
          { className: 'xs muted', style: { margin: 0 } },
          `Top ${maxTeams} squads aggregated across all active Live Quiz PINs, Arcade Team rooms, Buzzer battles & club totals.`
        )
      ),
      headerActions
    ),
    activeRoomsStrip,
    listEl
  );

  function buildOrUpdateRow(team, rankIdx, leaderMaxPts, animateRankShift) {
    let row = rowCache.get(team.id);
    if (!row) {
      const rankEl = el('span', { className: 'gtl-rank mono' }, MEDALS[rankIdx] || `#${rankIdx + 1}`);
      const avatarEl = el('div', { className: 'gtl-avatar' }, (team.name || 'T')[0].toUpperCase());
      const nameEl = el('div', { className: 'gtl-name card-title' }, team.name);
      const shiftEl = el('span', { className: 'gtl-shift badge-pill hidden' }, '');
      const metaEl = el('div', { className: 'gtl-meta xs muted' }, '');
      const barFillEl = el('div', { className: 'gtl-bar-fill' });
      const pointsEl = el('div', { className: 'gtl-points mono' }, '0 pts');
      const liveChipEl = el('div', { className: 'gtl-live xs' }, '');

      row = el(
        'div',
        {
          className: 'gtl-row',
          dataset: { teamId: team.id }
        },
        rankEl,
        avatarEl,
        el(
          'div',
          { className: 'stack-xs flex-1', style: { minWidth: 0 } },
          el('div', { className: 'row', style: { gap: '6px', minWidth: 0 } }, nameEl, shiftEl),
          metaEl,
          el('div', { className: 'gtl-bar' }, barFillEl)
        ),
        el(
          'div',
          { className: 'stack-xs', style: { alignItems: 'flex-end', flexShrink: 0 } },
          pointsEl,
          liveChipEl
        )
      );

      row._refs = { rankEl, avatarEl, nameEl, shiftEl, metaEl, barFillEl, pointsEl, liveChipEl };
      rowCache.set(team.id, row);
    }

    const { rankEl, avatarEl, nameEl, shiftEl, metaEl, barFillEl, pointsEl, liveChipEl } = row._refs;
    const color = avatarColorForTag(team.accentColor);
    const prevRank = lastRankMap.get(team.id);
    const prevScore = lastScoreMap.get(team.id);
    const pct = leaderMaxPts > 0 ? Math.max(6, Math.round((team.totalPoints / leaderMaxPts) * 100)) : 6;

    row.className = `gtl-row ${team.isMine ? 'mine' : ''} ${rankIdx === 0 ? 'leader' : ''}`;
    rankEl.textContent = MEDALS[rankIdx] || `#${rankIdx + 1}`;
    avatarEl.style.background = color;
    avatarEl.textContent = (team.name || 'T')[0].toUpperCase();
    nameEl.textContent = `${team.name}${team.isMine ? ' ★' : ''}`;
    barFillEl.style.width = `${pct}%`;
    barFillEl.style.background = color;

    const roomTag = team.activeRoomsCount > 0 ? `${team.activeRoomsCount} active room${team.activeRoomsCount > 1 ? 's' : ''}` : 'Club squad';
    metaEl.textContent = `${roomTag} · ${team.gamesCount} matches`;

    if (prevScore !== undefined && team.totalPoints > prevScore) {
      const gained = team.totalPoints - prevScore;
      liveChipEl.textContent = `+${gained} live`;
      liveChipEl.style.color = 'var(--tertiary)';
      liveChipEl.style.fontWeight = '800';
    } else if (team.liveRoomPoints > 0) {
      liveChipEl.textContent = `🔴 +${team.liveRoomPoints} in rooms`;
      liveChipEl.style.color = 'var(--primary)';
      liveChipEl.style.fontWeight = '700';
    } else {
      liveChipEl.textContent = `${team.clubPoints} club`;
      liveChipEl.style.color = 'var(--muted)';
      liveChipEl.style.fontWeight = '600';
    }

    pointsEl.textContent = `${team.totalPoints.toLocaleString()} pts`;

    if (typeof prevRank === 'number' && prevRank !== rankIdx) {
      const diff = prevRank - rankIdx;
      shiftEl.classList.remove('hidden', 'up', 'down');
      if (diff > 0) {
        shiftEl.textContent = `▲ +${diff}`;
        shiftEl.classList.add('up');
        if (animateRankShift) {
          row.classList.add('rank-up');
          setTimeout(() => row.classList.remove('rank-up'), 950);
        }
      } else {
        shiftEl.textContent = `▼ ${diff}`;
        shiftEl.classList.add('down');
        if (animateRankShift) {
          row.classList.add('rank-down');
          setTimeout(() => row.classList.remove('rank-down'), 950);
        }
      }
    } else {
      shiftEl.classList.add('hidden');
    }

    lastRankMap.set(team.id, rankIdx);
    lastScoreMap.set(team.id, team.totalPoints);
    return row;
  }

  function update(animate = true) {
    const data = store.getGlobalTeamLeaderboard(maxTeams);
    const { topTeams, totalActiveRooms, activeRoomSummaries } = data;

    activeRoomsBadge.textContent =
      totalActiveRooms > 0
        ? `🟢 ${totalActiveRooms} Active Room${totalActiveRooms > 1 ? 's' : ''}`
        : '⚪ Standby · Club Ranks';
    activeRoomsBadge.className = `badge-pill mono ${totalActiveRooms > 0 ? 'card-soft-mint' : 'card-soft-amber'}`;

    clearEl(activeRoomsStrip);
    if (activeRoomSummaries.length > 0) {
      activeRoomSummaries.slice(0, 5).forEach((rm) => {
        activeRoomsStrip.appendChild(
          el(
            'span',
            { className: 'badge-pill card-soft-primary xs' },
            `${rm.label}${rm.points > 0 ? ` · ${rm.points} pts` : ''}`
          )
        );
      });
      activeRoomsStrip.classList.remove('hidden');
    } else {
      activeRoomsStrip.classList.add('hidden');
    }

    const leaderMaxPts = Math.max(1, ...(topTeams.map((t) => t.totalPoints)));

    // FLIP Step 1: First (capture existing positions)
    const firstTops = new Map();
    if (animate) {
      Array.from(listEl.children).forEach((child) => {
        const tid = child.dataset?.teamId;
        if (tid) firstTops.set(tid, child.getBoundingClientRect().top);
      });
    }

    // Step 2: Reorder / update DOM nodes without destroying existing rows
    const desiredIds = new Set(topTeams.map((t) => t.id));
    Array.from(listEl.children).forEach((child) => {
      if (!desiredIds.has(child.dataset?.teamId)) {
        listEl.removeChild(child);
      }
    });

    topTeams.forEach((team, idx) => {
      const row = buildOrUpdateRow(team, idx, leaderMaxPts, animate);
      const currentAtIdx = listEl.children[idx];
      if (currentAtIdx !== row) {
        listEl.insertBefore(row, currentAtIdx || null);
      }
    });

    // FLIP Step 3 & 4: Last + Invert + Play
    if (animate && firstTops.size > 0) {
      const toAnimate = [];
      Array.from(listEl.children).forEach((row) => {
        const tid = row.dataset?.teamId;
        const firstTop = firstTops.get(tid);
        if (typeof firstTop === 'number') {
          const lastTop = row.getBoundingClientRect().top;
          const dy = firstTop - lastTop;
          if (Math.abs(dy) > 1) {
            row.style.transition = 'none';
            row.style.transform = `translateY(${dy}px)`;
            toAnimate.push(row);
          }
        }
      });

      if (toAnimate.length > 0 && typeof requestAnimationFrame === 'function') {
        // Force reflow once before starting transitions
        void listEl.offsetHeight;
        requestAnimationFrame(() => {
          toAnimate.forEach((row) => {
            row.style.transition = 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)';
            row.style.transform = '';
          });
        });
      }
    }
  }

  // Initial synchronous render without FLIP delta
  update(false);

  const onUpdate = () => {
    if (!card.isConnected) {
      store.removeEventListener('team-leaderboard', onUpdate);
      store.removeEventListener('buzzer', onUpdate);
      return;
    }
    update(true);
  };

  store.addEventListener('team-leaderboard', onUpdate);
  store.addEventListener('buzzer', onUpdate);

  return card;
}
