// Interactive Arcade Hub — 8 English Games + 4 Arabic Games (ألعاب عربية)
// Features: Solo vs Team Play (2–4 Squads), 5s Team Buzzer Integration,
// Web Audio Haptics, Physical Keyboard Controls, and Interactive Lifelines.

import { ActivityType, DIFFICULTY_CONFIG, DIFFICULTY_LEVELS, avatarColorForTag, el, shuffleArray } from '../models.js';
import {
  ARABIC_ARCADE_WORDS,
  ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS,
  ARABIC_VAULT_WORDS,
  CRIME_MYSTERY_CASES,
  CURATED_EVIDENCE_CARDS,
  CURATED_HEIST_CIPHERS,
  CURATED_ODD_CLUE_ROUNDS,
  WHEEL_SLICES
} from '../data/curated-content.js';
import { WEEKLY_CURRICULUM } from '../data/weekly-curriculum.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { audioService } from '../services/audio-service.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openInGameSquadChatModal } from '../components/ui-shared.js';
import { createAnimatedVaultDialCanvas, createAnimatedWordStageCanvas, createSpinWheelCanvas } from '../components/canvas-3d.js';

const ARABIC_ALPHABET = [
  'ا', 'أ', 'إ', 'ب', 'ت', 'ة', 'ث', 'ج', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و',
  'ي', 'ى', 'ئ', 'ؤ'
];

let activeMode = null; // 10 EN + 6 AR = 16 games
let hubLang = 'ALL'; // 'ALL' | 'EN' | 'AR'
let hubCategory = 'ALL';
let playFormat = 'SOLO'; // 'SOLO' | 'TEAM'
let squadCount = 2; // 2 | 3 | 4
let teamSession = null; // { teams, activeIdx, scores, committed, gameTitle }
let activeArcadeRoomId = null;
let activeArcadeRafId = null;
let gState = null;
let arcadeTimer = null;

