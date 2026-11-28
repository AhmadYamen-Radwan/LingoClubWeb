// Global Team Buzzer Overlay Component (5-second lockout after buzz-in)

import { avatarColorForTag, clearEl, el } from '../models.js';
import { store } from '../store/app-store.js';

let lockIntervalId = null;

function stopLockTick() {
  if (lockIntervalId) {
    clearInterval(lockIntervalId);
    lockIntervalId = null;
  }
}

export function renderTeamBuzzerOverlay() {
  const root = document.getElementById('buzzer-root');
  if (!root) return;

  const b = store.teamBuzzer;
  if (!b || !b.open) {
    stopLockTick();
    root.classList.add('hidden');
    clearEl(root);
    return;
  }

  root.classList.remove('hidden');
  stopLockTick();

  const active = b.activeBuzz && Date.now() < Number(b.activeBuzz.lockUntilMs || 0) ? b.activeBuzz : null;
  const remainingMs = active ? Math.max(0, Number(active.lockUntilMs) - Date.now()) : 0;
  const remainingSec = (remainingMs / 1000).toFixed(1);
  const progressPct = active ? Math.min(100, Math.max(0, (remainingMs / 5000) * 100)) : 0;
  const isLocked = Boolean(active && remainingMs > 0);

  const teams = b.teams?.length ? b.teams : store.getDefaultBattleTeams();
  const scores = b.sessionScores || {};
  const myTeamId = store.profile?.teamId || store.selectedTeamId;

  const card = el(
    'div',
    { className: 'buzzer-card stack-md' },
    // Header
    el(
      'div',
      { className: 'row-between' },
      el(
        'div',
        { className: 'stack-xs' },
        el('div', { className: 'display-title', style: { fontSize: '1.35rem' } }, b.title || '🚨 Team Buzzer'),
        el('div', { className: 'xs muted' }, 'First squad to tap locks out rival teams for 5.0 seconds')
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-outline',
          onClick: () => store.closeTeamBuzzer()
        },
        '✕ Close'
      )
    ),

    // Active Clue / Prompt Banner
    b.prompt
      ? el(
          'div',
          { className: 'card card-soft-primary stack-xs', style: { padding: '12px 14px' } },
          el('div', { className: 'xs', style: { fontWeight: '800', opacity: 0.8 } }, 'ACTIVE QUESTION / CLUE'),
          el('div', { className: 'card-title' }, b.prompt)
        )
      : null,

    // Lockout Spotlight Banner
    isLocked
      ? el(
          'div',
          {
            className: 'buzzer-locked-banner stack-sm',
            style: { borderColor: avatarColorForTag(active.avatarColor) }
          },
          el(
            'div',
            { className: 'row-between' },
            el(
              'div',
              { className: 'row', style: { gap: '10px' } },
              el(
                'div',
                {
                  style: {
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: avatarColorForTag(active.avatarColor),
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '1.1rem'
                  }
                },
                '⚡'
              ),
              el(
                'div',
                { className: 'stack-xs' },
                el('div', { className: 'card-title' }, `${active.teamName} BUZZED IN FIRST!`),
                el('div', { className: 'xs muted' }, `Member: ${active.playerName} · Rivals locked out`)
              )
            ),
            el(
              'span',
              { id: 'buzzer-lock-timer', className: 'badge-pill card-soft-secondary mono', style: { fontWeight: '800' } },
              `🔒 ${remainingSec}s`
            )
          ),
          el(
            'div',
            { className: 'buzzer-progress-track' },
            el('div', {
              id: 'buzzer-lock-bar',
              className: 'buzzer-progress-fill',
              style: { width: `${progressPct}%`, background: avatarColorForTag(active.avatarColor) }
            })
          ),
          el(
            'div',
            { className: 'row-wrap' },
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn-mint flex-1',
                onClick: () => store.resolveTeamBuzz({ correct: true, points: 100 })
              },
              '✅ Correct (+100 Pts)'
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn-danger-soft flex-1',
                onClick: () => store.resolveTeamBuzz({ correct: false })
              },
              '❌ Wrong (-25 Pts)'
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn-outline',
                onClick: () => store.resetTeamBuzzLock()
              },
              '🔓 Reset'
            )
          )
        )
      : el(
          'div',
          { className: 'card card-soft-mint row-between', style: { padding: '10px 14px' } },
          el('strong', { className: 'small' }, '🟢 Buzzers ARMED — Ready for fastest team!'),
          el('span', { className: 'xs mono muted' }, 'Keys 1–4 or Tap')
        ),

    // Team Buzzer Pads Grid
    el(
      'div',
      { className: 'buzzer-grid' },
      ...teams.map((team, idx) => {
        const isWinner = isLocked && active.teamId === team.id;
        const isBlocked = isLocked && active.teamId !== team.id;
        const teamColor = avatarColorForTag(team.accentColor || ['CORAL', 'INDIGO', 'AMBER', 'MINT'][idx % 4]);
        const pts = Number(scores[team.id] || 0);
        const isMine = team.id === myTeamId;

        return el(
          'button',
          {
            type: 'button',
            className: `buzzer-pad ${isWinner ? 'winner' : ''} ${isBlocked ? 'locked-out' : ''}`,
            disabled: isLocked,
            style: {
              '--pad-color': teamColor,
              borderColor: isWinner ? teamColor : undefined
            },
            onClick: () => {
              store.triggerTeamBuzz({
                teamId: team.id,
                teamName: team.name,
                playerUid: store.currentUserId,
                playerName: store.currentUserName,
                avatarColor: team.accentColor || ['CORAL', 'INDIGO', 'AMBER', 'MINT'][idx % 4]
              });
            }
          },
          el(
            'div',
            { className: 'row-between', style: { width: '100%' } },
            el('span', { className: 'badge-pill', style: { background: teamColor, color: '#FFFFFF' } }, `${idx + 1}`),
            el('span', { className: 'mono small', style: { fontWeight: '800' } }, `${pts} pts`)
          ),
          el('div', { className: 'buzzer-pad-icon' }, isWinner ? '⚡' : isBlocked ? '🔒' : '🔔'),
          el('div', { className: 'card-title' }, team.name + (isMine ? ' (You)' : '')),
          el(
            'div',
            { className: 'xs buzzer-pad-status' },
            isWinner ? 'LOCKED IN!' : isBlocked ? 'Locked out (5s)' : 'TAP TO BUZZ!'
          )
        );
      })
    ),

    // Recent Buzz Log
    (b.buzzHistory || []).length > 0
      ? el(
          'div',
          { className: 'stack-xs' },
          el('div', { className: 'xs muted', style: { fontWeight: '800' } }, 'RECENT BUZZ RESULTS'),
          el(
            'div',
            { className: 'scroll-x' },
            ...b.buzzHistory.slice(0, 5).map((h) =>
              el(
                'span',
                { className: `badge-pill ${h.correct ? 'card-soft-mint' : 'card-soft-secondary'}` },
                `${h.correct ? '✅' : '❌'} ${h.teamName} (${h.pointsDelta > 0 ? `+${h.pointsDelta}` : h.pointsDelta})`
              )
            )
          )
        )
      : null
  );

  clearEl(root);
  root.appendChild(card);

  if (isLocked) {
    lockIntervalId = setInterval(() => {
      const cur = store.teamBuzzer?.activeBuzz;
      if (!cur || !store.teamBuzzer?.open) {
        stopLockTick();
        return;
      }
      const rem = Math.max(0, Number(cur.lockUntilMs) - Date.now());
      const timerEl = document.getElementById('buzzer-lock-timer');
      const barEl = document.getElementById('buzzer-lock-bar');
      if (timerEl) timerEl.textContent = `🔒 ${(rem / 1000).toFixed(1)}s`;
      if (barEl) barEl.style.width = `${Math.min(100, Math.max(0, (rem / 5000) * 100))}%`;
      if (rem <= 0) {
        stopLockTick();
      }
    }, 100);
  }
}

// Keyboard shortcuts when Team Buzzer overlay is open
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    const b = store.teamBuzzer;
    if (!b?.open) return;
    if (e.key === 'Escape') {
      store.closeTeamBuzzer();
      return;
    }
    if (['1', '2', '3', '4'].includes(e.key)) {
      const idx = Number(e.key) - 1;
      const team = (b.teams || [])[idx];
      if (team && !(b.activeBuzz && Date.now() < Number(b.activeBuzz.lockUntilMs || 0))) {
        store.triggerTeamBuzz({
          teamId: team.id,
          teamName: team.name,
          playerUid: store.currentUserId,
          playerName: store.currentUserName,
          avatarColor: team.accentColor
        });
      }
    }
  });
}
