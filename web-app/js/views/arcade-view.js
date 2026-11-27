// Interactive Arcade Hub — 8 English Games + 4 Arabic Games (ألعاب عربية)
// Honors Student Difficulty (Easy/Medium/Hard) & Drift-Free Deadline Timers

import { ActivityType, DIFFICULTY_CONFIG, DIFFICULTY_LEVELS, el, shuffleArray } from '../models.js';
import {
  ARABIC_ARCADE_WORDS,
  ARABIC_GRAMMAR_DUEL_ROUNDS,
  ARABIC_VAULT_WORDS,
  CRIME_MYSTERY_CASES,
  CURATED_EVIDENCE_CARDS,
  CURATED_HEIST_CIPHERS,
  CURATED_ODD_CLUE_ROUNDS,
  WHEEL_SLICES
} from '../data/curated-content.js';
import { WEEKLY_CURRICULUM } from '../data/weekly-curriculum.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openInGameSquadChatModal } from '../components/ui-shared.js';
import { createSpinWheelCanvas } from '../components/canvas-3d.js';

const ARABIC_ALPHABET = [
  'ا', 'أ', 'إ', 'ب', 'ت', 'ة', 'ث', 'ج', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و',
  'ي', 'ى', 'ئ', 'ؤ'
];

let activeMode = null; // 'DASH'|'DETECTIVE'|'CRIME'|'EVIDENCE'|'VAULT'|'DUEL'|'MEMORY'|'WHEEL'|'AR_BLITZ'|'AR_DETECTIVE'|'AR_VAULT'|'AR_DUEL'
let hubLang = 'ALL'; // 'ALL' | 'EN' | 'AR'
let hubCategory = 'ALL';
let gState = null;
let arcadeTimer = null;

export function stopArcadeTimers() {
  if (arcadeTimer) {
    clearInterval(arcadeTimer);
    arcadeTimer = null;
  }
}

function getDiffConfig() {
  return store.difficultyConfig || DIFFICULTY_CONFIG.MEDIUM;
}

function getAllWordsPool() {
  return WEEKLY_CURRICULUM.flatMap((wk) =>
    (wk.words || []).map((w) => ({
      ...w,
      english: String(w.word || w.english || '').trim(),
      exampleSentence: String(w.storyLine || w.exampleSentence || w.meaning || '').trim(),
      arabic: String(w.arabic || '').trim(),
      cefrLevel: w.cefrLevel || 'B1'
    }))
  ).filter((w) => w.english && w.arabic);
}

function exitToHub() {
  stopArcadeTimers();
  activeMode = null;
  gState = null;
  store.emit('change');
}

// ---------------- ENGLISH ARCADE GAMES ----------------

function startWordDash() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const pool = shuffleArray(getAllWordsPool());
  const makeQ = (idx) => {
    const target = pool[idx % pool.length];
    const distractors = shuffleArray(pool.filter((w) => w.english !== target.english)).slice(0, 3);
    const opts = shuffleArray([target.arabic, ...distractors.map((d) => d.arabic)]);
    return { target, opts, hiddenIndices: new Set() };
  };
  gState = {
    diff,
    timeLeft: diff.dashDurationSec,
    deadlineMs: Date.now() + diff.dashDurationSec * 1000,
    score: 0,
    combo: 0,
    bestCombo: 0,
    correct: 0,
    total: 0,
    qIdx: 0,
    used5050: false,
    usedFreeze: false,
    finished: false,
    cur: makeQ(0),
    makeQ
  };
  arcadeTimer = setInterval(() => {
    if (!gState || gState.finished || activeMode !== 'DASH') return;
    const rem = Math.max(0, Math.ceil((gState.deadlineMs - Date.now()) / 1000));
    if (rem !== gState.timeLeft) {
      gState.timeLeft = rem;
      const elTimer = document.getElementById('arcade-dash-timer');
      if (elTimer) elTimer.textContent = `⏱ ${rem}s`;
    }
    if (rem <= 0) {
      finishDash();
    }
  }, 250);
  activeMode = 'DASH';
  store.emit('change');
}

async function finishDash() {
  stopArcadeTimers();
  if (!gState || gState.finished) return;
  gState.finished = true;
  const acc = gState.total ? Math.round((gState.correct / gState.total) * 100) : 100;
  const xp = Math.round(Math.max(15, Math.round(gState.score / 15)) * (gState.diff?.xpMultiplier || 1));
  store.confetti();
  await store.awardActivityProgress({
    xpDelta: xp,
    activityType: ActivityType.GAME,
    title: 'Word Dash Blitz',
    score: gState.score,
    accuracyPct: acc,
    wordsPracticed: Math.max(1, gState.total),
    durationMinutes: 1,
    arcadePlayed: true,
    highCombo: gState.bestCombo,
    publishLeaderboardMode: 'ARCADE'
  });
  store.emit('change');
}

function startWordDetective() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const pool = shuffleArray(getAllWordsPool().filter((w) => /^[a-zA-Z]{4,9}$/.test(w.english)));
  const wordObj = pool[0] || { english: 'evidence', arabic: 'دليل', exampleSentence: 'The detective found new evidence.', cefrLevel: 'B1' };
  gState = {
    diff,
    wordObj,
    targetUpper: wordObj.english.toUpperCase(),
    guessed: new Set(),
    wrongCount: 0,
    maxWrong: diff.detectiveLives,
    finished: false,
    won: false
  };
  activeMode = 'DETECTIVE';
  store.emit('change');
}

function startCrimeMystery() {
  stopArcadeTimers();
  const cases = shuffleArray(CRIME_MYSTERY_CASES).map((c) => {
    const culprit = (c.suspects || []).find((s) => s.id === c.correctSuspectId || s.isGuilty) || c.suspects?.[0];
    return {
      ...c,
      scene: c.scene || c.crimeSceneSummary || '',
      culpritName: c.culpritName || culprit?.name || '',
      explanation: c.explanation || c.detectiveClue || '',
      forensicTip: c.forensicTip || c.vocabularyTip || ''
    };
  });
  gState = {
    cases,
    idx: 0,
    score: 0,
    solved: 0,
    pickedSuspect: null,
    shuffledSuspects: shuffleArray(cases[0].suspects || []),
    showTip: false
  };
  activeMode = 'CRIME';
  store.emit('change');
}

function startEvidenceBoard() {
  stopArcadeTimers();
  const cards = CURATED_EVIDENCE_CARDS.map((card, i) => {
    const linkedCase = CRIME_MYSTERY_CASES[i % CRIME_MYSTERY_CASES.length];
    const culprit = (linkedCase?.suspects || []).find((s) => s.id === linkedCase.correctSuspectId || s.isGuilty);
    return {
      ...card,
      categoryTag: card.categoryTag || card.category || 'Evidence',
      clueDetail: card.clueDetail || `${card.description} Clue: ${card.englishClue} (${card.arabicMeaning})`,
      vocabHint: card.vocabHint || `${card.arabicMeaning} — ${card.englishClue}`,
      correctSuspect: card.correctSuspect || culprit?.name || 'Unknown Suspect',
      suspectOptions: card.suspectOptions || shuffleArray((linkedCase?.suspects || []).map((s) => s.name))
    };
  });
  gState = {
    cards,
    selectedCardId: cards[0].id,
    pickedCulprit: null,
    solvedIds: new Set()
  };
  activeMode = 'EVIDENCE';
  store.emit('change');
}

function startVaultCodebreaker() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const ciphers = shuffleArray(CURATED_HEIST_CIPHERS);
  const cipher = ciphers[0];
  gState = {
    diff,
    cipher: { ...cipher, cefrLevel: cipher.cefrLevel || cipher.level || 'B1' },
    target: cipher.word.toUpperCase(),
    guesses: [],
    currentInput: '',
    maxRows: diff.vaultRows,
    finished: false,
    won: false
  };
  activeMode = 'VAULT';
  store.emit('change');
}