export function stopArcadeTimers() {
  if (arcadeTimer) {
    clearInterval(arcadeTimer);
    arcadeTimer = null;
  }
  if (activeArcadeRafId) {
    cancelAnimationFrame(activeArcadeRafId);
    activeArcadeRafId = null;
  }
  if (activeArcadeRoomId) {
    const closingId = activeArcadeRoomId;
    activeArcadeRoomId = null;
    store.clearActiveArcadeRoom(closingId);
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

function syncTeamRoomSnapshot() {
  if (playFormat !== 'TEAM' || !teamSession || !activeArcadeRoomId) return;
  const teamMeta = {};
  teamSession.teams.forEach((t) => {
    teamMeta[t.id] = { name: t.name, accentColor: t.accentColor, motto: t.motto };
  });
  const active = getActiveSquad();
  store.syncActiveArcadeRoom({
    roomId: activeArcadeRoomId,
    gameMode: activeMode || 'ARCADE',
    gameTitle: teamSession.gameTitle || 'Arcade Match',
    teamScores: { ...teamSession.scores },
    teamMeta,
    activeTeamName: active?.name || ''
  });
}

function initTeamSession(gameTitle = 'Arcade Team Match') {
  if (playFormat !== 'TEAM') {
    teamSession = null;
    activeArcadeRoomId = null;
    return;
  }
  const allSquads = store.getDefaultBattleTeams();
  const teams = allSquads.slice(0, Math.min(Math.max(2, squadCount), allSquads.length));
  const scores = {};
  teams.forEach((t) => {
    scores[t.id] = 0;
  });
  teamSession = {
    teams,
    activeIdx: 0,
    scores,
    committed: false,
    gameTitle
  };
  activeArcadeRoomId = `arc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  syncTeamRoomSnapshot();
}

function getActiveSquad() {
  if (playFormat !== 'TEAM' || !teamSession?.teams?.length) return null;
  return teamSession.teams[teamSession.activeIdx % teamSession.teams.length];
}

function rotateSquadTurn(silent = false) {
  if (playFormat !== 'TEAM' || !teamSession?.teams?.length) return;
  teamSession.activeIdx = (teamSession.activeIdx + 1) % teamSession.teams.length;
  if (!silent) audioService.playTurnSwap();
  syncTeamRoomSnapshot();
}

function addSquadPoints(points) {
  const squad = getActiveSquad();
  if (!squad || !teamSession) return;
  const delta = Math.max(0, Math.round(Number(points || 0)));
  teamSession.scores[squad.id] = (teamSession.scores[squad.id] || 0) + delta;
  syncTeamRoomSnapshot();
}

function commitTeamSessionContributions(gameTitle, cefrLevel = 'B1') {
  if (playFormat !== 'TEAM' || !teamSession || teamSession.committed) return;
  teamSession.committed = true;
  teamSession.teams.forEach((t) => {
    const pts = Math.round(Number(teamSession.scores[t.id] || 0));
    if (pts > 0) {
      store.awardTeamContribution(
        {
          teamId: t.id,
          teamName: t.name,
          playerName: store.currentUserName,
          avatarColor: t.accentColor || 'INDIGO',
          title: gameTitle,
          gameMode: 'ARCADE_TEAM',
          points: pts,
          accuracyPct: 100,
          cefrLevel
        },
        false
      );
    }
  });
  store.emit('team-leaderboard');
  store.emit('change');
}

function getCurrentGamePromptForBuzzer() {
  const g = gState;
  if (!g) return 'Fastest team to buzz in answers!';
  if (activeMode === 'DASH' && g.cur?.target) {
    return `Translate to Arabic: "${g.cur.target.english}"`;
  }
  if (activeMode === 'METEOR' && g.waves?.[g.waveIdx]) {
    return `Blast Meteor: Translate "${g.waves[g.waveIdx].target.english}"`;
  }
  if (activeMode === 'ROCKET' && g.questions?.[g.qIdx % g.questions.length]) {
    return `Rocket Boost: Translate "${g.questions[g.qIdx % g.questions.length].target.english}"`;
  }
  if ((activeMode === 'AR_BLITZ' || activeMode === 'AR_METEOR') && (g.cur?.target || g.waves?.[g.waveIdx])) {
    const item = g.cur || g.waves[g.waveIdx];
    return `${item.askAntonym ? 'ما ضد كلمة' : 'ما مرادف كلمة'} "${item.target.word}"؟ (${item.target.clue})`;
  }
  if (activeMode === 'AR_MAZE' && g.currentQ) {
    return g.currentQ.scenarioPrompt;
  }
  if (activeMode === 'DETECTIVE' && g.wordObj) {
    return `Clue: ${g.wordObj.arabic} — ${g.wordObj.exampleSentence.replace(new RegExp(g.wordObj.english, 'ig'), '_____')}`;
  }
  if (activeMode === 'AR_DETECTIVE' && g.wordObj) {
    return `خمّن الكلمة العربية: ${g.wordObj.clue}`;
  }
  if (activeMode === 'CRIME' && g.cases?.[g.idx]) {
    return `Case: ${g.cases[g.idx].title} — ${g.cases[g.idx].detectiveClue || g.cases[g.idx].scene}`;
  }
  if (activeMode === 'EVIDENCE' && g.cards) {
    const card = g.cards.find((c) => c.id === g.selectedCardId) || g.cards[0];
    return `Evidence: ${card.title} — ${card.clueDetail}`;
  }
  if ((activeMode === 'VAULT' || activeMode === 'AR_VAULT') && g.cipher) {
    return g.cipher.arabicClue || g.cipher.clue || 'Crack the secret cipher!';
  }
  if (activeMode === 'DUEL' && g.rounds) {
    const r = g.rounds[g.idx % g.rounds.length];
    return `Odd One Out: ${r.theme}`;
  }
  if (activeMode === 'AR_DUEL' && g.rounds) {
    const r = g.rounds[g.idx % g.rounds.length];
    return r.scenarioPrompt;
  }
  if (activeMode === 'WHEEL' && g.bonusQ) {
    return g.bonusQ.prompt;
  }
  return 'Fastest squad to buzz in wins +100 team points!';
}

function openArcadeTeamBuzzer(gameTitle = 'Arcade Team Buzzer') {
  const squads = teamSession?.teams?.length ? teamSession.teams : store.getDefaultBattleTeams().slice(0, squadCount);
  const initialScores = teamSession ? { ...teamSession.scores } : undefined;
  store.openTeamBuzzer({
    contextKey: `arcade:${activeMode || 'hub'}`,
    title: `🚨 ${gameTitle}`,
    prompt: getCurrentGamePromptForBuzzer(),
    teams: squads,
    sessionScores: initialScores,
    onResolve: ({ buzz, correct, points }) => {
      if (playFormat === 'TEAM' && teamSession && correct && buzz?.teamId) {
        teamSession.scores[buzz.teamId] = (teamSession.scores[buzz.teamId] || 0) + points;
        syncTeamRoomSnapshot();
      }
    }
  });
}

function exitToHub() {
  stopArcadeTimers();
  activeMode = null;
  gState = null;
  teamSession = null;
  store.emit('change');
}

// ---------------- TEAM PLAY HUD COMPONENT ----------------

function renderTeamPlayHud(gameTitle) {
  if (playFormat !== 'TEAM' || !teamSession) return null;
  const activeSquad = getActiveSquad();
  const totalTeamPts = teamSession.teams.reduce((sum, t) => sum + (teamSession.scores[t.id] || 0), 0);

  return el(
    'div',
    { className: 'team-hud stack-sm' },
    el(
      'div',
      { className: 'row-between', style: { flexWrap: 'wrap', gap: '8px' } },
      el(
        'div',
        { className: 'row', style: { gap: '8px' } },
        el('span', { className: 'badge-pill card-soft-primary' }, '🛡️ TEAM PLAY'),
        activeSquad
          ? el(
              'span',
              { className: 'small', style: { fontWeight: '800' } },
              `Turn: ${activeSquad.name}`
            )
          : null
      ),
      el(
        'div',
        { className: 'row', style: { gap: '8px' } },
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline small',
            onClick: () => {
              rotateSquadTurn();
              store.emit('change');
            }
          },
          '🔄 Next Turn'
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-secondary small',
            onClick: () => openArcadeTeamBuzzer(gameTitle)
          },
          '🚨 Team Buzzer (5s)'
        )
      )
    ),
    // Tug-of-war / Proportional Score Meter
    totalTeamPts > 0
      ? el(
          'div',
          { className: 'tug-bar-track' },
          ...teamSession.teams.map((t) => {
            const pts = teamSession.scores[t.id] || 0;
            const pct = Math.max(8, Math.round((pts / totalTeamPts) * 100));
            return el('div', {
              style: {
                width: `${pct}%`,
                background: avatarColorForTag(t.accentColor),
                transition: 'width 0.25s ease'
              },
              title: `${t.name}: ${pts} pts`
            });
          })
        )
      : null,
    el(
      'div',
      { className: 'team-hud-pills' },
      ...teamSession.teams.map((t, idx) => {
        const isCurrent = idx === teamSession.activeIdx;
        const pts = teamSession.scores[t.id] || 0;
        return el(
          'button',
          {
            type: 'button',
            className: `team-hud-pill ${isCurrent ? 'active' : ''}`,
            onClick: () => {
              teamSession.activeIdx = idx;
              audioService.playTurnSwap();
              store.emit('change');
            }
          },
          el(
            'div',
            { className: 'row', style: { gap: '6px', minWidth: 0 } },
            el('span', {
              style: {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: avatarColorForTag(t.accentColor),
                flexShrink: 0
              }
            }),
            el('span', { className: 'xs', style: { fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, t.name)
          ),
          el('span', { className: 'mono xs', style: { fontWeight: '800' } }, `${pts}`)
        );
      })
    )
  );
}

function renderTeamResultsCard() {
  if (playFormat !== 'TEAM' || !teamSession) return null;
  const sorted = [...teamSession.teams].sort((a, b) => (teamSession.scores[b.id] || 0) - (teamSession.scores[a.id] || 0));
  const medals = ['🥇', '🥈', '🥉', '🏅'];
  return el(
    'div',
    { className: 'card card-soft-amber stack-sm', style: { textAlign: 'left' } },
    el('div', { className: 'card-title' }, '🏆 Squad Match Standings'),
    ...sorted.map((t, i) =>
      el(
        'div',
        { className: 'row-between', style: { padding: '6px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.55)' } },
        el('span', { className: 'small', style: { fontWeight: '800' } }, `${medals[i] || '🏅'} ${t.name}`),
        el('span', { className: 'mono small', style: { fontWeight: '800' } }, `${teamSession.scores[t.id] || 0} pts`)
      )
    )
  );
}

// ---------------- ENGLISH ARCADE GAMES ----------------

function startWordDash() {
  stopArcadeTimers();
  initTeamSession();
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
  audioService.playTransition();
  store.emit('change');
}

async function finishDash() {
  stopArcadeTimers();
  if (!gState || gState.finished) return;
  gState.finished = true;
  const acc = gState.total ? Math.round((gState.correct / gState.total) * 100) : 100;
  const xp = Math.round(Math.max(15, Math.round(gState.score / 15)) * (gState.diff?.xpMultiplier || 1));
  store.confetti();
  audioService.playCorrect();
  commitTeamSessionContributions('Word Dash Blitz', 'B1');
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
    publishLeaderboardMode: 'ARCADE',
    skipAutoTeamContrib: playFormat === 'TEAM'
  });
  store.emit('change');
}

function startWordDetective() {
  stopArcadeTimers();
  initTeamSession();
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
    hintUsed: false,
    finished: false,
    won: false
  };
  activeMode = 'DETECTIVE';
  audioService.playTransition();
  store.emit('change');
}

function startCrimeMystery() {
  stopArcadeTimers();
  initTeamSession();
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
    interrogatedNames: new Set(),
    shuffledSuspects: shuffleArray(cases[0].suspects || []),
    showTip: false
  };
  activeMode = 'CRIME';
  audioService.playTransition();
  store.emit('change');
}

function startEvidenceBoard() {
  stopArcadeTimers();
  initTeamSession();
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
    labScanned: false,
    solvedIds: new Set()
  };
  activeMode = 'EVIDENCE';
  audioService.playTransition();
  store.emit('change');
}

function startVaultCodebreaker() {
  stopArcadeTimers();
  initTeamSession();
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
    hintUsed: false,
    finished: false,
    won: false
  };
  activeMode = 'VAULT';
  audioService.playTransition();
  store.emit('change');
}

function startSpeedDuel() {
  stopArcadeTimers();
  initTeamSession();
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
      audioService.playCorrect();
      commitTeamSessionContributions('Mystery Speed Duel', 'B1');
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
        publishLeaderboardMode: 'ARCADE',
        skipAutoTeamContrib: playFormat === 'TEAM'
      });
      store.emit('change');
    }
  }, 250);
  activeMode = 'DUEL';
  audioService.playTransition();
  store.emit('change');
}

function startMemoryFlip() {
  stopArcadeTimers();
  initTeamSession();
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
  audioService.playTransition();
  store.emit('change');
}

function startSpinWheel() {
  stopArcadeTimers();
  initTeamSession();
  gState = {
    rotation: 0,
    spinning: false,
    lastSlice: null,
    bonusQ: null,
    bonusAnswered: null,
    spinsToday: 0
  };
  activeMode = 'WHEEL';
  audioService.playTransition();
  store.emit('change');
}

// ---------------- ARABIC ARCADE GAMES (ألعاب عربية — جرائم وعلوم وحقائق) ----------------

function startArabicBlitz() {
  stopArcadeTimers();
  initTeamSession();
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
      audioService.playCorrect();
      commitTeamSessionContributions('سباق المعاني العربي', 'B1');
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
        publishLeaderboardMode: 'ARCADE',
        skipAutoTeamContrib: playFormat === 'TEAM'
      });
      store.emit('change');
    }
  }, 250);
  activeMode = 'AR_BLITZ';
  audioService.playTransition();
  store.emit('change');
}

function startArabicDetective() {
  stopArcadeTimers();
  initTeamSession();
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
    hintUsed: false,
    finished: false,
    won: false
  };
  activeMode = 'AR_DETECTIVE';
  audioService.playTransition();
  store.emit('change');
}

function startArabicVault() {
  stopArcadeTimers();
  initTeamSession();
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
    hintUsed: false,
    finished: false,
    won: false
  };
  activeMode = 'AR_VAULT';
  audioService.playTransition();
  store.emit('change');
}

function startArabicDuel() {
  stopArcadeTimers();
  initTeamSession();
  const diff = getDiffConfig();
  const rounds = shuffleArray(ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS).map((r) => ({
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
      audioService.playCorrect();
      commitTeamSessionContributions('تحدي الجرائم والحقائق', 'B1');
      await store.awardActivityProgress({
        xpDelta: Math.round(Math.max(20, Math.round(gState.score / 15)) * (gState.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: 'تحدي الجرائم والحقائق (Crime & Science)',
        score: gState.score,
        accuracyPct: Math.round((gState.correct / Math.max(1, gState.idx + 1)) * 100),
        wordsPracticed: gState.idx + 1,
        durationMinutes: 1,
        arcadePlayed: true,
        highCombo: gState.bestStreak,
        publishLeaderboardMode: 'ARCADE',
        skipAutoTeamContrib: playFormat === 'TEAM'
      });
      store.emit('change');
    }
  }, 250);
  activeMode = 'AR_DUEL';
  audioService.playTransition();
  store.emit('change');
}

// ---------------- 4 NEW ANIMATED INTERACTIVE GAMES (2 EN + 2 AR) ----------------

function startMeteorDefense() {
  stopArcadeTimers();
  initTeamSession('Meteor Word Defense');
  const diff = getDiffConfig();
  const pool = shuffleArray(getAllWordsPool());
  const waves = Array.from({ length: 10 }, (_, idx) => {
    const target = pool[idx % pool.length];
    const distractors = shuffleArray(pool.filter((w) => w.english !== target.english)).slice(0, 3);
    const opts = shuffleArray([target.arabic, ...distractors.map((d) => d.arabic)]);
    return { target, opts, answer: target.arabic };
  });
  const fallSpeed = diff.id === 'HARD' ? 0.14 : diff.id === 'EASY' ? 0.065 : 0.095;
  gState = {
    diff,
    waves,
    waveIdx: 0,
    shields: 3,
    score: 0,
    combo: 0,
    bestCombo: 0,
    destroyed: 0,
    meteorY: 0.08,
    fallSpeed,
    lasers: [],
    explosions: [],
    finished: false,
    won: false
  };
  activeMode = 'METEOR';
  audioService.playTransition();
  store.emit('change');
}

async function finishMeteorDefense(isArabic = false) {
  if (activeArcadeRafId) {
    cancelAnimationFrame(activeArcadeRafId);
    activeArcadeRafId = null;
  }
  if (!gState || gState.finished) return;
  gState.finished = true;
  gState.won = gState.shields > 0;
  const total = Math.max(1, gState.waves.length);
  const acc = Math.round((gState.destroyed / total) * 100);
  const title = isArabic ? 'دفاع النيازك الفضائي' : 'Meteor Word Defense';
  if (gState.won) {
    store.confetti();
    audioService.playCorrect();
  } else {
    audioService.playIncorrect();
  }
  commitTeamSessionContributions(title, 'B1');
  await store.awardActivityProgress({
    xpDelta: Math.round(Math.max(15, Math.round(gState.score / 16)) * (gState.diff?.xpMultiplier || 1)),
    activityType: ActivityType.GAME,
    title,
    score: gState.score,
    accuracyPct: acc,
    wordsPracticed: Math.max(1, gState.waveIdx + 1),
    durationMinutes: 2,
    arcadePlayed: true,
    highCombo: gState.bestCombo,
    publishLeaderboardMode: 'ARCADE',
    skipAutoTeamContrib: playFormat === 'TEAM'
  });
  store.emit('change');
}

function startRocketRace() {
  stopArcadeTimers();
  initTeamSession('Rocket Fuel Race');
  const diff = getDiffConfig();
  const pool = shuffleArray(getAllWordsPool());
  const questions = Array.from({ length: 24 }, (_, idx) => {
    const target = pool[idx % pool.length];
    const distractors = shuffleArray(pool.filter((w) => w.english !== target.english)).slice(0, 3);
    return {
      target,
      opts: shuffleArray([target.arabic, ...distractors.map((d) => d.arabic)]),
      answer: target.arabic
    };
  });

  const lanes =
    playFormat === 'TEAM' && teamSession?.teams?.length
      ? teamSession.teams.map((t) => ({
          id: t.id,
          name: t.name,
          color: avatarColorForTag(t.accentColor),
          targetDist: 0,
          displayDist: 0
        }))
      : [
          { id: 'player', name: store.currentUserName || 'You', color: '#563AE4', targetDist: 0, displayDist: 0 },
          { id: 'rival', name: 'Turbo Bot', color: '#FF5A5F', targetDist: 0, displayDist: 0 }
        ];

  gState = {
    diff,
    questions,
    qIdx: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    correct: 0,
    goalDist: 1000,
    lanes,
    winnerName: '',
    finished: false
  };
  activeMode = 'ROCKET';
  audioService.playTransition();
  store.emit('change');
}

async function finishRocketRace() {
  if (activeArcadeRafId) {
    cancelAnimationFrame(activeArcadeRafId);
    activeArcadeRafId = null;
  }
  if (!gState || gState.finished) return;
  gState.finished = true;
  store.confetti();
  audioService.playCorrect();
  commitTeamSessionContributions('Rocket Fuel Race', 'B1');
  await store.awardActivityProgress({
    xpDelta: Math.round(Math.max(20, Math.round(gState.score / 15)) * (gState.diff?.xpMultiplier || 1)),
    activityType: ActivityType.GAME,
    title: 'Rocket Fuel Race',
    score: gState.score,
    accuracyPct: Math.round((gState.correct / Math.max(1, gState.qIdx)) * 100),
    wordsPracticed: Math.max(1, gState.qIdx),
    durationMinutes: 2,
    arcadePlayed: true,
    highCombo: gState.bestCombo,
    publishLeaderboardMode: 'ARCADE',
    skipAutoTeamContrib: playFormat === 'TEAM'
  });
  store.emit('change');
}

function startArabicMeteorDefense() {
  stopArcadeTimers();
  initTeamSession('دفاع النيازك الفضائي');
  const diff = getDiffConfig();
  const pool = shuffleArray(ARABIC_ARCADE_WORDS);
  const waves = Array.from({ length: 10 }, (_, idx) => {
    const target = pool[idx % pool.length];
    const askAntonym = idx % 2 === 1;
    const answer = askAntonym ? target.antonym : target.synonym;
    const otherVals = pool
      .filter((w) => w.word !== target.word)
      .map((w) => (askAntonym ? w.antonym : w.synonym))
      .filter((v) => v && v !== answer);
    const distractors = shuffleArray([...new Set(otherVals)]).slice(0, 3);
    return {
      target,
      askAntonym,
      opts: shuffleArray([answer, ...distractors]),
      answer
    };
  });
  const fallSpeed = diff.id === 'HARD' ? 0.14 : diff.id === 'EASY' ? 0.065 : 0.095;
  gState = {
    diff,
    waves,
    waveIdx: 0,
    shields: 3,
    score: 0,
    combo: 0,
    bestCombo: 0,
    destroyed: 0,
    meteorY: 0.08,
    fallSpeed,
    lasers: [],
    explosions: [],
    finished: false,
    won: false
  };
  activeMode = 'AR_METEOR';
  audioService.playTransition();
  store.emit('change');
}

function buildArabicMazePool() {
  const fromDuel = ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS.map((r) => ({
    scenarioPrompt: r.scenarioPrompt,
    options: r.options,
    correctText: r.options[Number(r.oddIndex || 0)],
    explanation: r.explanation,
    level: r.level || 'B1'
  }));
  const fromWords = ARABIC_ARCADE_WORDS.map((w) => {
    const others = shuffleArray(ARABIC_ARCADE_WORDS.filter((x) => x.word !== w.word)).slice(0, 3);
    const opts = shuffleArray([w.synonym, ...others.map((o) => o.synonym)]);
    return {
      scenarioPrompt: `ما مرادف كلمة "${w.word}"؟ (${w.clue})`,
      options: opts,
      correctText: w.synonym,
      explanation: `${w.word} معناها (${w.synonym}).`,
      level: w.cefrLevel || 'B1'
    };
  });
  return shuffleArray([...fromDuel, ...fromWords]);
}

function startArabicTreasureMaze() {
  stopArcadeTimers();
  initTeamSession('متاهة الكنز والفضاء');
  const diff = getDiffConfig();
  const traps = ['1,0', '3,1', '1,3', '3,3']; // Safe solvable path around diagonal & edges
  const pool = buildArabicMazePool();
  const q = pool[0];
  gState = {
    diff,
    pos: { r: 0, c: 0 },
    goal: { r: 4, c: 4 },
    traps: new Set(traps),
    visited: new Set(['0,0']),
    hearts: diff.id === 'HARD' ? 2 : 3,
    score: 0,
    moves: 0,
    pool,
    qIdx: 0,
    currentQ: { ...q, shuffledOpts: shuffleArray(q.options) },
    awaitingMove: false,
    finished: false,
    won: false
  };
  activeMode = 'AR_MAZE';
  audioService.playTransition();
  store.emit('change');
}

async function finishArabicMaze(won) {
  if (!gState || gState.finished) return;
  gState.finished = true;
  gState.won = won;
  if (won) {
    store.confetti();
    audioService.playCorrect();
  } else {
    audioService.playIncorrect();
  }
  commitTeamSessionContributions('متاهة الكنز والفضاء', 'B1');
  await store.awardActivityProgress({
    xpDelta: Math.round(Math.max(20, Math.round(gState.score / 12)) * (gState.diff?.xpMultiplier || 1)),
    activityType: ActivityType.GAME,
    title: 'متاهة الكنز والفضاء',
    score: gState.score,
    accuracyPct: won ? 100 : 60,
    wordsPracticed: Math.max(1, gState.qIdx + 1),
    durationMinutes: 2,
    arcadePlayed: true,
    publishLeaderboardMode: 'ARCADE',
    skipAutoTeamContrib: playFormat === 'TEAM'
  });
  store.emit('change');
}

// ---------------- GAME ACTION HELPERS (SHARED BY CLICK + KEYBOARD) ----------------

function pickDashOption(opt, targetArabic) {
  const g = gState;
  if (!g || g.finished) return;
  g.total += 1;
  if (opt === targetArabic) {
    audioService.playCorrect();
    g.combo += 1;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    g.correct += 1;
    const pts = 50 + Math.min(g.combo, 5) * 20;
    g.score += pts;
    addSquadPoints(pts);
  } else {
    audioService.playIncorrect();
    g.combo = 0;
    store.toast(`Answer: ${targetArabic}`, 'error');
    rotateSquadTurn(true);
  }
  g.qIdx += 1;
  g.cur = g.makeQ(g.qIdx);
  store.emit('change');
}

function pickArabicBlitzOption(opt, answer) {
  const g = gState;
  if (!g || g.finished) return;
  g.total += 1;
  if (opt === answer) {
    audioService.playCorrect();
    g.combo += 1;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    g.correct += 1;
    const pts = 50 + Math.min(g.combo, 5) * 20;
    g.score += pts;
    addSquadPoints(pts);
  } else {
    audioService.playIncorrect();
    g.combo = 0;
    store.toast(`الإجابة الصحيحة: ${answer}`, 'error');
    rotateSquadTurn(true);
  }
  g.qIdx += 1;
  g.cur = g.makeQ(g.qIdx);
  store.emit('change');
}

async function handleEnglishDetectiveGuess(ch) {
  const g = gState;
  if (!g || g.finished || g.guessed.has(ch)) return;
  g.guessed.add(ch);
  const letters = g.targetUpper.split('');
  if (!g.targetUpper.includes(ch)) {
    audioService.playIncorrect();
    g.wrongCount += 1;
    rotateSquadTurn(true);
  } else {
    audioService.playCorrect();
    addSquadPoints(25);
  }
  const allFound = letters.every((l) => g.guessed.has(l));
  if (allFound || g.wrongCount >= g.maxWrong) {
    g.finished = true;
    g.won = allFound;
    if (allFound) {
      const roundScore = Math.max(40, 120 - g.wrongCount * 15);
      addSquadPoints(roundScore);
      store.confetti();
      commitTeamSessionContributions(`Word Detective: ${g.wordObj.english}`, g.wordObj.cefrLevel);
      await store.awardActivityProgress({
        xpDelta: Math.round(35 * (g.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: `Word Detective: ${g.wordObj.english}`,
        cefrLevel: g.wordObj.cefrLevel,
        score: roundScore,
        accuracyPct: Math.round(((g.maxWrong - g.wrongCount) / g.maxWrong) * 100),
        wordsPracticed: 1,
        durationMinutes: 2,
        arcadePlayed: true,
        skipAutoTeamContrib: playFormat === 'TEAM'
      });
    }
  }
  store.emit('change');
}

async function handleArabicDetectiveGuess(ch) {
  const g = gState;
  if (!g || g.finished || g.guessed.has(ch)) return;
  g.guessed.add(ch);
  const letters = g.targetWord.split('');
  if (!g.targetWord.includes(ch)) {
    audioService.playIncorrect();
    g.wrongCount += 1;
    rotateSquadTurn(true);
  } else {
    audioService.playCorrect();
    addSquadPoints(25);
  }
  const allFound = letters.every((l) => g.guessed.has(l));
  if (allFound || g.wrongCount >= g.maxWrong) {
    g.finished = true;
    g.won = allFound;
    if (allFound) {
      const roundScore = Math.max(40, 120 - g.wrongCount * 15);
      addSquadPoints(roundScore);
      store.confetti();
      commitTeamSessionContributions(`كاشف الكلمة: ${g.targetWord}`, g.wordObj.cefrLevel);
      await store.awardActivityProgress({
        xpDelta: Math.round(35 * (g.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: `كاشف الكلمة العربية: ${g.targetWord}`,
        cefrLevel: g.wordObj.cefrLevel,
        score: roundScore,
        accuracyPct: Math.round(((g.maxWrong - g.wrongCount) / g.maxWrong) * 100),
        wordsPracticed: 1,
        durationMinutes: 2,
        arcadePlayed: true,
        skipAutoTeamContrib: playFormat === 'TEAM'
      });
    }
  }
  store.emit('change');
}

async function submitEnglishVaultGuess() {
  const g = gState;
  if (!g || g.finished || g.currentInput.length !== g.target.length) return;
  g.guesses.push(g.currentInput);
  const won = g.currentInput === g.target;
  g.currentInput = '';
  if (won || g.guesses.length >= g.maxRows) {
    g.finished = true;
    g.won = won;
    if (won) {
      audioService.playCorrect();
      const roundScore = (g.maxRows - g.guesses.length + 1) * 100;
      addSquadPoints(roundScore);
      store.confetti();
      commitTeamSessionContributions(`Vault Cipher: ${g.target}`, g.cipher.cefrLevel);
      await store.awardActivityProgress({
        xpDelta: Math.round(45 * (g.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: `Vault Cipher: ${g.target}`,
        cefrLevel: g.cipher.cefrLevel,
        score: roundScore,
        accuracyPct: 100,
        wordsPracticed: 1,
        durationMinutes: 2,
        arcadePlayed: true,
        skipAutoTeamContrib: playFormat === 'TEAM'
      });
    } else {
      audioService.playIncorrect();
    }
  } else {
    audioService.playTurnSwap();
    rotateSquadTurn(true);
  }
  store.emit('change');
}

async function submitArabicVaultGuess() {
  const g = gState;
  if (!g || g.finished || g.currentInput.length !== g.target.length) return;
  g.guesses.push(g.currentInput);
  const won = g.currentInput === g.target;
  g.currentInput = '';
  if (won || g.guesses.length >= g.maxRows) {
    g.finished = true;
    g.won = won;
    if (won) {
      audioService.playCorrect();
      const roundScore = (g.maxRows - g.guesses.length + 1) * 100;
      addSquadPoints(roundScore);
      store.confetti();
      commitTeamSessionContributions(`خزنة الحروف: ${g.target}`, g.cipher.cefrLevel);
      await store.awardActivityProgress({
        xpDelta: Math.round(45 * (g.diff?.xpMultiplier || 1)),
        activityType: ActivityType.GAME,
        title: `خزنة الحروف العربية: ${g.target}`,
        cefrLevel: g.cipher.cefrLevel,
        score: roundScore,
        accuracyPct: 100,
        wordsPracticed: 1,
        durationMinutes: 2,
        arcadePlayed: true,
        skipAutoTeamContrib: playFormat === 'TEAM'
      });
    } else {
      audioService.playIncorrect();
    }
  } else {
    audioService.playTurnSwap();
    rotateSquadTurn(true);
  }
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
      renderTeamResultsCard(),
      el('div', { className: 'row-between' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startWordDash }, 'Play Again'))
    );
  }
  const { target, opts, hiddenIndices } = g.cur;
  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('Word Dash Blitz'),
    el('div', { className: 'row-between' }, el('span', { id: 'arcade-dash-timer', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.combo}x`)),
    el(
      'div',
      { className: 'stack-xs anim-pop-in' },
      createAnimatedWordStageCanvas({
        word: target.english,
        subLabel: 'Pick the accurate Arabic meaning (or keys 1–4)',
        accentHex: '#563AE4',
        combo: g.combo,
        height: 112
      }),
      el('div', { className: 'row-between' }, createCefrBadge(target.cefrLevel), el('button', { type: 'button', className: 'btn btn-soft small', ariaLabel: 'Pronounce word', onClick: () => ttsSpeaker.speak(target.english) }, '🔊 Pronounce'))
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
            audioService.playUnlock();
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
            style: { minHeight: '60px', justifyContent: 'space-between', visibility: hiddenIndices.has(idx) ? 'hidden' : 'visible' },
            onClick: () => pickDashOption(opt, target.arabic)
          },
          el('span', { className: 'badge-pill card-soft-primary mono' }, `${idx + 1}`),
          el('span', { className: 'flex-1', style: { textAlign: 'center' } }, opt)
        )
      )
    )
  );
}

