// Word Forge Puzzles View — Sentence Scramble, Collocation Match, Cloze Gap-Fill
// (1:1 port of PuzzlesScreen.kt)

import { ActivityType, computeAdaptiveDifficulty, el, shuffleArray } from '../models.js';
import { CLOZE_PUZZLES, MATCH_PUZZLE_SETS, SENTENCE_PUZZLES } from '../data/curated-content.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openInGameSquadChatModal, renderTranslatableText } from '../components/ui-shared.js';

let puzzleTab = 'SCRAMBLE'; // 'SCRAMBLE' | 'MATCH' | 'CLOZE'
let streak = 0;
let attempts = 0;
let correct = 0;

// Per-tab indices & states
let scrambleIdx = 0;
let scrambleTray = [];
let scrambleBank = [];
let scrambleChecked = null; // null | boolean

let matchIdx = 0;
let matchLeftIdx = null;
let matchedPairs = new Set();

let clozeIdx = 0;
let clozePicked = null;

function initScrambleRound(puzzles) {
  const p = puzzles[scrambleIdx % puzzles.length];
  scrambleTray = [];
  scrambleBank = shuffleArray(p.tokens.map((word, idx) => ({ id: `${idx}_${word}`, word })));
  scrambleChecked = null;
}

export function renderPuzzlesView({ navigate }) {
  const cefrFilter = store.selectedCefrFilter;
  const scrambleList = SENTENCE_PUZZLES.filter((p) => !cefrFilter || p.cefrLevel === cefrFilter);
  const matchList = MATCH_PUZZLE_SETS.filter((m) => !cefrFilter || m.cefrLevel === cefrFilter);
  const clozeList = CLOZE_PUZZLES.filter((c) => !cefrFilter || c.cefrLevel === cefrFilter);

  const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 100;
  const adaptiveDiff = computeAdaptiveDifficulty(streak, acc);

  if (puzzleTab === 'SCRAMBLE' && scrambleList.length && scrambleBank.length === 0 && scrambleTray.length === 0) {
    initScrambleRound(scrambleList);
  }

  let body = null;

  if (puzzleTab === 'SCRAMBLE') {
    const p = scrambleList[scrambleIdx % scrambleList.length];
    const targetSentence = p.tokens.join(' ');
    body = el(
      'div',
      { className: 'stack-md' },
      el(
        'div',
        { className: 'card stack-sm' },
        el('div', { className: 'row-between' }, el('span', { className: 'small muted' }, `${p.topic} · Puzzle ${(scrambleIdx % scrambleList.length) + 1}/${scrambleList.length}`), createCefrBadge(p.cefrLevel)),
        el('div', { className: 'small' }, `💡 Hint: ${p.hint}`),
        el(
          'div',
          {
            className: 'card row-wrap',
            style: { minHeight: '72px', background: 'var(--surface-variant)', padding: '12px' }
          },
          scrambleTray.length === 0
            ? el('span', { className: 'small muted' }, 'Tap words below in order to build the sentence...')
            : scrambleTray.map((tok, tIdx) =>
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'chip selected',
                    onClick: () => {
                      scrambleTray.splice(tIdx, 1);
                      scrambleBank.push(tok);
                      scrambleChecked = null;
                      store.emit('change');
                    }
                  },
                  tok.word
                )
              )
        ),
        el(
          'div',
          { className: 'row-wrap' },
          ...scrambleBank.map((tok, bIdx) =>
            el(
              'button',
              {
                type: 'button',
                className: 'chip',
                onClick: () => {
                  scrambleBank.splice(bIdx, 1);
                  scrambleTray.push(tok);
                  scrambleChecked = null;
                  store.emit('change');
                }
              },
              tok.word
            )
          )
        ),
        el(
          'div',
          { className: 'row-between' },
          el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { initScrambleRound(scrambleList); store.emit('change'); } }, '↺ Reset'),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-primary',
              disabled: scrambleTray.length === 0,
              onClick: async () => {
                attempts += 1;
                const built = scrambleTray.map((t) => t.word).join(' ');
                const ok = built === targetSentence;
                scrambleChecked = ok;
                if (ok) {
                  correct += 1;
                  streak += 1;
                  ttsSpeaker.speak(targetSentence);
                  store.confetti();
                  await store.awardActivityProgress({
                    xpDelta: 20,
                    activityType: ActivityType.PUZZLE,
                    title: `Scramble: ${p.topic}`,
                    cefrLevel: p.cefrLevel,
                    score: 100,
                    accuracyPct: 100,
                    wordsPracticed: p.tokens.length,
                    durationMinutes: 1
                  });
                } else {
                  streak = 0;
                }
                store.emit('change');
              }
            },
            'Check Sentence ✓'
          )
        ),
        scrambleChecked !== null
          ? el(
              'div',
              { className: `card stack-xs ${scrambleChecked ? 'card-soft-mint' : 'card-soft-secondary'}` },
              el('strong', {}, scrambleChecked ? '🎉 Perfect Sentence!' : 'Not quite right — try rearranging!'),
              scrambleChecked ? el('div', { className: 'small' }, renderTranslatableText(targetSentence, { cefrLevel: p.cefrLevel })) : null,
              el('button', { type: 'button', className: 'btn btn-soft', onClick: () => { scrambleIdx += 1; initScrambleRound(scrambleList); store.emit('change'); } }, 'Next Puzzle →')
            )
          : null
      )
    );
  } else if (puzzleTab === 'MATCH') {
    const m = matchList[matchIdx % matchList.length];
    const pairs = m.pairs || [];
    const rightItems = shuffleArray(pairs.map((p, i) => ({ idx: i, right: p.right })));
    body = el(
      'div',
      { className: 'card stack-md' },
      el('div', { className: 'row-between' }, el('div', { className: 'card-title' }, m.title), createCefrBadge(m.cefrLevel)),
      el(
        'div',
        { className: 'grid-2' },
        el(
          'div',
          { className: 'stack-sm' },
          ...pairs.map((p, i) =>
            el(
              'button',
              {
                type: 'button',
                className: `btn btn-full ${matchedPairs.has(i) ? 'btn-mint' : matchLeftIdx === i ? 'btn-primary' : 'btn-outline'}`,
                disabled: matchedPairs.has(i),
                onClick: () => { matchLeftIdx = i; store.emit('change'); }
              },
              p.left
            )
          )
        ),
        el(
          'div',
          { className: 'stack-sm' },
          ...rightItems.map((r) =>
            el(
              'button',
              {
                type: 'button',
                className: `btn btn-full ${matchedPairs.has(r.idx) ? 'btn-mint' : 'btn-outline'}`,
                disabled: matchedPairs.has(r.idx) || matchLeftIdx === null,
                onClick: async () => {
                  attempts += 1;
                  if (matchLeftIdx === r.idx) {
                    matchedPairs.add(r.idx);
                    correct += 1;
                    streak += 1;
                    matchLeftIdx = null;
                    if (matchedPairs.size === pairs.length) {
                      store.confetti();
                      await store.awardActivityProgress({
                        xpDelta: 25,
                        activityType: ActivityType.PUZZLE,
                        title: `Collocation Match: ${m.title}`,
                        cefrLevel: m.cefrLevel,
                        score: 120,
                        accuracyPct: 100,
                        wordsPracticed: pairs.length * 2,
                        durationMinutes: 2
                      });
                    }
                  } else {
                    streak = 0;
                    matchLeftIdx = null;
                    store.toast('Try a different collocation pair!', 'error');
                  }
                  store.emit('change');
                }
              },
              r.right
            )
          )
        )
      ),
      matchedPairs.size === pairs.length
        ? el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: () => { matchIdx += 1; matchedPairs = new Set(); matchLeftIdx = null; store.emit('change'); } }, 'Next Collocation Set →')
        : null
    );
  } else {
    const c = clozeList[clozeIdx % clozeList.length];
    body = el(
      'div',
      { className: 'card stack-md' },
      el('div', { className: 'row-between' }, el('span', { className: 'small muted' }, `${c.topic} · Cloze ${(clozeIdx % clozeList.length) + 1}/${clozeList.length}`), createCefrBadge(c.cefrLevel)),
      el('p', { style: { fontSize: '1.15rem', lineHeight: 1.7, margin: 0 } }, `${c.before} [ ______ ] ${c.after}`),
      el(
        'div',
        { className: 'grid-2' },
        ...(c.options || []).map((opt) => {
          const isRight = opt === c.answer;
          const picked = clozePicked !== null;
          return el(
            'button',
            {
              type: 'button',
              className: `btn btn-full ${picked ? (isRight ? 'btn-mint' : clozePicked === opt ? 'btn-danger-soft' : 'btn-outline') : 'btn-outline'}`,
              disabled: picked,
              onClick: async () => {
                clozePicked = opt;
                attempts += 1;
                if (isRight) {
                  correct += 1;
                  streak += 1;
                  await store.awardActivityProgress({
                    xpDelta: 15,
                    activityType: ActivityType.PUZZLE,
                    title: `Gap-Fill: ${c.topic}`,
                    cefrLevel: c.cefrLevel,
                    score: 80,
                    accuracyPct: 100,
                    wordsPracticed: 1,
                    durationMinutes: 1
                  });
                } else {
                  streak = 0;
                }
                store.emit('change');
              }
            },
            opt
          );
        })
      ),
      clozePicked
        ? el(
            'div',
            { className: `card stack-xs ${clozePicked === c.answer ? 'card-soft-mint' : 'card-soft-secondary'}` },
            el('strong', {}, clozePicked === c.answer ? '✅ Correct!' : `Answer: ${c.answer}`),
            el('div', { className: 'small' }, c.explanation),
            el('button', { type: 'button', className: 'btn btn-primary', onClick: () => { clozeIdx += 1; clozePicked = null; store.emit('change'); } }, 'Next Gap-Fill →')
          )
        : null
  }

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '🧩 Word Forge'),
      el('div', { className: 'row' }, el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Squad Chat', onClick: openInGameSquadChatModal }, '💬'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home'))
    ),
    el(
      'div',
      { className: 'row-between', style: { flexWrap: 'wrap' } },
      el(
        'div',
        { className: 'row-wrap' },
        ...[
          { id: 'SCRAMBLE', label: '🔤 Scramble' },
          { id: 'MATCH', label: '🔗 Match' },
          { id: 'CLOZE', label: '✍️ Gap-Fill' }
        ].map((t) =>
          el('button', { type: 'button', className: `chip ${puzzleTab === t.id ? 'selected' : ''}`, onClick: () => { puzzleTab = t.id; store.emit('change'); } }, t.label)
        )
      ),
      el('span', { className: 'badge-pill card-soft-amber mono' }, `Adaptive: ${adaptiveDiff} · 🔥${streak}`)
    ),
    body
  );
}