function startSpeedDuel() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const rounds = shuffleArray(CURATED_ODD_CLUE_ROUNDS).map((r) => {
    const opts = r.options || r.words || [];
    const oddWord = r.oddWord || opts[Number(r.oddIndex || 0)];
    return {
      ...r,
      theme: r.theme || r.scenarioPrompt || 'Spot the odd clue',
      words: opts,
      shuffledWords: shuffleArray(opts),
      oddWord,
      reason: r.reason || r.explanation || '',
      cefrLevel: r.cefrLevel || r.level || 'B1'
    };
  });
  gState = {
    diff,
    rounds,
    idx: 0,
    timeLeft: diff.duelDurationSec,
    deadlineMs: Date.now() + diff.duelDurationSec * 1000,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    finished: false
  };
  arcadeTimer = setInterval(async () => {
    if (!gState || gState.finished || activeMode !== 'DUEL') return;
    const rem = Math.max(0, Math.ceil((gState.deadlineMs - Date.now()) / 1000));
    if (rem !== gState.timeLeft) {
      gState.timeLeft = rem;
      const pill = document.getElementById('duel-timer-pill');
      if (pill) pill.textContent = `⏱ ${rem}s`;
    }
    if (rem <= 0) {
      stopArcadeTimers();
      gState.finished = true;
      await store.awardActivityProgress({
        xpDelta: Math.round(Math.max(20, Math.round(gState.score / 15)) * (gState.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: 'Mystery Speed Duel',
        score: gState.score,
        accuracyPct: Math.round((gState.correct / Math.max(1, gState.idx + 1)) * 100),
        wordsPracticed: gState.idx + 1,
        durationMinutes: 1,
        arcadePlayed: true,
        highCombo: gState.bestStreak,
        publishLeaderboardMode: 'ARCADE'
      });
      store.emit('change');
    }
  }, 250);
  activeMode = 'DUEL';
  store.emit('change');
}

function startMemoryFlip() {
  stopArcadeTimers();
  const picked = shuffleArray(getAllWordsPool()).slice(0, 6);
  const tiles = shuffleArray(
    picked.flatMap((w, i) => [
      { uid: `en_${i}`, pairId: i, text: w.english, kind: 'en' },
      { uid: `ar_${i}`, pairId: i, text: w.arabic, kind: 'ar' }
    ])
  );
  gState = {
    tiles,
    flippedIndices: [],
    matchedPairIds: new Set(),
    moves: 0,
    locked: false,
    finished: false
  };
  activeMode = 'MEMORY';
  store.emit('change');
}

function startSpinWheel() {
  stopArcadeTimers();
  gState = {
    rotation: 0,
    spinning: false,
    lastSlice: null,
    spinsToday: 0
  };
  activeMode = 'WHEEL';
  store.emit('change');
}

// ---------------- ARABIC ARCADE GAMES (ألعاب عربية) ----------------

function startArabicBlitz() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const pool = shuffleArray(ARABIC_ARCADE_WORDS);
  const makeQ = (idx) => {
    const target = pool[idx % pool.length];
    const askAntonym = idx % 2 === 1;
    const answer = askAntonym ? target.antonym : target.synonym;
    const otherVals = pool
      .filter((w) => w.word !== target.word)
      .map((w) => (askAntonym ? w.antonym : w.synonym))
      .filter((v) => v && v !== answer);
    const distractors = shuffleArray([...new Set(otherVals)]).slice(0, 3);
    const opts = shuffleArray([answer, ...distractors]);
    return { target, askAntonym, answer, opts, hiddenIndices: new Set() };
  };
  gState = {
    diff,
    timeLeft: diff.dashDurationSec,
    deadlineMs: Date.now() + diff.dashDurationSec * 1000,
    score: 0,
    combo: 0,
    bestCombo: 0,
    correct: 0,
    total: 0,
    qIdx: 0,
    used5050: false,
    usedFreeze: false,
    finished: false,
    cur: makeQ(0),
    makeQ
  };
  arcadeTimer = setInterval(async () => {
    if (!gState || gState.finished || activeMode !== 'AR_BLITZ') return;
    const rem = Math.max(0, Math.ceil((gState.deadlineMs - Date.now()) / 1000));
    if (rem !== gState.timeLeft) {
      gState.timeLeft = rem;
      const timerEl = document.getElementById('ar-blitz-timer');
      if (timerEl) timerEl.textContent = `⏱ ${rem}s`;
    }
    if (rem <= 0) {
      stopArcadeTimers();
      gState.finished = true;
      const acc = gState.total ? Math.round((gState.correct / gState.total) * 100) : 100;
      store.confetti();
      await store.awardActivityProgress({
        xpDelta: Math.round(Math.max(15, Math.round(gState.score / 15)) * (gState.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: 'سباق المعاني العربي (Arabic Blitz)',
        score: gState.score,
        accuracyPct: acc,
        wordsPracticed: Math.max(1, gState.total),
        durationMinutes: 1,
        arcadePlayed: true,
        highCombo: gState.bestCombo,
        publishLeaderboardMode: 'ARCADE'
      });
      store.emit('change');
    }
  }, 250);
  activeMode = 'AR_BLITZ';
  store.emit('change');
}

function startArabicDetective() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const pool = shuffleArray(ARABIC_ARCADE_WORDS);
  const wordObj = pool[0] || ARABIC_ARCADE_WORDS[0];
  gState = {
    diff,
    wordObj,
    targetWord: wordObj.word.trim(),
    guessed: new Set(),
    wrongCount: 0,
    maxWrong: diff.detectiveLives,
    finished: false,
    won: false
  };
  activeMode = 'AR_DETECTIVE';
  store.emit('change');
}

function startArabicVault() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const pool = shuffleArray(ARABIC_VAULT_WORDS);
  const cipher = pool[0] || ARABIC_VAULT_WORDS[0];
  gState = {
    diff,
    cipher,
    target: cipher.word.trim(),
    guesses: [],
    currentInput: '',
    maxRows: diff.vaultRows,
    finished: false,
    won: false
  };
  activeMode = 'AR_VAULT';
  store.emit('change');
}