function renderDetectiveGame() {
  const g = gState;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letters = g.targetUpper.split('');

  const revealOneLetter = () => {
    if (g.finished || g.hintUsed) return;
    const missing = letters.filter((l) => !g.guessed.has(l));
    if (!missing.length) return;
    g.hintUsed = true;
    const pick = missing[Math.floor(Math.random() * missing.length)];
    handleEnglishDetectiveGuess(pick);
  };

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('Word Detective'),
    el(
      'div',
      { className: 'card stack-sm anim-pop-in', style: { textAlign: 'center' } },
      el(
        'div',
        { className: 'row-between' },
        el('span', { className: 'small' }, 'Life Orbs: ' + '🟢'.repeat(Math.max(0, g.maxWrong - g.wrongCount)) + '🔴'.repeat(g.wrongCount)),
        el('div', { className: 'row', style: { gap: '6px' } }, el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Speak clue sentence', onClick: () => ttsSpeaker.speak(g.wordObj.exampleSentence) }, '🔊'), createCefrBadge(g.wordObj.cefrLevel))
      ),
      createAnimatedWordStageCanvas({
        word: g.wordObj.arabic,
        subLabel: g.wordObj.exampleSentence.replace(new RegExp(g.wordObj.english, 'ig'), '_____'),
        accentHex: '#0E9F6E',
        rtl: true,
        height: 98
      }),
      el(
        'div',
        { className: 'vault-row', style: { marginTop: '8px', flexWrap: 'wrap' } },
        ...letters.map((l) =>
          el('div', { className: `vault-cell ${g.guessed.has(l) || g.finished ? 'hit' : ''}` }, g.guessed.has(l) || g.finished ? l : '')
        )
      ),
      !g.finished
        ? el(
            'button',
            {
              type: 'button',
              className: 'btn btn-soft small',
              style: { alignSelf: 'center', marginTop: '6px' },
              disabled: g.hintUsed,
              onClick: revealOneLetter
            },
            g.hintUsed ? '💡 Hint Used' : '💡 Reveal 1 Letter'
          )
        : null
    ),
    g.finished
      ? el(
          'div',
          { className: `card stack-sm ${g.won ? 'card-soft-mint' : 'card-soft-secondary'}`, style: { textAlign: 'center' } },
          el('div', { className: 'section-title' }, g.won ? `🎉 Solved: ${g.wordObj.english}!` : `🔍 The word was ${g.wordObj.english}`),
          renderTeamResultsCard(),
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
                onClick: () => handleEnglishDetectiveGuess(ch)
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
    renderTeamPlayHud(`Crime Mystery: ${c.title}`),
    el(
      'div',
      { className: 'row-between' },
      el('span', { className: 'badge-pill card-soft-primary mono' }, `Case ${g.idx + 1}/${g.cases.length} · Solved: ${g.solved}`),
      el('div', { className: 'row', style: { gap: '6px' } }, el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Read case aloud', onClick: () => ttsSpeaker.speak(`${c.title}. ${c.scene}`) }, '🔊'), createCefrBadge(c.cefrLevel))
    ),
    el(
      'div',
      { className: 'card stack-sm' },
      el('h2', { className: 'section-title' }, `🕵️ ${c.title}`),
      el('p', { className: 'small', style: { margin: 0 } }, c.scene),
      el('div', { className: 'card card-soft-amber small' }, el('strong', {}, 'Key Clues: '), el('div', {}, `• ${c.detectiveClue || ''}`)),
      el(
        'div',
        { className: 'row-wrap' },
        el('button', { type: 'button', className: 'btn btn-ghost small', onClick: () => { g.showTip = !g.showTip; store.emit('change'); } }, g.showTip ? 'Hide Forensic Tip' : '💡 Forensic Vocab Tip'),
        el('span', { className: 'xs muted', style: { alignSelf: 'center' } }, `Interrogated: ${g.interrogatedNames.size}/${g.shuffledSuspects.length}`)
      ),
      g.showTip ? el('div', { className: 'card card-soft-primary small' }, c.forensicTip) : null
    ),
    el(
      'div',
      { className: 'stack-sm' },
      ...g.shuffledSuspects.map((sus) => {
        const isCulprit = sus.name === c.culpritName;
        const interrogated = g.interrogatedNames.has(sus.name);
        return el(
          'div',
          {
            className: `card stack-xs ${answered ? (isCulprit ? 'card-soft-mint' : g.pickedSuspect === sus.name ? 'card-soft-secondary' : '') : ''}`
          },
          el(
            'div',
            { className: 'row-between', style: { gap: '8px' } },
            el('div', { className: 'card-title' }, `${sus.name}${sus.role ? ` (${sus.role})` : ''}`),
            !answered
              ? el(
                  'button',
                  {
                    type: 'button',
                    className: 'btn btn-soft small',
                    onClick: () => {
                      g.interrogatedNames.add(sus.name);
                      audioService.playClick();
                      store.emit('change');
                    }
                  },
                  interrogated ? '🔎 Clue Uncovered' : '🎙️ Interrogate'
                )
              : null
          ),
          el('div', { className: 'small muted' }, `"${sus.alibi}"`),
          (interrogated || answered) && sus.suspiciousDetail
            ? el('div', { className: 'xs card card-soft-amber', style: { padding: '6px 10px' } }, `🔎 Cross-Exam Note: ${sus.suspiciousDetail}`)
            : null,
          !answered
            ? el(
                'button',
                {
                  type: 'button',
                  className: 'btn btn-outline small',
                  style: { marginTop: '4px' },
                  onClick: async () => {
                    g.pickedSuspect = sus.name;
                    if (isCulprit) {
                      audioService.playCorrect();
                      g.solved += 1;
                      g.score += 150;
                      addSquadPoints(150);
                      store.confetti();
                      commitTeamSessionContributions(`Crime Case: ${c.title}`, c.cefrLevel);
                      if (teamSession) teamSession.committed = false;
                      await store.awardActivityProgress({
                        xpDelta: 40,
                        activityType: ActivityType.GAME,
                        title: `Crime Case: ${c.title}`,
                        cefrLevel: c.cefrLevel,
                        score: 150,
                        accuracyPct: 100,
                        wordsPracticed: 6,
                        durationMinutes: 3,
                        arcadePlayed: true,
                        skipAutoTeamContrib: playFormat === 'TEAM'
                      });
                    } else {
                      audioService.playIncorrect();
                      rotateSquadTurn(true);
                    }
                    store.emit('change');
                  }
                },
                `⚖️ Accuse ${sus.name}`
              )
            : null
        );
      })
    ),
    answered
      ? el(
          'div',
          { className: `card stack-sm ${g.pickedSuspect === c.culpritName ? 'card-soft-mint' : 'card-soft-secondary'}` },
          el('div', { className: 'card-title' }, g.pickedSuspect === c.culpritName ? '✅ Case Closed!' : `❌ The real culprit was ${c.culpritName}`),
          el('p', { className: 'small', style: { margin: 0 } }, c.explanation),
          renderTeamResultsCard(),
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
                  g.interrogatedNames = new Set();
                  g.showTip = false;
                  g.shuffledSuspects = shuffleArray(g.cases[g.idx].suspects || []);
                  rotateSquadTurn(true);
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

  const goNextUnsolved = () => {
    const nextCard = g.cards.find((c) => c.id !== activeCard.id && !g.solvedIds.has(c.id)) || g.cards[(g.cards.indexOf(activeCard) + 1) % g.cards.length];
    g.selectedCardId = nextCard.id;
    g.pickedCulprit = null;
    g.labScanned = false;
    rotateSquadTurn(true);
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud(`Evidence Board: ${activeCard.title}`),
    el('div', { className: 'row-between' }, el('p', { className: 'small muted', style: { margin: 0 } }, `Inspect clues, run Lab Scan, pin (${pinnedIds.size}), & crack culprit`), el('span', { className: 'badge-pill card-soft-mint mono' }, `${g.solvedIds.size}/${g.cards.length} Solved`)),
    el(
      'div',
      { className: 'scroll-x' },
      ...g.cards.map((c) =>
        el(
          'button',
          {
            type: 'button',
            className: `chip ${activeCard.id === c.id ? 'selected' : ''}`,
            onClick: () => { g.selectedCardId = c.id; g.pickedCulprit = null; g.labScanned = false; store.emit('change'); }
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
        { className: 'row-between', style: { flexWrap: 'wrap', gap: '8px' } },
        el('h2', { className: 'section-title' }, activeCard.title),
        el(
          'div',
          { className: 'row', style: { gap: '6px' } },
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-soft small',
              onClick: () => { g.labScanned = !g.labScanned; audioService.playClick(); store.emit('change'); }
            },
            g.labScanned ? '🔬 Hide Scan' : '🧪 Lab Scan'
          ),
          el(
            'button',
            {
              type: 'button',
              className: `btn small ${pinnedIds.has(activeCard.id) ? 'btn-secondary' : 'btn-outline'}`,
              onClick: () => store.togglePinEvidence(activeCard.id)
            },
            pinnedIds.has(activeCard.id) ? '📌 Pinned' : '📍 Pin Clue'
          )
        )
      ),
      el('div', { className: 'row-wrap' }, createCefrBadge(activeCard.cefrLevel), el('span', { className: 'badge-pill card-soft-amber' }, activeCard.categoryTag)),
      el('p', { className: 'small', style: { margin: 0 } }, activeCard.clueDetail),
      g.labScanned ? el('div', { className: 'card card-soft-primary small' }, `🔑 Forensic Vocab Hint: ${activeCard.vocabHint}`) : null
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
                audioService.playCorrect();
                g.solvedIds.add(activeCard.id);
                addSquadPoints(120);
                store.confetti();
                commitTeamSessionContributions(`Evidence Solved: ${activeCard.title}`, activeCard.cefrLevel);
                if (teamSession) teamSession.committed = false;
                await store.awardActivityProgress({
                  xpDelta: 40,
                  activityType: ActivityType.GAME,
                  title: `Evidence Solved: ${activeCard.title}`,
                  cefrLevel: activeCard.cefrLevel,
                  score: 120,
                  accuracyPct: 100,
                  wordsPracticed: 4,
                  durationMinutes: 2,
                  arcadePlayed: true,
                  skipAutoTeamContrib: playFormat === 'TEAM'
                });
              } else {
                audioService.playIncorrect();
                rotateSquadTurn(true);
              }
              store.emit('change');
            }
          },
          opt
        );
      })
    ),
    g.pickedCulprit !== null
      ? el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: goNextUnsolved }, 'Inspect Next Evidence →')
      : null
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

  const revealHintChar = () => {
    if (g.finished || g.hintUsed) return;
    g.hintUsed = true;
    const pos = Math.min(len - 1, g.currentInput.length);
    store.toast(`💡 Letter #${pos + 1} is "${g.target[pos]}"!`);
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('Vault Codebreaker'),
    el(
      'div',
      { className: 'card row-between anim-pop-in', style: { gap: '12px', flexWrap: 'wrap' } },
      el(
        'div',
        { className: 'stack-xs flex-1', style: { textAlign: 'left' } },
        el('div', { className: 'row', style: { gap: '8px' } }, createCefrBadge(g.cipher.cefrLevel), el('span', { className: 'xs muted' }, `${len}-Letter Cipher · ${g.maxRows} Rows (${g.diff?.short || ''})`)),
        el('div', { className: 'arabic-text', style: { textAlign: 'left', fontWeight: '800', fontSize: '1.25rem' } }, g.cipher.arabic),
        el('div', { className: 'small muted' }, `Hint: ${g.cipher.clue}`),
        !g.finished
          ? el('button', { type: 'button', className: 'btn btn-soft small', style: { alignSelf: 'flex-start' }, disabled: g.hintUsed, onClick: revealHintChar }, g.hintUsed ? '💡 Hint Used' : '💡 Reveal Next Letter Hint')
          : null
      ),
      createAnimatedVaultDialCanvas({ progress: g.guesses.length / Math.max(1, g.maxRows), locked: !g.finished || !g.won, unlocked: Boolean(g.finished && g.won), size: 88 })
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
          renderTeamResultsCard(),
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
            el('button', { type: 'button', className: 'btn btn-primary flex-1', disabled: g.currentInput.length !== len, onClick: submitEnglishVaultGuess }, 'Submit Guess ✓')
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
      renderTeamResultsCard(),
      el('div', { className: 'row-between' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startSpeedDuel }, 'Duel Again'))
    );
  }
  const r = g.rounds[g.idx % g.rounds.length];
  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('Mystery Speed Duel'),
    el('div', { className: 'row-between' }, el('span', { id: 'duel-timer-pill', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.streak}x`)),
    el(
      'div',
      { className: 'stack-xs anim-pop-in' },
      createAnimatedWordStageCanvas({
        word: 'Odd One Out',
        subLabel: r.theme,
        accentHex: '#A855F7',
        combo: g.streak,
        height: 102
      }),
      el('div', { className: 'row-between' }, createCefrBadge(r.cefrLevel), el('span', { className: 'xs muted' }, 'Tap the clue that does NOT fit (1–4)'))
    ),
    el(
      'div',
      { className: 'grid-2' },
      ...(r.shuffledWords || r.words).map((w, idx) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline',
            style: { minHeight: '62px', fontSize: '1rem', whiteSpace: 'normal', justifyContent: 'space-between' },
            onClick: () => {
              if (w === r.oddWord) {
                audioService.playCorrect();
                g.streak += 1;
                g.bestStreak = Math.max(g.bestStreak, g.streak);
                g.correct += 1;
                const pts = 100 + g.streak * 20;
                g.score += pts;
                addSquadPoints(pts);
                store.toast(`Correct! ${r.reason}`);
              } else {
                audioService.playIncorrect();
                g.streak = 0;
                rotateSquadTurn(true);
                store.toast(`Odd one was "${r.oddWord}" — ${r.reason}`, 'error');
              }
              g.idx += 1;
              store.emit('change');
            }
          },
          el('span', { className: 'badge-pill card-soft-primary mono' }, `${idx + 1}`),
          el('span', { className: 'flex-1', style: { textAlign: 'center' } }, w)
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
      renderTeamResultsCard(),
      el('div', { className: 'row-between' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startMemoryFlip }, 'New Board'))
    );
  }
  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('3D Memory Flip'),
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
                if (tile.kind === 'en') ttsSpeaker.speak(tile.text);
                g.flippedIndices.push(idx);
                store.emit('change');
                if (g.flippedIndices.length === 2) {
                  g.moves += 1;
                  g.locked = true;
                  const [aIdx, bIdx] = g.flippedIndices;
                  const a = g.tiles[aIdx];
                  const b = g.tiles[bIdx];
                  if (a.pairId === b.pairId) {
                    audioService.playCorrect();
                    g.matchedPairIds.add(a.pairId);
                    addSquadPoints(100);
                    g.flippedIndices = [];
                    g.locked = false;
                    if (g.matchedPairIds.size === 6) {
                      g.finished = true;
                      store.confetti();
                      commitTeamSessionContributions('3D Memory Bilingual Flip', 'B1');
                      await store.awardActivityProgress({
                        xpDelta: 40,
                        activityType: ActivityType.GAME,
                        title: '3D Memory Bilingual Flip',
                        score: Math.max(100, 400 - g.moves * 15),
                        accuracyPct: Math.min(100, Math.round((6 / g.moves) * 100)),
                        wordsPracticed: 6,
                        durationMinutes: 2,
                        arcadePlayed: true,
                        skipAutoTeamContrib: playFormat === 'TEAM'
                      });
                    }
                    store.emit('change');
                  } else {
                    audioService.playIncorrect();
                    setTimeout(() => {
                      if (!gState) return;
                      g.flippedIndices = [];
                      g.locked = false;
                      rotateSquadTurn(true);
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

function makeWheelBonusQuestion() {
  const pool = shuffleArray(getAllWordsPool());
  const target = pool[0];
  const distractors = shuffleArray(pool.filter((w) => w.english !== target.english)).slice(0, 3);
  return {
    prompt: `Bonus Challenge: What is the Arabic meaning of "${target.english}"?`,
    options: shuffleArray([target.arabic, ...distractors.map((d) => d.arabic)]),
    answer: target.arabic
  };
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
    g.bonusQ = null;
    g.bonusAnswered = null;
    const startRot = g.rotation;
    const delta = 1080 + Math.random() * 720;
    const startTime = performance.now();
    const dur = 2400;

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
        g.bonusQ = makeWheelBonusQuestion();
        audioService.playCorrect();
        if (slice.xpReward > 0) {
          addSquadPoints(slice.xpReward * 4);
          store.confetti();
          commitTeamSessionContributions(`Spin Wheel: ${slice.title}`, 'B1');
          if (teamSession) teamSession.committed = false;
          await store.awardActivityProgress({
            xpDelta: slice.xpReward,
            activityType: ActivityType.GAME,
            title: `Spin Wheel: ${slice.title}`,
            score: slice.xpReward * 4,
            accuracyPct: 100,
            wordsPracticed: 1,
            durationMinutes: 1,
            arcadePlayed: true,
            skipAutoTeamContrib: playFormat === 'TEAM'
          });
        }
        store.emit('change');
      }
    };
    requestAnimationFrame(anim);
  };

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('Daily Spin Wheel'),
    el(
      'div',
      { className: 'card stack-md', style: { alignItems: 'center', textAlign: 'center' } },
      el('h2', { className: 'section-title' }, '🎡 Daily Spin Wheel'),
      wheelCanvas,
      el('button', { type: 'button', className: 'btn btn-primary btn-full', disabled: g.spinning, onClick: spin }, g.spinning ? 'Spinning...' : '🎡 Spin for Squad Bonus!'),
      g.lastSlice
        ? el(
            'div',
            { className: 'card card-soft-amber btn-full stack-sm' },
            el('strong', {}, `Landed on: ${g.lastSlice.title} (${g.lastSlice.label})`),
            el('div', { className: 'small' }, g.lastSlice.challengePrompt || `Earned +${g.lastSlice.xpReward} XP!`),
            g.bonusQ
              ? el(
                  'div',
                  { className: 'stack-xs', style: { marginTop: '6px' } },
                  el('div', { className: 'card-title' }, g.bonusQ.prompt),
                  el(
                    'div',
                    { className: 'grid-2' },
                    ...g.bonusQ.options.map((opt) => {
                      const done = g.bonusAnswered !== null;
                      const isRight = opt === g.bonusQ.answer;
                      return el(
                        'button',
                        {
                          type: 'button',
                          className: `btn btn-full arabic-text ${done ? (isRight ? 'btn-mint' : g.bonusAnswered === opt ? 'btn-danger-soft' : 'btn-outline') : 'btn-outline'}`,
                          disabled: done,
                          onClick: async () => {
                            g.bonusAnswered = opt;
                            if (isRight) {
                              audioService.playCorrect();
                              addSquadPoints(100);
                              commitTeamSessionContributions('Wheel Bonus Challenge', 'B1');
                              if (teamSession) teamSession.committed = false;
                              store.toast('🎡 Bonus Doubled! +100 Team Pts!', 'badge');
                            } else {
                              audioService.playIncorrect();
                              rotateSquadTurn(true);
                              store.toast(`Correct answer: ${g.bonusQ.answer}`, 'error');
                            }
                            store.emit('change');
                          }
                        },
                        opt
                      );
                    })
                  )
                )
              : null
          )
        : null
    )
  );
}

// ---------------- ARABIC GAMES RENDERERS (Pure Arabic — Crimes, Science, Space, History & Facts) ----------------

function renderArabicBlitzGame() {
  const g = gState;
  if (g.finished) {
    return el(
      'div',
      { className: 'card card-soft-mint stack-md arabic-text', dir: 'rtl', style: { textAlign: 'center', padding: '26px' } },
      el('h2', { className: 'display-title' }, '⚡ انتهى سباق المعاني العربي!'),
      el('div', { className: 'display-title mono', dir: 'ltr' }, `${g.score} pts`),
      el('p', { className: 'small' }, `${g.correct}/${g.total} إجابات صحيحة · أعلى سلسلة: ${g.bestCombo}x`),
      renderTeamResultsCard(),
      el('div', { className: 'row-between', dir: 'ltr' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startArabicBlitz }, 'العب مجدداً'))
    );
  }
  const { target, askAntonym, answer, opts, hiddenIndices } = g.cur;
  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('سباق المعاني العربي'),
    el('div', { className: 'row-between' }, el('span', { id: 'ar-blitz-timer', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.combo}x`)),
    el(
      'div',
      { className: 'stack-xs anim-pop-in' },
      createAnimatedWordStageCanvas({
        word: target.word,
        subLabel: `${askAntonym ? 'اختر الضد (العكس)' : 'اختر المرادف (المعنى)'} · ${target.clue}`,
        accentHex: '#0E9F6E',
        combo: g.combo,
        rtl: true,
        height: 112
      }),
      el('div', { className: 'row-between' }, createCefrBadge(target.cefrLevel), el('span', { className: 'badge-pill card-soft-primary arabic-text' }, askAntonym ? 'اختر الضد' : 'اختر المرادف'))
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
        g.used5050 ? '50/50 تم الاستخدام' : '✂️ حذف إجابتين 50/50'
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
            audioService.playUnlock();
            store.toast('+10 ثوانٍ إضافية!');
            store.emit('change');
          }
        },
        g.usedFreeze ? '+10ث تم الاستخدام' : '❄️ تجميد +10ث'
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
            style: { minHeight: '62px', justifyContent: 'space-between', fontSize: '1.05rem', visibility: hiddenIndices.has(idx) ? 'hidden' : 'visible' },
            onClick: () => pickArabicBlitzOption(opt, answer)
          },
          el('span', { className: 'badge-pill card-soft-primary mono' }, `${idx + 1}`),
          el('span', { className: 'flex-1', style: { textAlign: 'center' } }, opt)
        )
      )
    )
  );
}

