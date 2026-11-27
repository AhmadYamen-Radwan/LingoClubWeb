// Taboo & Act Guessing Party View (1:1 port of GuessingScreen.kt)

import { ActivityType, el, shuffleArray } from '../models.js';
import { GUESSING_PACKS } from '../data/curated-content.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openInGameSquadChatModal } from '../components/ui-shared.js';

let roundDuration = 60;
let showHostHint = true;
let roundState = null;
let roundTimer = null;

export function stopGuessingTimer() {
  if (roundTimer) {
    clearInterval(roundTimer);
    roundTimer = null;
  }
}

function stopRoundTimer() {
  stopGuessingTimer();
}

function startGuessingPack(pack) {
  stopRoundTimer();
  const deadlineMs = Date.now() + roundDuration * 1000;
  roundState = {
    pack,
    prompts: shuffleArray(pack.prompts || []),
    idx: 0,
    gotIt: 0,
    skipped: 0,
    timeLeft: roundDuration,
    deadlineMs,
    finished: false
  };
  roundTimer = setInterval(async () => {
    if (!roundState || roundState.finished) return;
    const rem = Math.max(0, Math.ceil((roundState.deadlineMs - Date.now()) / 1000));
    if (rem !== roundState.timeLeft) {
      roundState.timeLeft = rem;
      const pill = document.getElementById('guessing-timer-pill');
      if (pill) pill.textContent = rem > 0 ? `⏱ ${rem}s` : '⏱ Time Up!';
    }
    if (rem <= 0) {
      await finishGuessingRound();
    }
  }, 250);
  store.emit('change');
}

async function finishGuessingRound() {
  stopRoundTimer();
  if (!roundState || roundState.finished) return;
  roundState.finished = true;
  const total = roundState.gotIt + roundState.skipped;
  const acc = total ? Math.round((roundState.gotIt / total) * 100) : 100;
  const score = roundState.gotIt * 100;
  if (roundState.gotIt > 0) store.confetti();
  await store.awardActivityProgress({
    xpDelta: Math.max(15, roundState.gotIt * 15),
    activityType: ActivityType.GUESSING,
    title: `Taboo Party: ${roundState.pack.title}`,
    cefrLevel: roundState.pack.cefrLevel,
    score,
    accuracyPct: acc,
    wordsPracticed: Math.max(1, total),
    durationMinutes: Math.max(1, Math.round(roundDuration / 60))
  });
  store.emit('change');
}

export function renderGuessingView({ navigate }) {
  const cefrFilter = store.selectedCefrFilter;
  const packs = GUESSING_PACKS.filter((p) => !cefrFilter || p.cefrLevel === cefrFilter);

  if (roundState) {
    const r = roundState;
    if (r.finished) {
      return el(
        'div',
        { className: 'stack-lg' },
        el('div', { className: 'card card-soft-mint stack-md', style: { textAlign: 'center', padding: '26px' } },
          el('h1', { className: 'display-title' }, '🎲 Time’s Up!'),
          el('div', { className: 'grid-2' },
            el('div', { className: 'card', style: { textAlign: 'center' } }, el('div', { className: 'display-title mono' }, String(r.gotIt)), el('div', { className: 'xs' }, 'Guessed Right')),
            el('div', { className: 'card', style: { textAlign: 'center' } }, el('div', { className: 'display-title mono' }, String(r.skipped)), el('div', { className: 'xs' }, 'Skipped'))
          ),
          el('div', { className: 'row-between' },
            el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { stopRoundTimer(); roundState = null; store.emit('change'); } }, 'Choose Another Pack'),
            el('button', { type: 'button', className: 'btn btn-primary', onClick: () => startGuessingPack(r.pack) }, 'Play Again')
          )
        )
      );
    }

    const prompt = r.prompts[r.idx % r.prompts.length];
    return el(
      'div',
      { className: 'stack-lg' },
      el(
        'div',
        { className: 'row-between' },
        el('span', { id: 'guessing-timer-pill', className: 'badge-pill card-soft-amber mono' }, `⏱ ${r.timeLeft}s`),
        el('div', { className: 'row' },
          el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Squad Chat', onClick: openInGameSquadChatModal }, '💬'),
          el('button', { type: 'button', className: 'btn btn-outline', onClick: finishGuessingRound }, 'End Round')
        )
      ),
      el(
        'div',
        { className: 'card stack-md', style: { textAlign: 'center', padding: '24px' } },
        el('div', { className: 'row-between' }, el('span', { className: 'small muted' }, `${r.pack.title} · ✅ ${r.gotIt}`), createCefrBadge(r.pack.cefrLevel)),
        el('h2', { className: 'display-title', style: { fontSize: '2rem' } }, prompt.word),
        showHostHint
          ? el('div', { className: 'stack-xs' },
              el('div', { className: 'arabic-text', style: { textAlign: 'center', fontWeight: '700', fontSize: '1.2rem' } }, prompt.arabicHint),
              el('div', { className: 'small muted' }, `💡 ${prompt.actClue}`)
            )
          : null,
        el('div', { className: 'xs muted', style: { fontWeight: '800' } }, 'FORBIDDEN TABOO WORDS:'),
        el(
          'div',
          { className: 'row-wrap', style: { justifyContent: 'center' } },
          ...(prompt.forbiddenWords || []).map((fw) =>
            el('span', { className: 'badge-pill', style: { background: 'var(--error-soft)', color: 'var(--on-error-soft)', padding: '6px 12px', fontSize: '0.88rem' } }, `🚫 ${fw}`)
          )
        )
      ),
      el(
        'div',
        { className: 'grid-2' },
        el('button', { type: 'button', className: 'btn btn-danger-soft btn-full', onClick: () => { r.skipped += 1; r.idx += 1; store.emit('change'); } }, '⏭ Skip'),
        el('button', { type: 'button', className: 'btn btn-mint btn-full', onClick: () => { r.gotIt += 1; r.idx += 1; store.emit('change'); } }, '✓ Got It! (+100)')
      )
    );
  }

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '🎲 Taboo & Act Party'),
      el('div', { className: 'row' }, el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Squad Chat', onClick: openInGameSquadChatModal }, '💬'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home'))
    ),
    el(
      'div',
      { className: 'card stack-sm' },
      el('div', { className: 'row-between', style: { flexWrap: 'wrap' } },
        el('div', { className: 'row-wrap' },
          el('span', { className: 'small', style: { fontWeight: '700' } }, 'Round Timer:'),
          ...[45, 60, 90].map((sec) =>
            el('button', { type: 'button', className: `chip ${roundDuration === sec ? 'selected' : ''}`, onClick: () => { roundDuration = sec; store.emit('change'); } }, `${sec}s`)
          )
        ),
        el('button', { type: 'button', className: `chip ${showHostHint ? 'selected' : ''}`, onClick: () => { showHostHint = !showHostHint; store.emit('change'); } }, showHostHint ? 'Hints: ON' : 'Hints: OFF')
      )
    ),
    el(
      'div',
      { className: 'grid-2' },
      ...packs.map((pack) =>
        el(
          'div',
          { className: 'card stack-sm' },
          el('div', { className: 'row-between' }, el('div', { className: 'card-title' }, pack.title), createCefrBadge(pack.cefrLevel)),
          el('p', { className: 'small muted', style: { margin: 0 } }, `${pack.category} · ${(pack.prompts || []).length} party cards`),
          el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: () => startGuessingPack(pack) }, 'Start Party Round →')
        )
      )
    )
  );
}