function startArabicDuel() {
  stopArcadeTimers();
  const diff = getDiffConfig();
  const rounds = shuffleArray(ARABIC_GRAMMAR_DUEL_ROUNDS).map((r) => ({
    ...r,
    shuffledOptions: shuffleArray(r.options.map((text, idx) => ({ text, isCorrect: idx === Number(r.oddIndex) })))
  }));
  gState = {
    diff,
    rounds,
    idx: 0,
    timeLeft: diff.duelDurationSec,
    deadlineMs: Date.now() + diff.duelDurationSec * 1000,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    finished: false
  };
  arcadeTimer = setInterval(async () => {
    if (!gState || gState.finished || activeMode !== 'AR_DUEL') return;
    const rem = Math.max(0, Math.ceil((gState.deadlineMs - Date.now()) / 1000));
    if (rem !== gState.timeLeft) {
      gState.timeLeft = rem;
      const pill = document.getElementById('ar-duel-timer');
      if (pill) pill.textContent = `⏱ ${rem}s`;
    }
    if (rem <= 0) {
      stopArcadeTimers();
      gState.finished = true;
      store.confetti();
      await store.awardActivityProgress({
        xpDelta: Math.round(Math.max(20, Math.round(gState.score / 15)) * (gState.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: 'تحدي النحو والإملاء (Arabic Duel)',
        score: gState.score,
        accuracyPct: Math.round((gState.correct / Math.max(1, gState.idx + 1)) * 100),
        wordsPracticed: gState.idx + 1,
        durationMinutes: 1,
        arcadePlayed: true,
        highCombo: gState.bestStreak,
        publishLeaderboardMode: 'ARCADE'
      });
      store.emit('change');
    }
  }, 250);
  activeMode = 'AR_DUEL';
  store.emit('change');
}

// ---------------- RENDERERS ----------------

function renderDashGame() {
  const g = gState;
  if (g.finished) {
    return el(
      'div',
      { className: 'card card-soft-mint stack-md', style: { textAlign: 'center', padding: '26px' } },
      el('h2', { className: 'display-title' }, '⚡ Word Dash Complete!'),
      el('div', { className: 'display-title mono' }, `${g.score} pts`),
      el('p', { className: 'small' }, `${g.correct}/${g.total} right · Best Combo: ${g.bestCombo}x · ${g.diff?.label || ''}`),
      el('div', { className: 'row-between' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startWordDash }, 'Play Again'))
    );
  }
  const { target, opts, hiddenIndices } = g.cur;
  return el(
    'div',
    { className: 'stack-md' },
    el('div', { className: 'row-between' }, el('span', { id: 'arcade-dash-timer', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.combo}x`)),
    el(
      'div',
      { className: 'card stack-sm', style: { textAlign: 'center' } },
      el('div', { className: 'row-between' }, createCefrBadge(target.cefrLevel), el('button', { type: 'button', className: 'btn-icon', onClick: () => ttsSpeaker.speak(target.english) }, '🔊')),
      el('h2', { className: 'display-title' }, target.english),
      el('p', { className: 'small muted', style: { margin: 0 } }, 'Pick the accurate Arabic meaning!')
    ),
    el(
      'div',
      { className: 'row-wrap' },
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-soft flex-1',
          disabled: g.used5050,
          onClick: () => {
            g.used5050 = true;
            const wrong = opts.map((o, idx) => (o !== target.arabic ? idx : -1)).filter((i) => i >= 0);
            shuffleArray(wrong).slice(0, 2).forEach((i) => hiddenIndices.add(i));
            store.emit('change');
          }
        },
        g.used5050 ? '50/50 Used' : '✂️ 50/50 Lifeline'
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-soft flex-1',
          disabled: g.usedFreeze,
          onClick: () => {
            g.usedFreeze = true;
            g.deadlineMs += 10000;
            g.timeLeft += 10;
            store.toast('+10 seconds added!');
            store.emit('change');
          }
        },
        g.usedFreeze ? '+10s Used' : '❄️ +10s Freeze'
      )
    ),
    el(
      'div',
      { className: 'grid-2' },
      ...opts.map((opt, idx) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline arabic-text',
            style: { minHeight: '60px', justifyContent: 'center', visibility: hiddenIndices.has(idx) ? 'hidden' : 'visible' },
            onClick: () => {
              g.total += 1;
              if (opt === target.arabic) {
                g.combo += 1;
                g.bestCombo = Math.max(g.bestCombo, g.combo);
                g.correct += 1;
                g.score += 50 + Math.min(g.combo, 5) * 20;
              } else {
                g.combo = 0;
                store.toast(`Answer: ${target.arabic}`, 'error');
              }
              g.qIdx += 1;
              g.cur = g.makeQ(g.qIdx);
              store.emit('change');
            }
          },
          opt
        )
      )
    )
  );
}

function renderDetectiveGame() {
  const g = gState;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letters = g.targetUpper.split('');

  const handleGuess = async (ch) => {
    if (g.finished || g.guessed.has(ch)) return;
    g.guessed.add(ch);
    if (!g.targetUpper.includes(ch)) {
      g.wrongCount += 1;
    }
    const allFound = letters.every((l) => g.guessed.has(l));
    if (allFound || g.wrongCount >= g.maxWrong) {
      g.finished = true;
      g.won = allFound;
      if (allFound) {
        store.confetti();
        await store.awardActivityProgress({
          xpDelta: Math.round(35 * (g.diff?.xpMultiplier || 1)),
          activityType: ActivityType.GAME,
          title: `Word Detective: ${g.wordObj.english}`,
          cefrLevel: g.wordObj.cefrLevel,
          score: Math.max(40, 120 - g.wrongCount * 15),
          accuracyPct: Math.round(((g.maxWrong - g.wrongCount) / g.maxWrong) * 100),
          wordsPracticed: 1,
          durationMinutes: 2,
          arcadePlayed: true
        });
      }
    }
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    el(
      'div',
      { className: 'card stack-sm', style: { textAlign: 'center' } },
      el('div', { className: 'row-between' }, el('span', { className: 'small' }, 'Life Orbs: ' + '🟢'.repeat(Math.max(0, g.maxWrong - g.wrongCount)) + '🔴'.repeat(g.wrongCount)), createCefrBadge(g.wordObj.cefrLevel)),
      el('div', { className: 'arabic-text', style: { textAlign: 'center', fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)' } }, g.wordObj.arabic),
      el('p', { className: 'small muted', style: { margin: 0 } }, g.wordObj.exampleSentence.replace(new RegExp(g.wordObj.english, 'ig'), '_____')),
      el(
        'div',
        { className: 'vault-row', style: { marginTop: '8px', flexWrap: 'wrap' } },
        ...letters.map((l) =>
          el('div', { className: `vault-cell ${g.guessed.has(l) || g.finished ? 'hit' : ''}` }, g.guessed.has(l) || g.finished ? l : '')
        )
      )
    ),
    g.finished
      ? el(
          'div',
          { className: `card stack-sm ${g.won ? 'card-soft-mint' : 'card-soft-secondary'}`, style: { textAlign: 'center' } },
          el('div', { className: 'section-title' }, g.won ? `🎉 Solved: ${g.wordObj.english}!` : `🔍 The word was ${g.wordObj.english}`),
          el('button', { type: 'button', className: 'btn btn-primary', onClick: startWordDetective }, 'Next Mystery Word →')
        )
      : el(
          'div',
          { className: 'alpha-pad' },
          ...alphabet.map((ch) => {
            const used = g.guessed.has(ch);
            const hit = used && g.targetUpper.includes(ch);
            const miss = used && !g.targetUpper.includes(ch);
            return el(
              'button',
              {
                type: 'button',
                className: `alpha-key ${hit ? 'hit' : miss ? 'miss' : ''}`,
                disabled: used,
                onClick: () => handleGuess(ch)
              },
              ch
            );
          })
        )
  );
}

function renderCrimeMysteryGame() {
  const g = gState;
  const c = g.cases[g.idx];
  const answered = g.pickedSuspect !== null;

  return el(
    'div',
    { className: 'stack-md' },
    el('div', { className: 'row-between' }, el('span', { className: 'badge-pill card-soft-primary mono' }, `Case ${g.idx + 1}/${g.cases.length}`), createCefrBadge(c.cefrLevel)),
    el(
      'div',
      { className: 'card stack-sm' },
      el('h2', { className: 'section-title' }, `🕵️ ${c.title}`),
      el('p', { className: 'small', style: { margin: 0 } }, c.scene),
      el('div', { className: 'card card-soft-amber small' }, el('strong', {}, 'Key Clues: '), el('div', {}, `• ${c.detectiveClue || ''}`)),
      el('button', { type: 'button', className: 'btn btn-ghost', onClick: () => { g.showTip = !g.showTip; store.emit('change'); } }, g.showTip ? 'Hide Forensic Tip' : '💡 Show Forensic Vocabulary Tip'),
      g.showTip ? el('div', { className: 'card card-soft-primary small' }, c.forensicTip) : null
    ),
    el(
      'div',
      { className: 'stack-sm' },
      ...g.shuffledSuspects.map((sus) => {
        const isCulprit = sus.name === c.culpritName;
        return el(
          'button',
          {
            type: 'button',
            className: `card stack-xs ${answered ? (isCulprit ? 'card-soft-mint' : g.pickedSuspect === sus.name ? 'card-soft-secondary' : '') : ''}`,
            style: { textAlign: 'left', cursor: answered ? 'default' : 'pointer' },
            onClick: async () => {
              if (answered) return;
              g.pickedSuspect = sus.name;
              if (isCulprit) {
                g.solved += 1;
                g.score += 150;
                store.confetti();
                await store.awardActivityProgress({
                  xpDelta: 40,
                  activityType: ActivityType.GAME,
                  title: `Crime Case: ${c.title}`,
                  cefrLevel: c.cefrLevel,
                  score: 150,
                  accuracyPct: 100,
                  wordsPracticed: 6,
                  durationMinutes: 3,
                  arcadePlayed: true
                });
              }
              store.emit('change');
            }
          },
          el('div', { className: 'card-title' }, `${sus.name}${sus.role ? ` (${sus.role})` : ''}`),
          el('div', { className: 'small muted' }, `"${sus.alibi}"`),
          sus.suspiciousDetail ? el('div', { className: 'xs muted' }, `🔎 ${sus.suspiciousDetail}`) : null
        );
      })
    ),
    answered
      ? el(
          'div',
          { className: `card stack-sm ${g.pickedSuspect === c.culpritName ? 'card-soft-mint' : 'card-soft-secondary'}` },
          el('div', { className: 'card-title' }, g.pickedSuspect === c.culpritName ? '✅ Case Closed!' : `❌ The real culprit was ${c.culpritName}`),
          el('p', { className: 'small', style: { margin: 0 } }, c.explanation),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-primary btn-full',
              onClick: () => {
                if (g.idx + 1 >= g.cases.length) {
                  exitToHub();
                } else {
                  g.idx += 1;
                  g.pickedSuspect = null;
                  g.showTip = false;
                  g.shuffledSuspects = shuffleArray(g.cases[g.idx].suspects || []);
                  store.emit('change');
                }
              }
            },
            g.idx + 1 >= g.cases.length ? 'Finish Cases →' : 'Next Case File →'
          )
        )
      : null
  );
}

function renderEvidenceBoardGame() {
  const g = gState;
  const pinnedIds = new Set(store.profile?.pinnedEvidenceIds || []);
  const activeCard = g.cards.find((c) => c.id === g.selectedCardId) || g.cards[0];

  return el(
    'div',
    { className: 'stack-md' },
    el('p', { className: 'small muted', style: { margin: 0 } }, `Inspect evidence cards, pin key clues to your board (${pinnedIds.size} pinned), and identify the suspect.`),
    el(
      'div',
      { className: 'scroll-x' },
      ...g.cards.map((c) =>
        el(
          'button',
          {
            type: 'button',
            className: `chip ${activeCard.id === c.id ? 'selected' : ''}`,
            onClick: () => { g.selectedCardId = c.id; g.pickedCulprit = null; store.emit('change'); }
          },
          `${pinnedIds.has(c.id) ? '📌 ' : ''}${g.solvedIds.has(c.id) ? '✅ ' : ''}${c.title}`
        )
      )
    ),
    el(
      'div',
      { className: 'card stack-sm' },
      el(
        'div',
        { className: 'row-between' },
        el('h2', { className: 'section-title' }, activeCard.title),
        el(
          'button',
          {
            type: 'button',
            className: `btn ${pinnedIds.has(activeCard.id) ? 'btn-secondary' : 'btn-outline'}`,
            onClick: () => store.togglePinEvidence(activeCard.id)
          },
          pinnedIds.has(activeCard.id) ? '📌 Pinned' : '📍 Pin Clue'
        )
      ),
      el('div', { className: 'row-wrap' }, createCefrBadge(activeCard.cefrLevel), el('span', { className: 'badge-pill card-soft-amber' }, activeCard.categoryTag)),
      el('p', { className: 'small', style: { margin: 0 } }, activeCard.clueDetail),
      el('div', { className: 'card card-soft-primary small' }, `🔑 Vocab Hint: ${activeCard.vocabHint}`)
    ),
    el('div', { className: 'card-title' }, 'Who does this evidence implicate?'),
    el(
      'div',
      { className: 'grid-2' },
      ...(activeCard.suspectOptions || []).map((opt) => {
        const right = opt === activeCard.correctSuspect;
        const picked = g.pickedCulprit !== null;
        return el(
          'button',
          {
            type: 'button',
            className: `btn btn-full ${picked ? (right ? 'btn-mint' : g.pickedCulprit === opt ? 'btn-danger-soft' : 'btn-outline') : 'btn-outline'}`,
            disabled: picked,
            onClick: async () => {
              g.pickedCulprit = opt;
              if (right) {
                g.solvedIds.add(activeCard.id);
                store.confetti();
                await store.awardActivityProgress({
                  xpDelta: 40,
                  activityType: ActivityType.GAME,
                  title: `Evidence Solved: ${activeCard.title}`,
                  cefrLevel: activeCard.cefrLevel,
                  score: 120,
                  accuracyPct: 100,
                  wordsPracticed: 4,
                  durationMinutes: 2,
                  arcadePlayed: true
                });
              }
              store.emit('change');
            }
          },
          opt
        );
      })
    )
  );
}

function renderVaultCodebreakerGame() {
  const g = gState;
  const len = g.target.length;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const evaluateGuess = (guess) => {
    const res = Array(len).fill('miss');
    const rem = {};
    for (let i = 0; i < len; i++) {
      if (guess[i] === g.target[i]) res[i] = 'hit';
      else rem[g.target[i]] = (rem[g.target[i]] || 0) + 1;
    }
    for (let i = 0; i < len; i++) {
      if (res[i] === 'hit') continue;
      if (rem[guess[i]] > 0) {
        res[i] = 'present';
        rem[guess[i]] -= 1;
      }
    }
    return res;
  };

  const letterStates = {};
  g.guesses.forEach((guess) => {
    const evalRow = evaluateGuess(guess);
    guess.split('').forEach((ch, idx) => {
      const prev = letterStates[ch];
      if (evalRow[idx] === 'hit') letterStates[ch] = 'hit';
      else if (evalRow[idx] === 'present' && prev !== 'hit') letterStates[ch] = 'present';
      else if (!prev) letterStates[ch] = 'miss';
    });
  });

  const submitGuess = async () => {
    if (g.finished || g.currentInput.length !== len) return;
    g.guesses.push(g.currentInput);
    const won = g.currentInput === g.target;
    g.currentInput = '';
    if (won || g.guesses.length >= g.maxRows) {
      g.finished = true;
      g.won = won;
      if (won) {
        store.confetti();
        await store.awardActivityProgress({
          xpDelta: Math.round(45 * (g.diff?.xpMultiplier || 1)),
          activityType: ActivityType.GAME,
          title: `Vault Cipher: ${g.target}`,
          cefrLevel: g.cipher.cefrLevel,
          score: (g.maxRows - g.guesses.length + 1) * 100,
          accuracyPct: 100,
          wordsPracticed: 1,
          durationMinutes: 2,
          arcadePlayed: true
        });
      }
    }
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    el(
      'div',
      { className: 'card stack-xs', style: { textAlign: 'center' } },
      el('div', { className: 'row-between' }, createCefrBadge(g.cipher.cefrLevel), el('span', { className: 'xs muted' }, `${len}-Letter Cipher · ${g.maxRows} Rows (${g.diff?.short || ''})`)),
      el('div', { className: 'arabic-text', style: { textAlign: 'center', fontWeight: '800', fontSize: '1.25rem' } }, g.cipher.arabic),
      el('div', { className: 'small muted' }, `Hint: ${g.cipher.clue}`)
    ),
    el(
      'div',
      { className: 'stack-xs' },
      ...Array.from({ length: g.maxRows }, (_, rIdx) => {
        const submitted = g.guesses[rIdx];
        const evalRow = submitted ? evaluateGuess(submitted) : null;
        const activeStr = rIdx === g.guesses.length ? g.currentInput : '';
        return el(
          'div',
          { className: 'vault-row' },
          ...Array.from({ length: len }, (_, cIdx) => {
            const ch = submitted ? submitted[cIdx] : activeStr[cIdx] || '';
            const state = evalRow ? evalRow[cIdx] : ch ? 'filled' : '';
            return el('div', { className: `vault-cell ${state}` }, ch);
          })
        );
      })
    ),
    g.finished
      ? el(
          'div',
          { className: `card stack-sm ${g.won ? 'card-soft-mint' : 'card-soft-secondary'}`, style: { textAlign: 'center' } },
          el('div', { className: 'section-title' }, g.won ? `🔓 Vault Unlocked: ${g.target}!` : `🔒 Cipher was ${g.target}`),
          el('button', { type: 'button', className: 'btn btn-primary', onClick: startVaultCodebreaker }, 'Crack Next Vault →')
        )
      : el(
          'div',
          { className: 'stack-sm' },
          el(
            'div',
            { className: 'alpha-pad' },
            ...alphabet.map((ch) =>
              el(
                'button',
                {
                  type: 'button',
                  className: `alpha-key ${letterStates[ch] || ''}`,
                  onClick: () => {
                    if (g.currentInput.length < len) {
                      g.currentInput += ch;
                      store.emit('change');
                    }
                  }
                },
                ch
              )
            )
          ),
          el(
            'div',
            { className: 'row' },
            el('button', { type: 'button', className: 'btn btn-outline flex-1', onClick: () => { g.currentInput = g.currentInput.slice(0, -1); store.emit('change'); } }, '⌫ Delete'),
            el('button', { type: 'button', className: 'btn btn-primary flex-1', disabled: g.currentInput.length !== len, onClick: submitGuess }, 'Submit Guess ✓')
          )
        )
  );
}

function renderSpeedDuelGame() {
  const g = gState;
  if (g.finished) {
    return el(
      'div',
      { className: 'card card-soft-mint stack-md', style: { textAlign: 'center', padding: '24px' } },
      el('h2', { className: 'display-title' }, '⚔️ Speed Duel Finished!'),
      el('div', { className: 'display-title mono' }, `${g.score} pts`),
      el('p', { className: 'small' }, `${g.correct} correct · Best Streak: ${g.bestStreak}x`),
      el('div', { className: 'row-between' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startSpeedDuel }, 'Duel Again'))
    );
  }
  const r = g.rounds[g.idx % g.rounds.length];
  return el(
    'div',
    { className: 'stack-md' },
    el('div', { className: 'row-between' }, el('span', { id: 'duel-timer-pill', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.streak}x`)),
    el('div', { className: 'card stack-xs', style: { textAlign: 'center' } }, createCefrBadge(r.cefrLevel), el('h2', { className: 'section-title' }, r.theme)),
    el(
      'div',
      { className: 'grid-2' },
      ...(r.shuffledWords || r.words).map((w) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline',
            style: { minHeight: '62px', fontSize: '1rem', whiteSpace: 'normal', textAlign: 'center' },
            onClick: () => {
              if (w === r.oddWord) {
                g.streak += 1;
                g.bestStreak = Math.max(g.bestStreak, g.streak);
                g.correct += 1;
                g.score += 100 + g.streak * 20;
                store.toast(`Correct! ${r.reason}`);
              } else {
                g.streak = 0;
                store.toast(`Odd one was "${r.oddWord}" — ${r.reason}`, 'error');
              }
              g.idx += 1;
              store.emit('change');
            }
          },
          w
        )
      )
    )
  );
}