function renderArabicDetectiveGame() {
  const g = gState;
  const letters = g.targetWord.split('');

  const revealArabicHint = () => {
    if (g.finished || g.hintUsed) return;
    const missing = letters.filter((l) => !g.guessed.has(l));
    if (!missing.length) return;
    g.hintUsed = true;
    handleArabicDetectiveGuess(missing[0]);
  };

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('كاشف الكلمة العربية'),
    el(
      'div',
      { className: 'card stack-sm arabic-text anim-pop-in', dir: 'rtl', style: { textAlign: 'center' } },
      el('div', { className: 'row-between', dir: 'ltr' }, el('span', { className: 'small' }, 'المحاولات: ' + '🟢'.repeat(Math.max(0, g.maxWrong - g.wrongCount)) + '🔴'.repeat(g.wrongCount)), createCefrBadge(g.wordObj.cefrLevel)),
      createAnimatedWordStageCanvas({
        word: g.wordObj.clue,
        subLabel: `مرادف: ${g.wordObj.synonym} · ضدها: ${g.wordObj.antonym}`,
        accentHex: '#563AE4',
        rtl: true,
        height: 98
      }),
      el(
        'div',
        { className: 'vault-row', dir: 'rtl', style: { marginTop: '8px', flexWrap: 'wrap' } },
        ...letters.map((l) =>
          el('div', { className: `vault-cell arabic-text ${g.guessed.has(l) || g.finished ? 'hit' : ''}` }, g.guessed.has(l) || g.finished ? l : '')
        )
      ),
      !g.finished
        ? el(
            'button',
            {
              type: 'button',
              className: 'btn btn-soft small',
              style: { alignSelf: 'center', marginTop: '6px' },
              disabled: g.hintUsed,
              onClick: revealArabicHint
            },
            g.hintUsed ? '💡 تم كشف حرف' : '💡 اكشف حرفاً مساعداً'
          )
        : null
    ),
    g.finished
      ? el(
          'div',
          { className: `card stack-sm arabic-text ${g.won ? 'card-soft-mint' : 'card-soft-secondary'}`, dir: 'rtl', style: { textAlign: 'center' } },
          el('div', { className: 'section-title' }, g.won ? `🎉 أحسنت! الكلمة هي: ${g.targetWord}` : `🔍 الكلمة المطلوبة: ${g.targetWord}`),
          renderTeamResultsCard(),
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
                onClick: () => handleArabicDetectiveGuess(ch)
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

  const revealVaultChar = () => {
    if (g.finished || g.hintUsed) return;
    g.hintUsed = true;
    const pos = Math.min(len - 1, g.currentInput.length);
    store.toast(`💡 الحرف رقم ${pos + 1} هو "${g.target[pos]}"`);
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('خزنة الحروف العربية'),
    el(
      'div',
      { className: 'card row-between arabic-text anim-pop-in', dir: 'rtl', style: { gap: '12px', flexWrap: 'wrap' } },
      el(
        'div',
        { className: 'stack-xs flex-1' },
        el('div', { className: 'row-between', dir: 'ltr' }, createCefrBadge(g.cipher.cefrLevel), el('span', { className: 'xs muted' }, `كلمة من ${len} حروف · ${g.maxRows} محاولات`)),
        el('div', { style: { fontWeight: '800', fontSize: '1.12rem' } }, g.cipher.arabicClue),
        !g.finished
          ? el('button', { type: 'button', className: 'btn btn-soft small', style: { alignSelf: 'flex-start', marginTop: '4px' }, disabled: g.hintUsed, onClick: revealVaultChar }, g.hintUsed ? '💡 تم استخدام التلميح' : '💡 تلميح حرف')
          : null
      ),
      createAnimatedVaultDialCanvas({ progress: g.guesses.length / Math.max(1, g.maxRows), locked: !g.finished || !g.won, unlocked: Boolean(g.finished && g.won), size: 86 })
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
          renderTeamResultsCard(),
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
            el('button', { type: 'button', className: 'btn btn-primary flex-1', disabled: g.currentInput.length !== len, onClick: submitArabicVaultGuess }, 'تحقق ✓')
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
      el('h2', { className: 'display-title' }, '⚔️ انتهى تحدي الجرائم والحقائق!'),
      el('div', { className: 'display-title mono', dir: 'ltr' }, `${g.score} pts`),
      el('p', { className: 'small' }, `إجابات صحيحة: ${g.correct} · أعلى سلسلة: ${g.bestStreak}x`),
      renderTeamResultsCard(),
      el('div', { className: 'row-between', dir: 'ltr' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startArabicDuel }, 'تحدٍ جديد'))
    );
  }
  const r = g.rounds[g.idx % g.rounds.length];
  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('تحدي الجرائم والحقائق'),
    el('div', { className: 'row-between' }, el('span', { id: 'ar-duel-timer', className: 'badge-pill card-soft-amber mono' }, `⏱ ${g.timeLeft}s`), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.streak}x`)),
    el(
      'div',
      { className: 'stack-xs anim-pop-in' },
      createAnimatedWordStageCanvas({
        word: 'تحدي الجرائم والحقائق',
        subLabel: r.scenarioPrompt,
        accentHex: '#B45309',
        combo: g.streak,
        rtl: true,
        height: 110
      }),
      el('div', { className: 'row-between' }, createCefrBadge(r.level || 'B1'), el('span', { className: 'xs muted arabic-text' }, r.scenarioPrompt))
    ),
    el(
      'div',
      { className: 'grid-2', dir: 'rtl' },
      ...r.shuffledOptions.map((opt, idx) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline arabic-text',
            style: { minHeight: '64px', fontSize: '1rem', whiteSpace: 'normal', justifyContent: 'space-between' },
            onClick: () => {
              if (opt.isCorrect) {
                audioService.playCorrect();
                g.streak += 1;
                g.bestStreak = Math.max(g.bestStreak, g.streak);
                g.correct += 1;
                const pts = 100 + g.streak * 20;
                g.score += pts;
                addSquadPoints(pts);
                store.toast(`أحسنت! ${r.explanation}`);
              } else {
                audioService.playIncorrect();
                g.streak = 0;
                rotateSquadTurn(true);
                store.toast(r.explanation, 'error');
              }
              g.idx += 1;
              store.emit('change');
            }
          },
          el('span', { className: 'badge-pill card-soft-primary mono' }, `${idx + 1}`),
          el('span', { className: 'flex-1', style: { textAlign: 'center' } }, opt.text)
        )
      )
    )
  );
}

// ---------------- 4 NEW ANIMATED GAME RENDERERS ----------------

function handleMeteorShot(opt, isArabic = false) {
  const g = gState;
  if (!g || g.finished) return;
  const wave = g.waves[g.waveIdx];
  if (!wave) return;

  if (opt === wave.answer) {
    audioService.playCorrect();
    g.combo += 1;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    g.destroyed += 1;
    const altitudeBonus = Math.max(10, Math.round((1 - g.meteorY) * 80));
    const pts = 60 + altitudeBonus + Math.min(g.combo, 5) * 20;
    g.score += pts;
    addSquadPoints(pts);
    g.lasers.push({ x1: 0.5, y1: 0.88, x2: 0.5, y2: Math.max(0.14, g.meteorY), life: 1, color: '#34D399' });
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      g.explosions.push({ x: 0.5, y: Math.max(0.14, g.meteorY), vx: Math.cos(ang) * 0.45, vy: Math.sin(ang) * 0.45, life: 1, color: i % 2 === 0 ? '#FBBF24' : '#34D399' });
    }
  } else {
    audioService.playIncorrect();
    g.combo = 0;
    g.shields -= 1;
    rotateSquadTurn(true);
    g.lasers.push({ x1: 0.5, y1: 0.88, x2: 0.25, y2: 0.2, life: 1, color: '#FF5A5F' });
    store.toast(isArabic ? `الإجابة الصحيحة: ${wave.answer}` : `Answer: ${wave.answer}`, 'error');
  }

  g.waveIdx += 1;
  g.meteorY = 0.08;
  if (g.shields <= 0 || g.waveIdx >= g.waves.length) {
    finishMeteorDefense(isArabic);
    return;
  }
  store.emit('change');
}

function renderMeteorDefenseGame(isArabic = false) {
  const g = gState;
  const restartFn = isArabic ? startArabicMeteorDefense : startMeteorDefense;
  if (g.finished) {
    return el(
      'div',
      { className: `card ${g.won ? 'card-soft-mint' : 'card-soft-secondary'} stack-md ${isArabic ? 'arabic-text' : ''}`, dir: isArabic ? 'rtl' : 'ltr', style: { textAlign: 'center', padding: '26px' } },
      el('h2', { className: 'display-title' }, isArabic ? (g.won ? '🛡️ تم إنقاذ المحطة الفضائية!' : '☄️ نفدت الدروع!') : (g.won ? '🛡️ Sector Defended!' : '☄️ Shields Depleted!')),
      el('div', { className: 'display-title mono', dir: 'ltr' }, `${g.score} pts`),
      el('p', { className: 'small' }, isArabic ? `نيازك مدمّرة: ${g.destroyed}/${g.waves.length} · أعلى سلسلة: ${g.bestCombo}x` : `Meteors Destroyed: ${g.destroyed}/${g.waves.length} · Best Combo: ${g.bestCombo}x`),
      renderTeamResultsCard(),
      el('div', { className: 'row-between', dir: 'ltr' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: restartFn }, isArabic ? 'العب مجدداً' : 'Play Again'))
    );
  }

  const wave = g.waves[g.waveIdx];
  const wordLabel = isArabic ? wave.target.word : wave.target.english;
  const subPrompt = isArabic ? (wave.askAntonym ? 'دمّر النيزك باختيار الضد!' : 'دمّر النيزك باختيار المرادف!') : 'Blast meteor with the Arabic meaning (1–4)!';

  const box = el('div', { className: 'arcade-canvas-box', style: { height: '220px', position: 'relative' } });
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  box.appendChild(canvas);

  const stars = Array.from({ length: 32 }, (_, i) => ({ x: ((i * 73) % 100) / 100, y: ((i * 41) % 85) / 100, r: 1 + (i % 2) }));
  let lastNow = performance.now();

  if (activeArcadeRafId) cancelAnimationFrame(activeArcadeRafId);
  const drawFrame = (now) => {
    if (!canvas.isConnected || !gState || gState.finished || (activeMode !== 'METEOR' && activeMode !== 'AR_METEOR')) return;
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;

    g.meteorY += g.fallSpeed * dt;
    if (g.meteorY >= 0.78) {
      g.shields -= 1;
      g.combo = 0;
      g.waveIdx += 1;
      g.meteorY = 0.08;
      audioService.playIncorrect();
      rotateSquadTurn(true);
      if (g.shields <= 0 || g.waveIdx >= g.waves.length) {
        finishMeteorDefense(isArabic);
        return;
      }
      store.emit('change');
      return;
    }

    g.lasers = g.lasers.filter((l) => { l.life -= dt * 3.8; return l.life > 0; });
    g.explosions = g.explosions.filter((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 2.1; return p.life > 0; });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = box.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width || 380));
    const h = 220;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    // Space sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#090B1A');
    sky.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Twinkling stars
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shield horizon dome
    ctx.strokeStyle = g.shields <= 1 ? '#EF4444' : '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h + 110, 145, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Turret cannon
    ctx.fillStyle = '#563AE4';
    ctx.beginPath();
    ctx.arc(w / 2, h - 18, 18, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#A855F7';
    ctx.fillRect(w / 2 - 4, h - 42, 8, 22);

    // Falling Glowing Meteor
    const mx = w / 2;
    const my = Math.max(30, g.meteorY * (h - 24));
    const glow = ctx.createRadialGradient(mx, my, 8, mx, my, 46);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.95)');
    glow.addColorStop(0.55, 'rgba(239, 68, 68, 0.55)');
    glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1F2937';
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(mx - 86, my - 22, 172, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = isArabic ? '800 20px "Noto Sans Arabic", Tahoma, sans-serif' : '800 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wordLabel, mx, my, 156);

    // Lasers
    for (const l of g.lasers) {
      ctx.strokeStyle = l.color;
      ctx.globalAlpha = Math.max(0, l.life);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(l.x1 * w, l.y1 * h);
      ctx.lineTo(l.x2 * w, l.y2 * h);
      ctx.stroke();
    }
    // Explosion sparks
    for (const p of g.explosions) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    activeArcadeRafId = requestAnimationFrame(drawFrame);
  };
  activeArcadeRafId = requestAnimationFrame(drawFrame);

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud(isArabic ? 'دفاع النيازك الفضائي' : 'Meteor Word Defense'),
    el(
      'div',
      { className: 'row-between' },
      el('span', { className: 'badge-pill card-soft-secondary mono' }, '❤️'.repeat(Math.max(0, g.shields)) + '🖤'.repeat(Math.max(0, 3 - g.shields))),
      el('span', { className: 'badge-pill card-soft-primary mono' }, `Wave ${g.waveIdx + 1}/${g.waves.length}`),
      el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.combo}x`)
    ),
    box,
    el('p', { className: `small muted ${isArabic ? 'arabic-text' : ''}`, dir: isArabic ? 'rtl' : 'ltr', style: { margin: 0, textAlign: 'center' } }, subPrompt),
    el(
      'div',
      { className: 'grid-2', dir: isArabic ? 'rtl' : 'ltr' },
      ...wave.opts.map((opt, idx) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline arabic-text',
            style: { minHeight: '60px', justifyContent: 'space-between' },
            onClick: () => handleMeteorShot(opt, isArabic)
          },
          el('span', { className: 'badge-pill card-soft-primary mono' }, `${idx + 1}`),
          el('span', { className: 'flex-1', style: { textAlign: 'center' } }, opt)
        )
      )
    )
  );
}