function renderMemoryGame() {
  const g = gState;
  if (g.finished) {
    return el(
      'div',
      { className: 'card card-soft-mint stack-md', style: { textAlign: 'center', padding: '24px' } },
      el('h2', { className: 'display-title' }, '🃏 Memory Board Cleared!'),
      el('p', { className: 'small' }, `Matched all 6 English–Arabic pairs in ${g.moves} moves!`),
      el('div', { className: 'row-between' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startMemoryFlip }, 'New Board'))
    );
  }
  return el(
    'div',
    { className: 'stack-md' },
    el('div', { className: 'row-between' }, el('span', { className: 'badge-pill card-soft-primary mono' }, `Pairs: ${g.matchedPairIds.size}/6`), el('span', { className: 'mono small' }, `Moves: ${g.moves}`)),
    el(
      'div',
      { className: 'memory-grid' },
      ...g.tiles.map((tile, idx) => {
        const isMatched = g.matchedPairIds.has(tile.pairId);
        const isFlipped = isMatched || g.flippedIndices.includes(idx);
        return el(
          'div',
          { className: 'memory-tile-scene' },
          el(
            'button',
            {
              type: 'button',
              className: `memory-tile ${isFlipped ? 'flipped' : ''}`,
              disabled: isFlipped || g.locked,
              onClick: async () => {
                if (g.locked || isFlipped) return;
                g.flippedIndices.push(idx);
                store.emit('change');
                if (g.flippedIndices.length === 2) {
                  g.moves += 1;
                  g.locked = true;
                  const [aIdx, bIdx] = g.flippedIndices;
                  const a = g.tiles[aIdx];
                  const b = g.tiles[bIdx];
                  if (a.pairId === b.pairId) {
                    g.matchedPairIds.add(a.pairId);
                    g.flippedIndices = [];
                    g.locked = false;
                    if (g.matchedPairIds.size === 6) {
                      g.finished = true;
                      store.confetti();
                      await store.awardActivityProgress({
                        xpDelta: 40,
                        activityType: ActivityType.GAME,
                        title: '3D Memory Bilingual Flip',
                        score: Math.max(100, 400 - g.moves * 15),
                        accuracyPct: Math.min(100, Math.round((6 / g.moves) * 100)),
                        wordsPracticed: 6,
                        durationMinutes: 2,
                        arcadePlayed: true
                      });
                    }
                    store.emit('change');
                  } else {
                    setTimeout(() => {
                      if (!gState) return;
                      g.flippedIndices = [];
                      g.locked = false;
                      store.emit('change');
                    }, 700);
                  }
                }
              }
            },
            el('div', { className: 'memory-face memory-back' }, '❓'),
            el('div', { className: `memory-face memory-front ${tile.kind === 'ar' ? 'ar arabic-text' : ''} ${isMatched ? 'matched' : ''}` }, tile.text)
          )
        );
      })
    )
  );
}

function renderSpinWheelGame() {
  const g = gState;
  const wheelSlices = WHEEL_SLICES.map((sl) => ({
    ...sl,
    label: sl.label || sl.shortLabel || sl.title,
    xpReward: Number(sl.xpReward ?? sl.bonusXp ?? 25)
  }));
  const wheelCanvas = createSpinWheelCanvas({ slices: wheelSlices, rotationDeg: g.rotation, size: 276 });

  const spin = () => {
    if (g.spinning) return;
    g.spinning = true;
    const startRot = g.rotation;
    const delta = 1080 + Math.random() * 720;
    const startTime = performance.now();
    const dur = 2600;

    const anim = async (now) => {
      const t = Math.min(1, (now - startTime) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      g.rotation = startRot + delta * eased;
      wheelCanvas.updateRotation(g.rotation);
      if (t < 1) {
        requestAnimationFrame(anim);
      } else {
        g.spinning = false;
        g.spinsToday += 1;
        const norm = ((360 - (g.rotation % 360)) + 360) % 360;
        const sliceDeg = 360 / wheelSlices.length;
        const sliceIdx = Math.floor(norm / sliceDeg) % wheelSlices.length;
        const slice = wheelSlices[sliceIdx];
        g.lastSlice = slice;
        if (slice.xpReward > 0) {
          store.confetti();
          await store.awardActivityProgress({
            xpDelta: slice.xpReward,
            activityType: ActivityType.GAME,
            title: `Spin Wheel: ${slice.title}`,
            score: slice.xpReward * 4,
            accuracyPct: 100,
            wordsPracticed: 1,
            durationMinutes: 1,
            arcadePlayed: true
          });
        }
        store.emit('change');
      }
    };
    requestAnimationFrame(anim);
  };

  return el(
    'div',
    { className: 'card stack-md', style: { alignItems: 'center', textAlign: 'center' } },
    el('h2', { className: 'section-title' }, '🎡 Daily Spin Wheel'),
    wheelCanvas,
    el('button', { type: 'button', className: 'btn btn-primary btn-full', disabled: g.spinning, onClick: spin }, g.spinning ? 'Spinning...' : '🎡 Spin the Wheel!'),
    g.lastSlice
      ? el(
          'div',
          { className: 'card card-soft-amber btn-full stack-xs' },
          el('strong', {}, `Landed on: ${g.lastSlice.title} (${g.lastSlice.label})`),
          el('div', { className: 'small' }, g.lastSlice.challengePrompt || `Earned +${g.lastSlice.xpReward} XP!`)
        )
      : null
  );
}

// ---------------- ARABIC GAMES RENDERERS ----------------

function renderArabicBlitzGame() {
  const g = gState;
  if (g.finished) {
    return el(
      'div',
      { className: 'card card-soft-mint stack-md arabic-text', dir: 'rtl', style: { textAlign: 'center', padding: '26px' } },
      el('h2', { className: 'display-title' }, '⚡ انتهى سباق المعاني العربي!'),
      el('div', { className: 'display-title mono', dir: 'ltr' }, `${g.score} pts`),
      el('p', { className: 'small' }, `${g.correct}/${g.total} إجابات صحيحة · أعلى سلسلة: ${g.bestCombo}x`),
      el('div', { className: 'row-between', dir: 'ltr' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startArabicBlitz }, 'العب مجدداً'))
    );
  }
  const { target, askAntonym, answer, opts, hiddenIndices } = g.cur;
  return el(
    'div',
    { className: 'stack-md' },
    el('div', { className: 'row-between' }, el('span', { id: 'ar-blitz-timer', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.combo}x`)),
    el(
      'div',
      { className: 'card stack-sm arabic-text', dir: 'rtl', style: { textAlign: 'center' } },
      el('div', { className: 'row-between', dir: 'ltr' }, createCefrBadge(target.cefrLevel), el('span', { className: 'badge-pill card-soft-primary' }, askAntonym ? 'اختر الضد (العكس)' : 'اختر المرادف (المعنى)')),
      el('h2', { className: 'display-title', style: { fontSize: '2rem' } }, target.word),
      el('p', { className: 'small muted', style: { margin: 0 } }, `${target.clue} (${target.englishHint})`)
    ),
    el(
      'div',
      { className: 'row-wrap' },
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-soft flex-1',
          disabled: g.used5050,
          onClick: () => {
            g.used5050 = true;
            const wrong = opts.map((o, idx) => (o !== answer ? idx : -1)).filter((i) => i >= 0);
            shuffleArray(wrong).slice(0, 2).forEach((i) => hiddenIndices.add(i));
            store.emit('change');
          }
        },
        g.used5050 ? '50/50 Used' : '✂️ حذف إجابتين 50/50'
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-soft flex-1',
          disabled: g.usedFreeze,
          onClick: () => {
            g.usedFreeze = true;
            g.deadlineMs += 10000;
            g.timeLeft += 10;
            store.toast('+10 ثوانٍ إضافية!');
            store.emit('change');
          }
        },
        g.usedFreeze ? '+10s Used' : '❄️ تجميد +10ث'
      )
    ),
    el(
      'div',
      { className: 'grid-2', dir: 'rtl' },
      ...opts.map((opt, idx) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline arabic-text',
            style: { minHeight: '62px', justifyContent: 'center', fontSize: '1.05rem', visibility: hiddenIndices.has(idx) ? 'hidden' : 'visible' },
            onClick: () => {
              g.total += 1;
              if (opt === answer) {
                g.combo += 1;
                g.bestCombo = Math.max(g.bestCombo, g.combo);
                g.correct += 1;
                g.score += 50 + Math.min(g.combo, 5) * 20;
              } else {
                g.combo = 0;
                store.toast(`الإجابة الصحيحة: ${answer}`, 'error');
              }
              g.qIdx += 1;
              g.cur = g.makeQ(g.qIdx);
              store.emit('change');
            }
          },
          opt
        )
      )
    )
  );
}

function renderArabicDetectiveGame() {
  const g = gState;
  const letters = g.targetWord.split('');

  const handleGuess = async (ch) => {
    if (g.finished || g.guessed.has(ch)) return;
    g.guessed.add(ch);
    if (!g.targetWord.includes(ch)) {
      g.wrongCount += 1;
    }
    const allFound = letters.every((l) => g.guessed.has(l));
    if (allFound || g.wrongCount >= g.maxWrong) {
      g.finished = true;
      g.won = allFound;
      if (allFound) {
        store.confetti();
        await store.awardActivityProgress({
          xpDelta: Math.round(35 * (g.diff?.xpMultiplier || 1)),
          activityType: ActivityType.GAME,
          title: `كاشف الكلمة العربية: ${g.targetWord}`,
          cefrLevel: g.wordObj.cefrLevel,
          score: Math.max(40, 120 - g.wrongCount * 15),
          accuracyPct: Math.round(((g.maxWrong - g.wrongCount) / g.maxWrong) * 100),
          wordsPracticed: 1,
          durationMinutes: 2,
          arcadePlayed: true
        });
      }
    }
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    el(
      'div',
      { className: 'card stack-sm arabic-text', dir: 'rtl', style: { textAlign: 'center' } },
      el('div', { className: 'row-between', dir: 'ltr' }, el('span', { className: 'small' }, 'المحاولات: ' + '🟢'.repeat(Math.max(0, g.maxWrong - g.wrongCount)) + '🔴'.repeat(g.wrongCount)), createCefrBadge(g.wordObj.cefrLevel)),
      el('div', { style: { fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', textAlign: 'center' } }, g.wordObj.clue),
      el('p', { className: 'small muted', style: { margin: 0, textAlign: 'center' } }, `مرادف: ${g.wordObj.synonym} · English: ${g.wordObj.englishHint}`),
      el(
        'div',
        { className: 'vault-row', dir: 'rtl', style: { marginTop: '8px', flexWrap: 'wrap' } },
        ...letters.map((l) =>
          el('div', { className: `vault-cell arabic-text ${g.guessed.has(l) || g.finished ? 'hit' : ''}` }, g.guessed.has(l) || g.finished ? l : '')
        )
      )
    ),
    g.finished
      ? el(
          'div',
          { className: `card stack-sm arabic-text ${g.won ? 'card-soft-mint' : 'card-soft-secondary'}`, dir: 'rtl', style: { textAlign: 'center' } },
          el('div', { className: 'section-title' }, g.won ? `🎉 أحسنت! الكلمة هي: ${g.targetWord}` : `🔍 الكلمة المطلوبة: ${g.targetWord}`),
          el('button', { type: 'button', className: 'btn btn-primary', onClick: startArabicDetective }, 'الكلمة التالية →')
        )
      : el(
          'div',
          { className: 'alpha-pad', dir: 'rtl' },
          ...ARABIC_ALPHABET.map((ch) => {
            const used = g.guessed.has(ch);
            const hit = used && g.targetWord.includes(ch);
            const miss = used && !g.targetWord.includes(ch);
            return el(
              'button',
              {
                type: 'button',
                className: `alpha-key arabic-text ${hit ? 'hit' : miss ? 'miss' : ''}`,
                disabled: used,
                onClick: () => handleGuess(ch)
              },
              ch
            );
          })
        )
  );
}

function renderArabicVaultGame() {
  const g = gState;
  const len = g.target.length;

  const evaluateGuess = (guess) => {
    const res = Array(len).fill('miss');
    const rem = {};
    for (let i = 0; i < len; i++) {
      if (guess[i] === g.target[i]) res[i] = 'hit';
      else rem[g.target[i]] = (rem[g.target[i]] || 0) + 1;
    }
    for (let i = 0; i < len; i++) {
      if (res[i] === 'hit') continue;
      if (rem[guess[i]] > 0) {
        res[i] = 'present';
        rem[guess[i]] -= 1;
      }
    }
    return res;
  };

  const letterStates = {};
  g.guesses.forEach((guess) => {
    const evalRow = evaluateGuess(guess);
    guess.split('').forEach((ch, idx) => {
      const prev = letterStates[ch];
      if (evalRow[idx] === 'hit') letterStates[ch] = 'hit';
      else if (evalRow[idx] === 'present' && prev !== 'hit') letterStates[ch] = 'present';
      else if (!prev) letterStates[ch] = 'miss';
    });
  });

  const submitGuess = async () => {
    if (g.finished || g.currentInput.length !== len) return;
    g.guesses.push(g.currentInput);
    const won = g.currentInput === g.target;
    g.currentInput = '';
    if (won || g.guesses.length >= g.maxRows) {
      g.finished = true;
      g.won = won;
      if (won) {
        store.confetti();
        await store.awardActivityProgress({
          xpDelta: Math.round(45 * (g.diff?.xpMultiplier || 1)),
          activityType: ActivityType.GAME,
          title: `خزنة الحروف العربية: ${g.target}`,
          cefrLevel: g.cipher.cefrLevel,
          score: (g.maxRows - g.guesses.length + 1) * 100,
          accuracyPct: 100,
          wordsPracticed: 1,
          durationMinutes: 2,
          arcadePlayed: true
        });
      }
    }
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    el(
      'div',
      { className: 'card stack-xs arabic-text', dir: 'rtl', style: { textAlign: 'center' } },
      el('div', { className: 'row-between', dir: 'ltr' }, createCefrBadge(g.cipher.cefrLevel), el('span', { className: 'xs muted' }, `كلمة من ${len} حروف · ${g.maxRows} محاولات`)),
      el('div', { style: { textAlign: 'center', fontWeight: '800', fontSize: '1.15rem' } }, g.cipher.arabicClue),
      el('div', { className: 'small muted', style: { textAlign: 'center' } }, `English Hint: ${g.cipher.englishHint}`)
    ),
    el(
      'div',
      { className: 'stack-xs', dir: 'rtl' },
      ...Array.from({ length: g.maxRows }, (_, rIdx) => {
        const submitted = g.guesses[rIdx];
        const evalRow = submitted ? evaluateGuess(submitted) : null;
        const activeStr = rIdx === g.guesses.length ? g.currentInput : '';
        return el(
          'div',
          { className: 'vault-row', dir: 'rtl' },
          ...Array.from({ length: len }, (_, cIdx) => {
            const ch = submitted ? submitted[cIdx] : activeStr[cIdx] || '';
            const state = evalRow ? evalRow[cIdx] : ch ? 'filled' : '';
            return el('div', { className: `vault-cell arabic-text ${state}` }, ch);
          })
        );
      })
    ),
    g.finished
      ? el(
          'div',
          { className: `card stack-sm arabic-text ${g.won ? 'card-soft-mint' : 'card-soft-secondary'}`, dir: 'rtl', style: { textAlign: 'center' } },
          el('div', { className: 'section-title' }, g.won ? `🔓 فتحت الخزنة! الكلمة: ${g.target}` : `🔒 الكلمة الصحيحة هي: ${g.target}`),
          el('button', { type: 'button', className: 'btn btn-primary', onClick: startArabicVault }, 'كلمة جديدة →')
        )
      : el(
          'div',
          { className: 'stack-sm' },
          el(
            'div',
            { className: 'alpha-pad', dir: 'rtl' },
            ...ARABIC_ALPHABET.map((ch) =>
              el(
                'button',
                {
                  type: 'button',
                  className: `alpha-key arabic-text ${letterStates[ch] || ''}`,
                  onClick: () => {
                    if (g.currentInput.length < len) {
                      g.currentInput += ch;
                      store.emit('change');
                    }
                  }
                },
                ch
              )
            )
          ),
          el(
            'div',
            { className: 'row' },
            el('button', { type: 'button', className: 'btn btn-outline flex-1', onClick: () => { g.currentInput = g.currentInput.slice(0, -1); store.emit('change'); } }, '⌫ مسح'),
            el('button', { type: 'button', className: 'btn btn-primary flex-1', disabled: g.currentInput.length !== len, onClick: submitGuess }, 'تحقق ✓')
          )
        )
  );
}

function renderArabicDuelGame() {
  const g = gState;
  if (g.finished) {
    return el(
      'div',
      { className: 'card card-soft-mint stack-md arabic-text', dir: 'rtl', style: { textAlign: 'center', padding: '24px' } },
      el('h2', { className: 'display-title' }, '⚔️ انتهى تحدي النحو والإملاء!'),
      el('div', { className: 'display-title mono', dir: 'ltr' }, `${g.score} pts`),
      el('p', { className: 'small' }, `إجابات صحيحة: ${g.correct} · أعلى سلسلة: ${g.bestStreak}x`),
      el('div', { className: 'row-between', dir: 'ltr' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startArabicDuel }, 'تحدٍ جديد'))
    );
  }
  const r = g.rounds[g.idx % g.rounds.length];
  return el(
    'div',
    { className: 'stack-md' },
    el('div', { className: 'row-between' }, el('span', { id: 'ar-duel-timer', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.streak}x`)),
    el(
      'div',
      { className: 'card stack-xs arabic-text', dir: 'rtl', style: { textAlign: 'center' } },
      el('div', { className: 'row-between', dir: 'ltr' }, createCefrBadge(r.level || 'B1'), el('span', { className: 'xs muted' }, 'تحدي النحو والإملاء السريع')),
      el('h2', { className: 'section-title' }, r.scenarioPrompt)
    ),
    el(
      'div',
      { className: 'grid-2', dir: 'rtl' },
      ...r.shuffledOptions.map((opt) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline arabic-text',
            style: { minHeight: '64px', fontSize: '1rem', whiteSpace: 'normal', justifyContent: 'center' },
            onClick: () => {
              if (opt.isCorrect) {
                g.streak += 1;
                g.bestStreak = Math.max(g.bestStreak, g.streak);
                g.correct += 1;
                g.score += 100 + g.streak * 20;
                store.toast(`أحسنت! ${r.explanation}`);
              } else {
                g.streak = 0;
                store.toast(r.explanation, 'error');
              }
              g.idx += 1;
              store.emit('change');
            }
          },
          opt.text
        )
      )
    )
  );
}