function handleRocketBoost(opt) {
  const g = gState;
  if (!g || g.finished) return;
  const q = g.questions[g.qIdx % g.questions.length];
  if (!q) return;

  let activeLaneIdx = 0;
  if (playFormat === 'TEAM' && teamSession?.teams?.length) {
    activeLaneIdx = teamSession.activeIdx % g.lanes.length;
  }

  if (opt === q.answer) {
    audioService.playCorrect();
    g.combo += 1;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    g.correct += 1;
    const distGain = 125 + Math.min(g.combo, 4) * 25;
    const pts = 70 + Math.min(g.combo, 5) * 15;
    g.score += pts;
    addSquadPoints(pts);
    g.lanes[activeLaneIdx].targetDist = Math.min(g.goalDist, g.lanes[activeLaneIdx].targetDist + distGain);
    if (playFormat !== 'TEAM' && g.lanes[1]) {
      g.lanes[1].targetDist = Math.min(g.goalDist - 20, g.lanes[1].targetDist + 55);
    }
    if (g.lanes[activeLaneIdx].targetDist >= g.goalDist) {
      g.winnerName = g.lanes[activeLaneIdx].name;
      finishRocketRace();
      return;
    }
    if (playFormat === 'TEAM') rotateSquadTurn(true);
  } else {
    audioService.playIncorrect();
    g.combo = 0;
    if (playFormat !== 'TEAM' && g.lanes[1]) {
      g.lanes[1].targetDist = Math.min(g.goalDist, g.lanes[1].targetDist + 120);
      if (g.lanes[1].targetDist >= g.goalDist) {
        g.winnerName = g.lanes[1].name;
        finishRocketRace();
        return;
      }
    }
    rotateSquadTurn(true);
    store.toast(`Answer: ${q.answer}`, 'error');
  }

  g.qIdx += 1;
  store.emit('change');
}

function renderRocketRaceGame() {
  const g = gState;
  if (g.finished) {
    const playerWon = playFormat === 'TEAM' || g.winnerName === g.lanes[0]?.name;
    return el(
      'div',
      { className: `card ${playerWon ? 'card-soft-mint' : 'card-soft-amber'} stack-md`, style: { textAlign: 'center', padding: '26px' } },
      el('h2', { className: 'display-title' }, `🚀 ${g.winnerName || 'Squad'} Reached Orbit!`),
      el('div', { className: 'display-title mono' }, `${g.score} pts`),
      el('p', { className: 'small' }, `Best Boost Streak: ${g.bestCombo}x · ${g.correct} fuel boosts`),
      renderTeamResultsCard(),
      el('div', { className: 'row-between' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startRocketRace }, 'Race Again'))
    );
  }

  const q = g.questions[g.qIdx % g.questions.length];
  const box = el('div', { className: 'arcade-canvas-box', style: { height: `${Math.max(150, g.lanes.length * 46 + 26)}px` } });
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  box.appendChild(canvas);

  const trackH = Math.max(150, g.lanes.length * 46 + 26);
  const start = performance.now();
  if (activeArcadeRafId) cancelAnimationFrame(activeArcadeRafId);

  const drawTrack = (now) => {
    if (!canvas.isConnected || !gState || gState.finished || activeMode !== 'ROCKET') return;
    const t = (now - start) / 1000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = box.getBoundingClientRect();
    const w = Math.max(280, Math.round(rect.width || 380));
    if (canvas.width !== w * dpr || canvas.height !== trackH * dpr) {
      canvas.width = w * dpr;
      canvas.height = trackH * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep space background + scrolling star lines
    ctx.fillStyle = '#0B1026';
    ctx.fillRect(0, 0, w, trackH);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 24; i++) {
      const sx = (((i * 67) - t * (90 + (i % 3) * 45)) % w + w) % w;
      const sy = ((i * 29) % (trackH - 12)) + 6;
      ctx.fillRect(sx, sy, 6, 1.8);
    }

    // Finish line
    const finishX = w - 34;
    ctx.strokeStyle = '#FBBF24';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(finishX, 12);
    ctx.lineTo(finishX, trackH - 12);
    ctx.stroke();
    ctx.setLineDash([]);

    const laneH = (trackH - 20) / g.lanes.length;
    g.lanes.forEach((lane, idx) => {
      lane.displayDist += (lane.targetDist - lane.displayDist) * 0.14;
      const y = 12 + idx * laneH + laneH / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(22, y + laneH * 0.42);
      ctx.lineTo(finishX, y + laneH * 0.42);
      ctx.stroke();

      const progress = Math.min(1, lane.displayDist / g.goalDist);
      const rx = 34 + progress * (finishX - 52);

      // Flame trail
      const flameLen = 10 + Math.sin(t * 25 + idx) * 5;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(rx - 14, y - 4);
      ctx.lineTo(rx - 14 - flameLen, y);
      ctx.lineTo(rx - 14, y + 4);
      ctx.closePath();
      ctx.fill();

      // Rocket badge
      ctx.fillStyle = lane.color;
      ctx.beginPath();
      ctx.roundRect(rx - 16, y - 12, 32, 24, 10);
      ctx.fill();
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚀', rx, y + 1);

      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${lane.name} (${Math.round(lane.targetDist)}m)`, 14, y - 14);
    });

    ctx.restore();
    activeArcadeRafId = requestAnimationFrame(drawTrack);
  };
  activeArcadeRafId = requestAnimationFrame(drawTrack);

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('Rocket Fuel Race'),
    el('div', { className: 'row-between' }, el('span', { className: 'badge-pill card-soft-primary mono' }, 'Goal: 1,000m'), el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score} · 🔥${g.combo}x`)),
    box,
    createAnimatedWordStageCanvas({
      word: q.target.english,
      subLabel: 'Answer fast to ignite your Rocket Boost (1–4)!',
      accentHex: '#0EA5E9',
      combo: g.combo,
      height: 92
    }),
    el(
      'div',
      { className: 'grid-2' },
      ...q.opts.map((opt, idx) =>
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline arabic-text',
            style: { minHeight: '60px', justifyContent: 'space-between' },
            onClick: () => handleRocketBoost(opt)
          },
          el('span', { className: 'badge-pill card-soft-primary mono' }, `${idx + 1}`),
          el('span', { className: 'flex-1', style: { textAlign: 'center' } }, opt)
        )
      )
    )
  );
}