// ---------------- HUB VIEW ----------------

export function renderArcadeView({ navigate }) {
  if (activeMode) {
    const titles = {
      DASH: '⚡ Word Dash Blitz',
      DETECTIVE: '🔍 Word Detective',
      CRIME: '🕵️ Crime Mystery',
      EVIDENCE: '📌 Evidence Board',
      VAULT: '🔐 Vault Codebreaker',
      DUEL: '⚔️ Mystery Speed Duel',
      MEMORY: '🃏 3D Memory Flip',
      WHEEL: '🎡 Daily Spin Wheel',
      AR_BLITZ: '⚡ سباق المعاني السريع',
      AR_DETECTIVE: '🔍 كاشف الكلمة العربية',
      AR_VAULT: '🔐 خزنة الحروف العربية',
      AR_DUEL: '⚔️ تحدي النحو والإملاء'
    };
    let body = null;
    if (activeMode === 'DASH') body = renderDashGame();
    else if (activeMode === 'DETECTIVE') body = renderDetectiveGame();
    else if (activeMode === 'CRIME') body = renderCrimeMysteryGame();
    else if (activeMode === 'EVIDENCE') body = renderEvidenceBoardGame();
    else if (activeMode === 'VAULT') body = renderVaultCodebreakerGame();
    else if (activeMode === 'DUEL') body = renderSpeedDuelGame();
    else if (activeMode === 'MEMORY') body = renderMemoryGame();
    else if (activeMode === 'WHEEL') body = renderSpinWheelGame();
    else if (activeMode === 'AR_BLITZ') body = renderArabicBlitzGame();
    else if (activeMode === 'AR_DETECTIVE') body = renderArabicDetectiveGame();
    else if (activeMode === 'AR_VAULT') body = renderArabicVaultGame();
    else if (activeMode === 'AR_DUEL') body = renderArabicDuelGame();

    return el(
      'div',
      { className: 'stack-lg' },
      el(
        'div',
        { className: 'row-between' },
        el('h1', { className: 'display-title', style: { fontSize: '1.45rem' } }, titles[activeMode]),
        el(
          'div',
          { className: 'row' },
          el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Squad Chat', onClick: openInGameSquadChatModal }, '💬'),
          el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, '← Arcade')
        )
      ),
      body
    );
  }

  const diff = getDiffConfig();
  const activeDiffId = store.selectedDifficulty || 'MEDIUM';

  const games = [
    { id: 'DASH', lang: 'EN', cat: 'BLITZ', icon: '⚡', title: 'Word Dash Blitz', desc: `${diff.dashDurationSec}s bilingual rapid fire with 50/50 & Freeze`, fn: startWordDash, bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)' },
    { id: 'DETECTIVE', lang: 'EN', cat: 'DETECTIVE', icon: '🔍', title: 'Word Detective', desc: `Guess hidden words (${diff.detectiveLives} orbs) with Arabic clues`, fn: startWordDetective, bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)' },
    { id: 'CRIME', lang: 'EN', cat: 'DETECTIVE', icon: '🕵️', title: 'Crime Mystery', desc: '8 forensic whodunits with suspect alibis', fn: startCrimeMystery, bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)' },
    { id: 'EVIDENCE', lang: 'EN', cat: 'DETECTIVE', icon: '📌', title: 'Evidence Board', desc: 'Pin clues & crack culprit connections', fn: startEvidenceBoard, bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
    { id: 'VAULT', lang: 'EN', cat: 'MEMORY', icon: '🔐', title: 'Vault Codebreaker', desc: `${diff.vaultRows}-row Wordle cipher with Arabic clue`, fn: startVaultCodebreaker, bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
    { id: 'DUEL', lang: 'EN', cat: 'BLITZ', icon: '⚔️', title: 'Mystery Speed Duel', desc: `${diff.duelDurationSec}s odd-one-out detective duel`, fn: startSpeedDuel, bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)' },
    { id: 'MEMORY', lang: 'EN', cat: 'MEMORY', icon: '🃏', title: '3D Memory Flip', desc: '3×4 English–Arabic matching board', fn: startMemoryFlip, bg: 'var(--blue-soft)', ink: 'var(--on-blue-soft)' },
    { id: 'WHEEL', lang: 'EN', cat: 'BLITZ', icon: '🎡', title: 'Daily Spin Wheel', desc: 'Spin for XP & surprise challenges', fn: startSpinWheel, bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
    { id: 'AR_BLITZ', lang: 'AR', cat: 'BLITZ', icon: '⚡', title: 'سباق المعاني السريع (Arabic Blitz)', desc: `${diff.dashDurationSec}ث للمرادفات والأضداد العربية`, fn: startArabicBlitz, bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)' },
    { id: 'AR_DETECTIVE', lang: 'AR', cat: 'DETECTIVE', icon: '🔍', title: 'كاشف الكلمة العربية', desc: `خمّن الكلمة العربية (${diff.detectiveLives} محاولات) بلوحة عربية`, fn: startArabicDetective, bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)' },
    { id: 'AR_VAULT', lang: 'AR', cat: 'MEMORY', icon: '🔐', title: 'خزنة الحروف العربية', desc: `تحدي تخمين الكلمة العربية (${diff.vaultRows} صفوف)`, fn: startArabicVault, bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
    { id: 'AR_DUEL', lang: 'AR', cat: 'BLITZ', icon: '⚔️', title: 'تحدي النحو والإملاء', desc: `${diff.duelDurationSec}ث في قواعد العربية والإملاء`, fn: startArabicDuel, bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)' }
  ];

  const langTabs = [
    { id: 'ALL', label: `🌐 All (${games.length})` },
    { id: 'EN', label: '🇬🇧 English (8)' },
    { id: 'AR', label: '🇸🇦 ألعاب عربية Arabic (4)' }
  ];

  const cats = [
    { id: 'ALL', label: 'All Types' },
    { id: 'BLITZ', label: 'Fast Blitz' },
    { id: 'DETECTIVE', label: 'Detective' },
    { id: 'MEMORY', label: 'Brain & Memory' }
  ];

  const visible = games.filter((g) => (hubLang === 'ALL' || g.lang === hubLang) && (hubCategory === 'ALL' || g.cat === hubCategory));

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '🎮 Interactive Arcade'),
      el('div', { className: 'row' }, el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Squad Chat', onClick: openInGameSquadChatModal }, '💬'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home'))
    ),
    el(
      'div',
      { className: 'card stack-sm' },
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap' } },
        el(
          'div',
          { className: 'row-wrap' },
          ...langTabs.map((lt) =>
            el('button', { type: 'button', className: `chip ${hubLang === lt.id ? 'selected' : ''}`, onClick: () => { hubLang = lt.id; store.emit('change'); } }, lt.label)
          )
        ),
        el(
          'div',
          { className: 'row-wrap' },
          ...DIFFICULTY_LEVELS.map((d) =>
            el('button', { type: 'button', className: `chip ${activeDiffId === d ? 'selected' : ''}`, onClick: () => store.setDifficulty(d) }, DIFFICULTY_CONFIG[d].label)
          )
        )
      ),
      el('div', { className: 'xs muted' }, `Active Difficulty: ${diff.label} · ${diff.dashDurationSec}s Blitz · ${diff.detectiveLives} Lives · ${diff.vaultRows} Cipher Rows · ${diff.xpMultiplier}x XP`)
    ),
    el(
      'div',
      { className: 'scroll-x' },
      ...cats.map((c) =>
        el('button', { type: 'button', className: `chip ${hubCategory === c.id ? 'selected' : ''}`, onClick: () => { hubCategory = c.id; store.emit('change'); } }, c.label)
      )
    ),
    el(
      'div',
      { className: 'grid-modes' },
      ...visible.map((g) =>
        el(
          'button',
          {
            type: 'button',
            className: `tactile-card ${g.lang === 'AR' ? 'arabic-text' : ''}`,
            dir: g.lang === 'AR' ? 'rtl' : 'ltr',
            style: { background: g.bg, color: g.ink },
            onClick: g.fn
          },
          el(
            'div',
            { className: 'row-between', dir: 'ltr' },
            el('span', { style: { fontSize: '2rem' } }, g.icon),
            el('span', { className: 'badge-pill', style: { background: 'rgba(255,255,255,0.65)', color: '#171625' } }, g.lang === 'AR' ? '🇸🇦 عربي' : '🇬🇧 EN')
          ),
          el('div', { className: 'stack-xs' }, el('div', { className: 'card-title' }, g.title), el('div', { className: 'xs', style: { opacity: 0.85 } }, g.desc))
        )
      )
    )
  );
}