function handleArabicMazeAnswer(optText) {
  const g = gState;
  if (!g || g.finished || g.awaitingMove) return;
  if (optText === g.currentQ.correctText) {
    audioService.playCorrect();
    const pts = 80;
    g.score += pts;
    addSquadPoints(pts);
    g.awaitingMove = true;
    store.toast(`أحسنت! اختر اتجاه التحرك الآن 🧭`);
  } else {
    audioService.playIncorrect();
    g.hearts -= 1;
    rotateSquadTurn(true);
    store.toast(g.currentQ.explanation || `الإجابة الصحيحة: ${g.currentQ.correctText}`, 'error');
    if (g.hearts <= 0) {
      finishArabicMaze(false);
      return;
    }
    g.qIdx += 1;
    const nextQ = g.pool[g.qIdx % g.pool.length];
    g.currentQ = { ...nextQ, shuffledOpts: shuffleArray(nextQ.options) };
  }
  store.emit('change');
}

function stepArabicMaze(dr, dc) {
  const g = gState;
  if (!g || g.finished || !g.awaitingMove) return;
  const nr = g.pos.r + dr;
  const nc = g.pos.c + dc;
  if (nr < 0 || nr > 4 || nc < 0 || nc > 4) return;

  g.pos = { r: nr, c: nc };
  g.moves += 1;
  g.awaitingMove = false;
  const key = `${nr},${nc}`;
  g.visited.add(key);

  if (nr === g.goal.r && nc === g.goal.c) {
    g.score += 180;
    addSquadPoints(180);
    finishArabicMaze(true);
    return;
  }

  if (g.traps.has(key)) {
    g.hearts -= 1;
    audioService.playIncorrect();
    store.toast('💥 فخ مخفي! فقدت قلباً واحداً!', 'error');
    if (g.hearts <= 0) {
      finishArabicMaze(false);
      return;
    }
  } else {
    audioService.playTurnSwap();
  }

  g.qIdx += 1;
  const nextQ = g.pool[g.qIdx % g.pool.length];
  g.currentQ = { ...nextQ, shuffledOpts: shuffleArray(nextQ.options) };
  if (playFormat === 'TEAM') rotateSquadTurn(true);
  store.emit('change');
}

function renderArabicTreasureMazeGame() {
  const g = gState;
  if (g.finished) {
    return el(
      'div',
      { className: `card ${g.won ? 'card-soft-mint' : 'card-soft-secondary'} stack-md arabic-text`, dir: 'rtl', style: { textAlign: 'center', padding: '26px' } },
      el('h2', { className: 'display-title' }, g.won ? '💎 وصلت إلى الكنز الفضائي!' : '🧭 انتهت المحاولات في المتاهة!'),
      el('div', { className: 'display-title mono', dir: 'ltr' }, `${g.score} pts`),
      el('p', { className: 'small' }, `عدد الخطوات: ${g.moves}`),
      renderTeamResultsCard(),
      el('div', { className: 'row-between', dir: 'ltr' }, el('button', { type: 'button', className: 'btn btn-outline', onClick: exitToHub }, 'Back to Arcade'), el('button', { type: 'button', className: 'btn btn-primary', onClick: startArabicTreasureMaze }, 'متاهة جديدة'))
    );
  }

  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const key = `${r},${c}`;
      const isPlayer = g.pos.r === r && g.pos.c === c;
      const isGoal = g.goal.r === r && g.goal.c === c;
      const isVisitedTrap = g.traps.has(key) && g.visited.has(key);
      const isVisited = g.visited.has(key);
      let icon = '▫️';
      let cls = 'maze-tile';
      if (isPlayer) { icon = '🚀'; cls += ' player'; }
      else if (isGoal) { icon = '💎'; cls += ' goal'; }
      else if (isVisitedTrap) { icon = '💥'; cls += ' trap'; }
      else if (isVisited) { icon = '✓'; cls += ' visited'; }
      cells.push(el('div', { className: cls }, icon));
    }
  }

  return el(
    'div',
    { className: 'stack-md' },
    renderTeamPlayHud('متاهة الكنز والفضاء'),
    el(
      'div',
      { className: 'row-between' },
      el('span', { className: 'badge-pill card-soft-secondary mono' }, '❤️'.repeat(Math.max(0, g.hearts)) + '🖤'.repeat(Math.max(0, 3 - g.hearts))),
      el('span', { className: 'badge-pill card-soft-primary mono' }, `Moves: ${g.moves}`),
      el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${g.score}`)
    ),
    el('div', { className: 'maze-grid anim-pop-in' }, ...cells),
    g.awaitingMove
      ? el(
          'div',
          { className: 'card card-soft-mint stack-sm arabic-text anim-pop-in', dir: 'rtl', style: { textAlign: 'center' } },
          el('div', { className: 'card-title' }, '🧭 طريقك مفتوح! اختر خطوتك القادمة نحو 💎:'),
          el(
            'div',
            { className: 'grid-2', dir: 'ltr' },
            el('button', { type: 'button', className: 'btn btn-primary', disabled: g.pos.r <= 0, onClick: () => stepArabicMaze(-1, 0) }, '⬆️ للأعلى'),
            el('button', { type: 'button', className: 'btn btn-primary', disabled: g.pos.r >= 4, onClick: () => stepArabicMaze(1, 0) }, '⬇️ للأسفل'),
            el('button', { type: 'button', className: 'btn btn-primary', disabled: g.pos.c <= 0, onClick: () => stepArabicMaze(0, -1) }, '⬅️ لليسار'),
            el('button', { type: 'button', className: 'btn btn-primary', disabled: g.pos.c >= 4, onClick: () => stepArabicMaze(0, 1) }, '➡️ لليمين')
          )
        )
      : el(
          'div',
          { className: 'stack-sm' },
          el(
            'div',
            { className: 'card stack-xs arabic-text anim-pop-in', dir: 'rtl', style: { textAlign: 'center' } },
            el('div', { className: 'row-between', dir: 'ltr' }, createCefrBadge(g.currentQ.level || 'B1'), el('span', { className: 'xs muted' }, 'أجب لتفتح خطوة جديدة نحو الكنز 💎')),
            el('h2', { className: 'section-title' }, g.currentQ.scenarioPrompt)
          ),
          el(
            'div',
            { className: 'grid-2', dir: 'rtl' },
            ...g.currentQ.shuffledOpts.map((opt, idx) =>
              el(
                'button',
                {
                  type: 'button',
                  className: 'btn btn-outline arabic-text',
                  style: { minHeight: '60px', justifyContent: 'space-between' },
                  onClick: () => handleArabicMazeAnswer(opt)
                },
                el('span', { className: 'badge-pill card-soft-primary mono' }, `${idx + 1}`),
                el('span', { className: 'flex-1', style: { textAlign: 'center' } }, opt)
              )
            )
          )
        )
  );
}

// ---------------- PHYSICAL KEYBOARD SUPPORT ----------------

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (!activeMode || !gState || gState.finished || store.teamBuzzer?.open) return;
    const tag = (e.target?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const k = e.key;
    if (activeMode === 'AR_MAZE' && gState.awaitingMove) {
      if (k === 'ArrowUp') { e.preventDefault(); stepArabicMaze(-1, 0); return; }
      if (k === 'ArrowDown') { e.preventDefault(); stepArabicMaze(1, 0); return; }
      if (k === 'ArrowLeft') { e.preventDefault(); stepArabicMaze(0, -1); return; }
      if (k === 'ArrowRight') { e.preventDefault(); stepArabicMaze(0, 1); return; }
    }
    if (['1', '2', '3', '4'].includes(k)) {
      const idx = Number(k) - 1;
      if (activeMode === 'DASH' && gState.cur?.opts?.[idx] && !gState.cur.hiddenIndices.has(idx)) {
        pickDashOption(gState.cur.opts[idx], gState.cur.target.arabic);
      } else if (activeMode === 'METEOR' && gState.waves?.[gState.waveIdx]?.opts?.[idx]) {
        handleMeteorShot(gState.waves[gState.waveIdx].opts[idx], false);
      } else if (activeMode === 'AR_METEOR' && gState.waves?.[gState.waveIdx]?.opts?.[idx]) {
        handleMeteorShot(gState.waves[gState.waveIdx].opts[idx], true);
      } else if (activeMode === 'ROCKET' && gState.questions?.[gState.qIdx % gState.questions.length]?.opts?.[idx]) {
        handleRocketBoost(gState.questions[gState.qIdx % gState.questions.length].opts[idx]);
      } else if (activeMode === 'AR_MAZE' && !gState.awaitingMove && gState.currentQ?.shuffledOpts?.[idx]) {
        handleArabicMazeAnswer(gState.currentQ.shuffledOpts[idx]);
      } else if (activeMode === 'AR_BLITZ' && gState.cur?.opts?.[idx] && !gState.cur.hiddenIndices.has(idx)) {
        pickArabicBlitzOption(gState.cur.opts[idx], gState.cur.answer);
      } else if (activeMode === 'DUEL') {
        const r = gState.rounds[gState.idx % gState.rounds.length];
        const w = (r.shuffledWords || r.words)[idx];
        if (w) {
          if (w === r.oddWord) {
            audioService.playCorrect();
            gState.streak += 1;
            gState.bestStreak = Math.max(gState.bestStreak, gState.streak);
            gState.correct += 1;
            const pts = 100 + gState.streak * 20;
            gState.score += pts;
            addSquadPoints(pts);
            store.toast(`Correct! ${r.reason}`);
          } else {
            audioService.playIncorrect();
            gState.streak = 0;
            rotateSquadTurn(true);
            store.toast(`Odd one was "${r.oddWord}" — ${r.reason}`, 'error');
          }
          gState.idx += 1;
          store.emit('change');
        }
      } else if (activeMode === 'AR_DUEL') {
        const r = gState.rounds[gState.idx % gState.rounds.length];
        const opt = r.shuffledOptions?.[idx];
        if (opt) {
          if (opt.isCorrect) {
            audioService.playCorrect();
            gState.streak += 1;
            gState.bestStreak = Math.max(gState.bestStreak, gState.streak);
            gState.correct += 1;
            const pts = 100 + gState.streak * 20;
            gState.score += pts;
            addSquadPoints(pts);
            store.toast(`أحسنت! ${r.explanation}`);
          } else {
            audioService.playIncorrect();
            gState.streak = 0;
            rotateSquadTurn(true);
            store.toast(r.explanation, 'error');
          }
          gState.idx += 1;
          store.emit('change');
        }
      }
      return;
    }

    if (/^[a-zA-Z]$/.test(k)) {
      const upper = k.toUpperCase();
      if (activeMode === 'DETECTIVE') {
        handleEnglishDetectiveGuess(upper);
      } else if (activeMode === 'VAULT' && gState.currentInput.length < gState.target.length) {
        gState.currentInput += upper;
        store.emit('change');
      }
      return;
    }

    if (ARABIC_ALPHABET.includes(k)) {
      if (activeMode === 'AR_DETECTIVE') {
        handleArabicDetectiveGuess(k);
      } else if (activeMode === 'AR_VAULT' && gState.currentInput.length < gState.target.length) {
        gState.currentInput += k;
        store.emit('change');
      }
      return;
    }

    if (k === 'Backspace') {
      if (activeMode === 'VAULT' || activeMode === 'AR_VAULT') {
        gState.currentInput = gState.currentInput.slice(0, -1);
        store.emit('change');
      }
    } else if (k === 'Enter') {
      if (activeMode === 'VAULT') submitEnglishVaultGuess();
      else if (activeMode === 'AR_VAULT') submitArabicVaultGuess();
    }
  });
}

// ---------------- HUB VIEW ----------------

export function renderArcadeView({ navigate }) {
  if (activeMode) {
    const titles = {
      DASH: '⚡ Word Dash Blitz',
      METEOR: '☄️ Meteor Word Defense',
      ROCKET: '🚀 Rocket Fuel Race',
      DETECTIVE: '🔍 Word Detective',
      CRIME: '🕵️ Crime Mystery',
      EVIDENCE: '📌 Evidence Board',
      VAULT: '🔐 Vault Codebreaker',
      DUEL: '⚔️ Mystery Speed Duel',
      MEMORY: '🃏 3D Memory Flip',
      WHEEL: '🎡 Daily Spin Wheel',
      AR_BLITZ: '⚡ سباق المعاني السريع',
      AR_METEOR: '☄️ دفاع النيازك الفضائي',
      AR_MAZE: '🧭 متاهة الكنز والفضاء',
      AR_DETECTIVE: '🔍 كاشف الكلمة العربية',
      AR_VAULT: '🔐 خزنة الحروف العربية',
      AR_DUEL: '⚔️ تحدي الجرائم والحقائق'
    };
    let body = null;
    if (activeMode === 'DASH') body = renderDashGame();
    else if (activeMode === 'METEOR') body = renderMeteorDefenseGame(false);
    else if (activeMode === 'ROCKET') body = renderRocketRaceGame();
    else if (activeMode === 'DETECTIVE') body = renderDetectiveGame();
    else if (activeMode === 'CRIME') body = renderCrimeMysteryGame();
    else if (activeMode === 'EVIDENCE') body = renderEvidenceBoardGame();
    else if (activeMode === 'VAULT') body = renderVaultCodebreakerGame();
    else if (activeMode === 'DUEL') body = renderSpeedDuelGame();
    else if (activeMode === 'MEMORY') body = renderMemoryGame();
    else if (activeMode === 'WHEEL') body = renderSpinWheelGame();
    else if (activeMode === 'AR_BLITZ') body = renderArabicBlitzGame();
    else if (activeMode === 'AR_METEOR') body = renderMeteorDefenseGame(true);
    else if (activeMode === 'AR_MAZE') body = renderArabicTreasureMazeGame();
    else if (activeMode === 'AR_DETECTIVE') body = renderArabicDetectiveGame();
    else if (activeMode === 'AR_VAULT') body = renderArabicVaultGame();
    else if (activeMode === 'AR_DUEL') body = renderArabicDuelGame();

    return el(
      'div',
      { id: 'arcade-stage', className: 'stack-lg' },
      el(
        'div',
        { className: 'row-between' },
        el('h1', { className: 'display-title', style: { fontSize: '1.45rem' } }, titles[activeMode]),
        el(
          'div',
          { className: 'row' },
          el('button', { type: 'button', className: 'btn btn-soft small', onClick: () => openArcadeTeamBuzzer(titles[activeMode]) }, '🚨 Buzzer'),
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
    { id: 'METEOR', lang: 'EN', cat: 'BLITZ', icon: '☄️', title: 'Meteor Word Defense', desc: 'Animated laser turret: blast falling word meteors before impact!', fn: startMeteorDefense, bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)' },
    { id: 'ROCKET', lang: 'EN', cat: 'BLITZ', icon: '🚀', title: 'Rocket Fuel Race', desc: 'Animated squad starfield race to 1,000m on every right hit!', fn: startRocketRace, bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
    { id: 'DASH', lang: 'EN', cat: 'BLITZ', icon: '⚡', title: 'Word Dash Blitz', desc: `${diff.dashDurationSec}s animated stage rapid fire with 50/50 & Freeze`, fn: startWordDash, bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)' },
    { id: 'DETECTIVE', lang: 'EN', cat: 'DETECTIVE', icon: '🔍', title: 'Word Detective', desc: `Guess hidden words (${diff.detectiveLives} orbs) + Reveal Hint`, fn: startWordDetective, bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)' },
    { id: 'CRIME', lang: 'EN', cat: 'DETECTIVE', icon: '🕵️', title: 'Crime Mystery', desc: '8 interactive whodunits with suspect interrogation', fn: startCrimeMystery, bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)' },
    { id: 'EVIDENCE', lang: 'EN', cat: 'DETECTIVE', icon: '📌', title: 'Evidence Board', desc: 'Run Forensic Lab Scans & crack culprit connections', fn: startEvidenceBoard, bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
    { id: 'VAULT', lang: 'EN', cat: 'MEMORY', icon: '🔐', title: 'Vault Codebreaker', desc: `${diff.vaultRows}-row animated dial cipher with keyboard & hints`, fn: startVaultCodebreaker, bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
    { id: 'DUEL', lang: 'EN', cat: 'BLITZ', icon: '⚔️', title: 'Mystery Speed Duel', desc: `${diff.duelDurationSec}s odd-one-out squad duel`, fn: startSpeedDuel, bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)' },
    { id: 'MEMORY', lang: 'EN', cat: 'MEMORY', icon: '🃏', title: '3D Memory Flip', desc: '3×4 English–Arabic board (keep turn on match!)', fn: startMemoryFlip, bg: 'var(--blue-soft)', ink: 'var(--on-blue-soft)' },
    { id: 'WHEEL', lang: 'EN', cat: 'BLITZ', icon: '🎡', title: 'Daily Spin Wheel', desc: 'Spin for XP + interactive Bonus Word Challenge', fn: startSpinWheel, bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
    { id: 'AR_METEOR', lang: 'AR', cat: 'BLITZ', icon: '☄️', title: 'دفاع النيازك الفضائي', desc: 'لعبة ليزر متحركة لتدمير النيازك العربية قبل اصطدامها بالدرع', fn: startArabicMeteorDefense, bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)' },
    { id: 'AR_MAZE', lang: 'AR', cat: 'DETECTIVE', icon: '🧭', title: 'متاهة الكنز والفضاء', desc: 'تحدَّ ألغاز الجرائم والعلوم وتجنب الفخاخ للوصول إلى الكنز 💎', fn: startArabicTreasureMaze, bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
    { id: 'AR_BLITZ', lang: 'AR', cat: 'BLITZ', icon: '⚡', title: 'سباق المعاني السريع (Arabic Blitz)', desc: `${diff.dashDurationSec}ث للمرادفات والأضداد العربية بالكامل`, fn: startArabicBlitz, bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)' },
    { id: 'AR_DETECTIVE', lang: 'AR', cat: 'DETECTIVE', icon: '🔍', title: 'كاشف الكلمة العربية', desc: `خمّن الكلمة العربية (${diff.detectiveLives} محاولات) بلوحة عربية`, fn: startArabicDetective, bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)' },
    { id: 'AR_VAULT', lang: 'AR', cat: 'MEMORY', icon: '🔐', title: 'خزنة الحروف العربية', desc: `تحدي تخمين الكلمة العربية (${diff.vaultRows} صفوف) مع قفل متحرك`, fn: startArabicVault, bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
    { id: 'AR_DUEL', lang: 'AR', cat: 'BLITZ', icon: '⚔️', title: 'تحدي الجرائم والحقائق (Crime & Facts)', desc: `${diff.duelDurationSec}ث في ألغاز الجرائم والعلوم والفلك والتاريخ`, fn: startArabicDuel, bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)' }
  ];

  const langTabs = [
    { id: 'ALL', label: `🌐 All (${games.length})` },
    { id: 'EN', label: '🇬🇧 English (10)' },
    { id: 'AR', label: '🇸🇦 ألعاب عربية Arabic (6)' }
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
      el(
        'div',
        { className: 'row' },
        el('button', { type: 'button', className: 'btn btn-soft small', onClick: () => openArcadeTeamBuzzer('Arcade Team Buzzer') }, '🚨 Team Buzzer'),
        el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Squad Chat', onClick: openInGameSquadChatModal }, '💬'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
      )
    ),

    // Solo vs Team Play + Squad Lineup Selector + Language & Difficulty
    el(
      'div',
      { className: 'card stack-sm' },
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap', gap: '10px' } },
        el(
          'div',
          { className: 'row-wrap' },
          el(
            'button',
            {
              type: 'button',
              className: `chip ${playFormat === 'SOLO' ? 'selected' : ''}`,
              onClick: () => { playFormat = 'SOLO'; store.emit('change'); }
            },
            '🧑 Solo Play'
          ),
          el(
            'button',
            {
              type: 'button',
              className: `chip ${playFormat === 'TEAM' ? 'selected' : ''}`,
              onClick: () => { playFormat = 'TEAM'; store.emit('change'); }
            },
            '🛡️ Team Play (Kahoot Squads)'
          )
        ),
        playFormat === 'TEAM'
          ? el(
              'div',
              { className: 'row-wrap' },
              ...[2, 3, 4].map((cnt) =>
                el(
                  'button',
                  {
                    type: 'button',
                    className: `chip ${squadCount === cnt ? 'selected' : ''}`,
                    onClick: () => { squadCount = cnt; store.emit('change'); }
                  },
                  `${cnt} Teams`
                )
              )
            )
          : null
      ),
      playFormat === 'TEAM'
        ? el(
            'div',
            { className: 'card card-soft-primary stack-xs', style: { padding: '10px 12px' } },
            el('div', { className: 'xs', style: { fontWeight: '800' } }, 'ACTIVE SQUAD LINEUP (Pass-and-Play + 5s Team Buzzer):'),
            el(
              'div',
              { className: 'row-wrap' },
              ...store.getDefaultBattleTeams().slice(0, squadCount).map((t) =>
                el(
                  'span',
                  { className: 'badge-pill', style: { background: avatarColorForTag(t.accentColor), color: '#FFFFFF' } },
                  t.name
                )
              )
            )
          )
        : null,
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
      el('div', { className: 'xs muted' }, `Difficulty: ${diff.label} · ${diff.dashDurationSec}s Blitz · ${diff.detectiveLives} Lives · ${diff.vaultRows} Cipher Rows · ${diff.xpMultiplier}x XP`)
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
            el(
              'div',
              { className: 'row', style: { gap: '4px' } },
              playFormat === 'TEAM' ? el('span', { className: 'badge-pill', style: { background: 'rgba(86,58,228,0.85)', color: '#FFFFFF' } }, '🛡️ TEAM') : null,
              el('span', { className: 'badge-pill', style: { background: 'rgba(255,255,255,0.65)', color: '#171625' } }, g.lang === 'AR' ? '🇸🇦 عربي' : '🇬🇧 EN')
            )
          ),
          el('div', { className: 'stack-xs' }, el('div', { className: 'card-title' }, g.title), el('div', { className: 'xs', style: { opacity: 0.85 } }, g.desc))
        )
      )
    )
  );
}
