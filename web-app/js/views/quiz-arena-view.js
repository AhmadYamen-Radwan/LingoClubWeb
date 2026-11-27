// Quiz Arena View — Live Kahoot PIN Rooms, Solo Blitz, AI Generator (w/ Free Prompt & 3-60 Qs),
// Student Difficulty & Bilingual English + Arabic Quiz Packs

import {
  ActivityType,
  CEFR_LABELS,
  CEFR_LEVELS,
  DIFFICULTY_CONFIG,
  DIFFICULTY_LEVELS,
  RoomStatus,
  avatarColorForTag,
  clearEl,
  computeQuizPointsEarned,
  el,
  prepareDynamicQuizQuestions
} from '../models.js';
import { ARABIC_QUIZ_PACKS, QUIZ_PACKS } from '../data/curated-content.js';
import { aiService } from '../services/ai-service.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openModal, closeModal } from '../components/ui-shared.js';
import { createTrophyCanvas } from '../components/canvas-3d.js';

const KAHOOT_SHAPES = ['▲', '◆', '●', '■'];
const AVATAR_TAGS = ['INDIGO', 'CORAL', 'AMBER', 'MINT'];

let soloState = null; // { title, cefrLevel, difficulty, questions, index, score, streak, bestStreak, correctCount, selectedIdx, timeLeft, timerId, finished }
let roomTimerId = null;
let quizLanguageFilter = 'ALL'; // 'ALL' | 'EN' | 'AR'
let roomChatDraft = '';

function isArabicText(str) {
  return /[\u0600-\u06FF]/.test(String(str || ''));
}

export function stopQuizTimers() {
  stopSoloTimer();
  stopRoomTimer();
}

function stopSoloTimer() {
  if (soloState?.timerId) {
    clearInterval(soloState.timerId);
    soloState.timerId = null;
  }
}

function stopRoomTimer() {
  if (roomTimerId) {
    clearInterval(roomTimerId);
    roomTimerId = null;
  }
}

function resolveQuestionLimitSec(q, difficultyId) {
  const diffCfg = DIFFICULTY_CONFIG[difficultyId] || store.difficultyConfig || DIFFICULTY_CONFIG.MEDIUM;
  if (q && Number(q.timeLimitSec) > 0 && q.timeLimitSec !== 20) {
    // Respect custom time limits when adjusted, otherwise use active difficulty preset
    if (difficultyId === 'HARD') return Math.max(8, Math.min(Number(q.timeLimitSec), diffCfg.timeLimitSec));
    if (difficultyId === 'EASY') return Math.max(Number(q.timeLimitSec), diffCfg.timeLimitSec);
  }
  return diffCfg.timeLimitSec;
}

function startSoloBlitz({ title, cefrLevel, questions, difficulty }) {
  stopSoloTimer();
  const activeDiff = difficulty || store.selectedDifficulty || 'MEDIUM';
  const prepared = prepareDynamicQuizQuestions(questions).slice(0, 60).map((q) => ({
    ...q,
    timeLimitSec: resolveQuestionLimitSec(q, activeDiff)
  }));
  if (!prepared.length) {
    store.toast('This quiz has no questions yet.', 'error');
    return;
  }
  soloState = {
    title,
    cefrLevel: cefrLevel || store.profile?.learningLevel || 'B1',
    difficulty: activeDiff,
    questions: prepared,
    index: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    selectedIdx: null,
    timeLeft: Number(prepared[0].timeLimitSec || 20),
    questionDeadlineMs: Date.now() + Number(prepared[0].timeLimitSec || 20) * 1000,
    timerId: null,
    finished: false
  };

  const startQuestionTimer = () => {
    stopSoloTimer();
    const total = Number(soloState.questions[soloState.index]?.timeLimitSec || 20);
    soloState.timeLeft = total;
    soloState.questionDeadlineMs = Date.now() + total * 1000;
    soloState.timerId = setInterval(() => {
      if (!soloState || soloState.finished || soloState.selectedIdx !== null) return;
      const remaining = Math.max(0, Math.ceil((soloState.questionDeadlineMs - Date.now()) / 1000));
      if (remaining !== soloState.timeLeft) {
        soloState.timeLeft = remaining;
        const timerEl = document.getElementById('solo-timer-pill');
        if (timerEl) {
          timerEl.textContent = remaining > 0 ? `⏱ ${remaining}s` : '⏱ Time Up!';
          timerEl.className = `badge-pill mono ${remaining <= 5 ? 'card-soft-secondary' : 'card-soft-amber'}`;
        }
      }
      if (remaining <= 0) {
        soloState.selectedIdx = -1; // Timed out
        soloState.streak = 0;
        stopSoloTimer();
        store.emit('change');
      }
    }, 250);
  };

  soloState.startQuestionTimer = startQuestionTimer;
  startQuestionTimer();
  store.emit('change');
}

const AI_TOPIC_PRESETS = [
  'General Knowledge & Facts',
  'Arabic Grammar & Nahw (قواعد ونحو)',
  'Arabic Vocabulary & Proverbs (مفردات وأمثال)',
  'Science & Space',
  'World History & Geography',
  'Technology & AI',
  'Animals & Nature',
  'Sports & Pop Culture',
  'Everyday Conversations',
  'English Grammar & Idioms',
  'Arabic–English Vocabulary'
];

function openAiQuizGeneratorModal() {
  const topicInput = el('input', {
    type: 'text',
    className: 'field',
    placeholder: 'Type ANY topic (e.g. General Facts, Football, قوافي عربية, Space...)',
    value: quizLanguageFilter === 'AR' ? 'Arabic Vocabulary & Proverbs (مفردات وأمثال)' : 'General Knowledge & Facts'
  });
  const freePromptInput = el('textarea', {
    id: 'ai-quiz-free-prompt',
    className: 'field',
    rows: 3,
    placeholder: 'Optional free prompt: e.g. "Focus on tricky real-world examples, add hints in Arabic, or ask about 1990s World Cup facts..."'
  });
  const levelSelect = el(
    'select',
    { className: 'field' },
    ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === (store.profile?.learningLevel || 'B1') }, CEFR_LABELS[l] || l))
  );
  const diffSelect = el(
    'select',
    { className: 'field' },
    ...DIFFICULTY_LEVELS.map((d) =>
      el('option', { value: d, selected: d === (store.selectedDifficulty || 'MEDIUM') }, `${DIFFICULTY_CONFIG[d].label} (${DIFFICULTY_CONFIG[d].timeLimitSec}s/Q)`)
    )
  );
  const modeSelect = el(
    'select',
    { className: 'field' },
    el('option', { value: 'AUTO', selected: quizLanguageFilter !== 'AR' }, 'Auto (Match Topic & Prompt)'),
    el('option', { value: 'GENERAL' }, 'General Facts & Trivia'),
    el('option', { value: 'VOCAB' }, 'English & Arabic Vocab'),
    el('option', { value: 'ARABIC', selected: quizLanguageFilter === 'AR' }, '🇸🇦 Arabic Language (العربية)')
  );
  const countInput = el('input', {
    type: 'number',
    className: 'field',
    min: '3',
    max: '60',
    value: '10',
    placeholder: '3 – 60'
  });
  const countPresets = [5, 10, 20, 30, 50];
  let countChips = [];
  const syncCountChips = () => {
    const val = Number(countInput.value);
    countChips.forEach((btn) => {
      btn.classList.toggle('selected', Number(btn.dataset.count) === val);
    });
  };
  countChips = countPresets.map((n) =>
    el(
      'button',
      {
        type: 'button',
        className: `chip ${n === 10 ? 'selected' : ''}`,
        dataset: { count: String(n) },
        onClick: () => {
          countInput.value = String(n);
          syncCountChips();
        }
      },
      `${n} Qs`
    )
  );
  countInput.addEventListener('input', syncCountChips);

  let topicChips = [];
  const syncTopicChips = () => {
    const val = topicInput.value.trim().toLowerCase();
    topicChips.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.topic.toLowerCase() === val);
    });
  };
  topicChips = AI_TOPIC_PRESETS.map((preset) =>
    el(
      'button',
      {
        type: 'button',
        className: `chip ${preset === topicInput.value ? 'selected' : ''}`,
        dataset: { topic: preset },
        onClick: () => {
          topicInput.value = preset;
          if (preset.toLowerCase().includes('arabic') && preset.includes('(')) {
            modeSelect.value = 'ARABIC';
          }
          syncTopicChips();
        }
      },
      preset
    )
  );
  topicInput.addEventListener('input', syncTopicChips);

  const statusEl = el('p', { className: 'small muted hidden', style: { margin: 0 } });

  const genBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-primary btn-full',
      onClick: async () => {
        const requestedCount = Math.min(Math.max(Number(countInput.value) || 10, 3), 60);
        countInput.value = String(requestedCount);
        genBtn.disabled = true;
        genBtn.textContent = `✨ Generating ${requestedCount} Questions...`;
        statusEl.textContent = `Creating ${requestedCount} interactive questions...`;
        statusEl.classList.remove('hidden');
        try {
          const draft = await aiService.generateQuizDraft({
            topic: topicInput.value.trim() || 'General Knowledge & Facts',
            cefrLevel: levelSelect.value,
            difficulty: diffSelect.value,
            customPrompt: freePromptInput.value.trim(),
            questionCount: requestedCount,
            quizMode: modeSelect.value,
            onProgress: (msg) => {
              statusEl.textContent = msg;
            }
          });
          await store.saveCustomQuiz(draft);
          closeModal();
          startSoloBlitz({ ...draft, difficulty: diffSelect.value });
        } catch (err) {
          statusEl.textContent = err?.message || 'Could not generate quiz.';
        } finally {
          genBtn.disabled = false;
          genBtn.textContent = '✨ Generate & Play Now';
        }
      }
    },
    '✨ Generate & Play Now'
  );

  openModal({
    title: '✨ AI Quiz Generator',
    subtitle: 'Pick a topic, add your own free prompt instructions, choose English or Arabic, and generate 3–60 questions',
    content: el(
      'div',
      { className: 'stack-md' },
      el(
        'div',
        { className: 'stack-xs' },
        el('label', { className: 'field-label' }, 'Choose a Topic Preset or Type Anything'),
        el('div', { className: 'row-wrap' }, ...topicChips),
        topicInput
      ),
      el(
        'div',
        { className: 'stack-xs' },
        el('label', { className: 'field-label', htmlFor: 'ai-quiz-free-prompt' }, 'Custom Free Prompt / Instructions (Optional)'),
        freePromptInput
      ),
      el(
        'div',
        { className: 'stack-xs' },
        el('label', { className: 'field-label' }, 'Number of Questions (up to 60)'),
        el('div', { className: 'row-wrap' }, ...countChips),
        countInput
      ),
      el(
        'div',
        { className: 'grid-2' },
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Student Level (CEFR)'), levelSelect),
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Difficulty & Timer'), diffSelect)
      ),
      el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Language / Quiz Style'), modeSelect),
      statusEl,
      genBtn
    )
  });
}

function openCreateCustomQuizModal() {
  const titleInput = el('input', { type: 'text', className: 'field', placeholder: 'e.g., World Trivia or مسابقة عربية' });
  const topicInput = el('input', { type: 'text', className: 'field', placeholder: 'Topic (e.g., Science, نحو عربي)' });
  const levelSelect = el('select', { className: 'field' }, ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === (store.profile?.learningLevel || 'B1') }, CEFR_LABELS[l] || l)));
  const langSelect = el('select', { className: 'field' }, el('option', { value: 'EN' }, '🇬🇧 English'), el('option', { value: 'AR' }, '🇸🇦 Arabic (العربية)'));

  const questions = [{ prompt: '', options: ['', '', '', ''], correctIndex: 0, tip: '' }];
  const listContainer = el('div', { className: 'stack-md' });

  const renderQuestionsEditor = () => {
    while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
    questions.forEach((q, qi) => {
      const promptInput = el('input', {
        type: 'text',
        className: 'field',
        placeholder: `Question ${qi + 1} prompt`,
        value: q.prompt,
        onInput: (e) => { q.prompt = e.target.value; }
      });
      const optInputs = q.options.map((opt, oi) =>
        el('input', {
          type: 'text',
          className: 'field',
          placeholder: `Option ${oi + 1}${oi === q.correctIndex ? ' (Correct)' : ''}`,
          value: opt,
          onInput: (e) => { q.options[oi] = e.target.value; }
        })
      );
      const correctSel = el(
        'select',
        {
          className: 'field',
          onChange: (e) => { q.correctIndex = Number(e.target.value); }
        },
        ...[0, 1, 2, 3].map((oi) => el('option', { value: String(oi), selected: oi === q.correctIndex }, `Correct: Option ${oi + 1}`))
      );
      const tipInput = el('input', {
        type: 'text',
        className: 'field',
        placeholder: 'Explanation tip (optional)',
        value: q.tip,
        onInput: (e) => { q.tip = e.target.value; }
      });

      listContainer.appendChild(
        el(
          'div',
          { className: 'card stack-sm', style: { background: 'var(--surface-variant)' } },
          el(
            'div',
            { className: 'row-between' },
            el('strong', {}, `Question ${qi + 1}`),
            questions.length > 1
              ? el('button', { type: 'button', className: 'btn btn-danger-soft', onClick: () => { questions.splice(qi, 1); renderQuestionsEditor(); } }, 'Remove')
              : null
          ),
          promptInput,
          el('div', { className: 'grid-2' }, ...optInputs),
          correctSel,
          tipInput
        )
      );
    });
  };
  renderQuestionsEditor();

  openModal({
    title: '📝 Create Custom Quiz',
    subtitle: 'Build up to 60 multiple-choice questions for Solo Blitz or Live Host',
    content: el(
      'div',
      { className: 'stack-md' },
      titleInput,
      el('div', { className: 'grid-2' }, topicInput, levelSelect),
      el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Language'), langSelect),
      listContainer,
      el(
        'div',
        { className: 'row-between' },
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline',
            onClick: () => {
              if (questions.length >= 60) return store.toast('Maximum 60 questions per quiz.');
              questions.push({ prompt: '', options: ['', '', '', ''], correctIndex: 0, tip: '' });
              renderQuestionsEditor();
            }
          },
          '+ Add Question'
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-primary',
            onClick: async () => {
              const title = titleInput.value.trim();
              if (!title) return store.toast('Enter a quiz title.', 'error');
              const diffSec = store.difficultyConfig?.timeLimitSec || 20;
              const validQs = questions
                .map((q) => ({
                  prompt: q.prompt.trim(),
                  options: q.options.map((o) => o.trim()),
                  correctIndex: q.correctIndex,
                  timeLimitSec: diffSec,
                  tip: q.tip.trim()
                }))
                .filter((q) => q.prompt && q.options.every(Boolean));
              if (!validQs.length) return store.toast('Complete at least 1 question with all 4 options.', 'error');
              await store.saveCustomQuiz({
                title,
                topic: topicInput.value.trim() || 'Custom',
                cefrLevel: levelSelect.value,
                language: langSelect.value,
                questions: validQs
              });
              closeModal();
            }
          },
          'Save Quiz'
        )
      )
    )
  });
}

function renderSoloBlitzView() {
  const s = soloState;
  const q = s.questions[s.index];
  const diffCfg = DIFFICULTY_CONFIG[s.difficulty] || store.difficultyConfig;

  if (s.finished) {
    const acc = Math.round((s.correctCount / s.questions.length) * 100);
    return el(
      'div',
      { className: 'card stack-md', style: { textAlign: 'center', padding: '26px' } },
      el('div', { style: { display: 'flex', justifyContent: 'center' } }, createTrophyCanvas({ size: 100 })),
      el('h2', { className: 'display-title' }, 'Blitz Complete!'),
      el('p', { className: 'small muted', style: { margin: 0 } }, `${s.title} · ${diffCfg.label}`),
      el(
        'div',
        { className: 'grid-stats' },
        el('div', { className: 'card card-soft-primary', style: { padding: '12px' } }, el('div', { className: 'card-title mono' }, String(s.score)), el('div', { className: 'xs' }, 'Score')),
        el('div', { className: 'card card-soft-mint', style: { padding: '12px' } }, el('div', { className: 'card-title mono' }, `${acc}%`), el('div', { className: 'xs' }, 'Accuracy')),
        el('div', { className: 'card card-soft-amber', style: { padding: '12px' } }, el('div', { className: 'card-title mono' }, `${s.bestStreak}x`), el('div', { className: 'xs' }, 'Best Streak'))
      ),
      el(
        'div',
        { className: 'row-between' },
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { soloState = null; store.emit('change'); } }, 'Back to Quizzes'),
        el('button', { type: 'button', className: 'btn btn-primary', onClick: () => startSoloBlitz({ title: s.title, cefrLevel: s.cefrLevel, questions: s.questions, difficulty: s.difficulty }) }, 'Play Again')
      )
    );
  }

  const answered = s.selectedIdx !== null;
  const rtlQuestion = isArabicText(q.prompt);
  const advanceNext = async () => {
    if (s.index + 1 >= s.questions.length) {
      stopSoloTimer();
      s.finished = true;
      const acc = Math.round((s.correctCount / s.questions.length) * 100);
      store.confetti();
      await store.awardActivityProgress({
        xpDelta: Math.round(Math.max(20, Math.round(s.score / 30)) * (diffCfg.xpMultiplier || 1)),
        activityType: ActivityType.QUIZ,
        title: s.title,
        cefrLevel: s.cefrLevel,
        score: s.score,
        accuracyPct: acc,
        wordsPracticed: s.questions.length,
        durationMinutes: 3,
        quizzesPlayedDelta: 1,
        bestLiveQuizScoreCandidate: s.score,
        highCombo: s.bestStreak,
        publishLeaderboardMode: 'SOLO_BLITZ'
      });
      store.emit('change');
      return;
    }
    s.index += 1;
    s.selectedIdx = null;
    s.startQuestionTimer();
    store.emit('change');
  };

  return el(
    'div',
    { className: 'stack-md' },
    el(
      'div',
      { className: 'row-between' },
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { stopSoloTimer(); soloState = null; store.emit('change'); } }, '✕ Exit Blitz'),
      el('span', { className: 'badge-pill card-soft-primary mono' }, `Q ${s.index + 1}/${s.questions.length}`),
      el('span', { id: 'solo-timer-pill', className: `badge-pill mono ${s.timeLeft <= 5 ? 'card-soft-secondary' : 'card-soft-amber'}` }, s.timeLeft > 0 ? `⏱ ${s.timeLeft}s` : '⏱ Time Up!')
    ),

    el(
      'div',
      { className: 'row-between small' },
      el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${s.score} · ${diffCfg.short}`),
      el('span', { className: 'mono', style: { fontWeight: '800' } }, `🔥 Streak: ${s.streak}x`)
    ),

    el(
      'div',
      { className: 'card stack-sm' },
      el('div', { className: 'row-between' }, el('span', { className: 'small muted' }, s.title), createCefrBadge(s.cefrLevel)),
      el('h2', { className: `section-title ${rtlQuestion ? 'arabic-text' : ''}`, dir: rtlQuestion ? 'rtl' : 'ltr' }, q.prompt)
    ),

    el(
      'div',
      { className: 'kahoot-grid' },
      ...(q.options || []).map((opt, idx) => {
        const isCorrect = idx === Number(q.correctIndex);
        const isSelected = idx === s.selectedIdx;
        const rtlOpt = isArabicText(opt);
        let extra = '';
        if (answered) {
          extra = isCorrect ? 'selected-ring' : 'dimmed';
        }
        return el(
          'button',
          {
            type: 'button',
            className: `kahoot-tile c-${idx % 4} ${extra}`,
            disabled: answered,
            onClick: () => {
              if (answered) return;
              stopSoloTimer();
              s.selectedIdx = idx;
              const ok = idx === Number(q.correctIndex);
              if (ok) {
                const basePts = computeQuizPointsEarned(true, s.timeLeft, Number(q.timeLimitSec || 20), s.streak);
                const pts = Math.round(basePts * (diffCfg.xpMultiplier || 1));
                s.score += pts;
                s.streak += 1;
                s.bestStreak = Math.max(s.bestStreak, s.streak);
                s.correctCount += 1;
                store.toast(`+${pts} pts!`);
              } else {
                s.streak = 0;
              }
              store.emit('change');
            }
          },
          el('span', { style: { fontSize: '1.2rem' } }, KAHOOT_SHAPES[idx % 4]),
          el('span', { className: `flex-1 ${rtlOpt ? 'arabic-text' : ''}`, dir: rtlOpt ? 'rtl' : 'ltr', style: rtlOpt ? { textAlign: 'right' } : {} }, opt),
          answered && isCorrect ? el('span', {}, '✓') : answered && isSelected ? el('span', {}, '✕') : null
        );
      })
    ),

    answered
      ? el(
          'div',
          { className: `card stack-sm ${s.selectedIdx === Number(q.correctIndex) ? 'card-soft-mint' : 'card-soft-secondary'}` },
          el('div', { className: 'card-title' }, s.selectedIdx === Number(q.correctIndex) ? '🎉 Correct!' : s.selectedIdx === -1 ? '⏱ Time Up!' : '💡 Not quite!'),
          q.tip ? el('p', { className: `small ${isArabicText(q.tip) ? 'arabic-text' : ''}`, dir: isArabicText(q.tip) ? 'rtl' : 'ltr', style: { margin: 0 } }, q.tip) : null,
          el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: advanceNext }, s.index + 1 >= s.questions.length ? 'See Final Score →' : 'Next Question →')
        )
      : null
  );
}

function buildLiveRoomStageNode(s, room) {
  const qIdx = Number(room.currentQuestionIndex || 0);
  const questions = room.questions || [];
  const q = questions[qIdx];
  const players = s.players || [];

  stopRoomTimer();
  let initialLeftSec = Number(q?.timeLimitSec || 20);
  if (room.status === RoomStatus.QUESTION && q) {
    initialLeftSec = store.getLiveRoomTimeRemaining(room, q).leftSec;
    const updateTick = () => {
      const pill = document.getElementById('live-room-timer');
      if (!pill) return;
      const { leftSec } = store.getLiveRoomTimeRemaining(room, q);
      pill.textContent = leftSec > 0 ? `⏱ ${leftSec}s` : '⏱ Time Up!';
      pill.className = `badge-pill mono ${leftSec <= 5 ? 'card-soft-secondary' : 'card-soft-amber'}`;
      if (leftSec <= 0) {
        stopRoomTimer();
        document.querySelectorAll('#live-room-stage .kahoot-tile').forEach((btn) => {
          btn.disabled = true;
        });
      }
    };
    if (initialLeftSec > 0) {
      roomTimerId = setInterval(updateTick, 250);
    }
  }

  return el(
    'div',
    { className: 'stack-md' },
    el(
      'div',
      { className: 'card card-solid-primary row-between', style: { flexWrap: 'wrap' } },
      el(
        'div',
        { className: 'stack-xs' },
        el('span', { className: 'xs', style: { opacity: 0.85 } }, `${s.mode === 'LOCAL' ? 'NEARBY CROSS-TAB ROOM' : 'LIVE CLOUD ROOM'} · ${s.isHost ? 'HOST' : 'PLAYER'}`),
        el('div', { className: 'display-title mono', style: { color: '#FFFFFF', letterSpacing: '0.14em' } }, `PIN: ${s.roomCode}`),
        el('div', { className: 'small' }, `${room.quizTitle} · ${players.length} players`)
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'btn',
          style: { background: 'rgba(255,255,255,0.2)', color: '#FFFFFF' },
          onClick: () => { stopRoomTimer(); store.leaveLiveRoom(); }
        },
        s.isHost ? 'End Room (Kick All)' : 'Leave Room'
      )
    ),

    room.status === RoomStatus.LOBBY
      ? el(
          'div',
          { className: 'card stack-md' },
          el('h2', { className: 'section-title' }, 'Waiting in Lobby...'),
          el('p', { className: 'small muted', style: { margin: 0 } }, store.isOfflineMode ? 'Open a second tab in Offline Explorer and enter this 6-character PIN to play live across tabs! Leaving as host closes the room for everyone.' : 'Share the 6-character PIN with classmates to join from Android or Web. Leaving as host ends the room and removes all players.'),
          el(
            'div',
            { className: 'row-wrap' },
            players.length === 0
              ? el('span', { className: 'small muted' }, 'No players joined yet (Host can start anytime or join from another device/tab).')
              : players.map((pl) =>
                  el('span', { className: 'badge-pill', style: { background: avatarColorForTag(pl.avatarColor), color: '#FFFFFF', padding: '6px 12px' } }, `${pl.nickname}`)
                )
          ),
          s.isHost
            ? el('button', { type: 'button', className: 'btn btn-mint btn-full', onClick: () => store.advanceLiveRoomPhase(RoomStatus.QUESTION, 0) }, '▶ Start Question 1')
            : null
        )
      : null,

    (room.status === RoomStatus.QUESTION || room.status === RoomStatus.REVEAL) && q
      ? el(
          'div',
          { className: 'stack-md' },
          el(
            'div',
            { className: 'row-between' },
            el('span', { className: 'badge-pill card-soft-primary mono' }, `Question ${qIdx + 1} / ${questions.length}`),
            room.status === RoomStatus.QUESTION
              ? el('span', { id: 'live-room-timer', className: `badge-pill mono ${initialLeftSec <= 5 ? 'card-soft-secondary' : 'card-soft-amber'}` }, initialLeftSec > 0 ? `⏱ ${initialLeftSec}s` : '⏱ Time Up!')
              : el('span', { className: 'badge-pill card-soft-mint' }, 'Answer Revealed')
          ),
          el('div', { className: 'card' }, el('h2', { className: `section-title ${isArabicText(q.prompt) ? 'arabic-text' : ''}`, dir: isArabicText(q.prompt) ? 'rtl' : 'ltr' }, q.prompt)),
          el(
            'div',
            { className: 'kahoot-grid' },
            ...(q.options || []).map((opt, idx) => {
              const already = s.answeredQuestionIndex === qIdx;
              const isReveal = room.status === RoomStatus.REVEAL;
              const timedOut = room.status === RoomStatus.QUESTION && initialLeftSec <= 0;
              const isCorrect = idx === Number(q.correctIndex);
              const rtlOpt = isArabicText(opt);
              let cls = '';
              if (isReveal) cls = isCorrect ? 'selected-ring' : 'dimmed';
              else if (already) cls = s.selectedOptionIndex === idx ? 'selected-ring' : 'dimmed';
              return el(
                'button',
                {
                  type: 'button',
                  className: `kahoot-tile c-${idx % 4} ${cls}`,
                  disabled: already || isReveal || timedOut,
                  onClick: () => store.submitLiveAnswer(idx)
                },
                el('span', {}, KAHOOT_SHAPES[idx % 4]),
                el('span', { className: `flex-1 ${rtlOpt ? 'arabic-text' : ''}`, dir: rtlOpt ? 'rtl' : 'ltr', style: rtlOpt ? { textAlign: 'right' } : {} }, opt),
                isReveal && isCorrect ? el('span', {}, '✓') : null
              );
            })
          ),
          room.status === RoomStatus.REVEAL && q.tip
            ? el('div', { className: `card card-soft-mint small ${isArabicText(q.tip) ? 'arabic-text' : ''}`, dir: isArabicText(q.tip) ? 'rtl' : 'ltr' }, `💡 ${q.tip}`)
            : null,
          s.isHost
            ? el(
                'div',
                { className: 'row' },
                room.status === RoomStatus.QUESTION
                  ? el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: () => store.advanceLiveRoomPhase(RoomStatus.REVEAL, qIdx) }, 'Reveal Answer')
                  : el(
                      'button',
                      {
                        type: 'button',
                        className: 'btn btn-mint btn-full',
                        onClick: () => {
                          if (qIdx + 1 >= questions.length) store.advanceLiveRoomPhase(RoomStatus.PODIUM, qIdx);
                          else store.advanceLiveRoomPhase(RoomStatus.QUESTION, qIdx + 1);
                        }
                      },
                      qIdx + 1 >= questions.length ? '🏆 Show Final Podium' : 'Next Question →'
                    )
              )
            : null
        )
      : null,

    room.status === RoomStatus.PODIUM
      ? el(
          'div',
          { className: 'card stack-md', style: { textAlign: 'center' } },
          el('div', { style: { display: 'flex', justifyContent: 'center' } }, createTrophyCanvas({ size: 96 })),
          el('h2', { className: 'display-title' }, '🏆 Live Clash Podium'),
          el(
            'div',
            { className: 'stack-sm' },
            ...(room.leaderboard?.length ? room.leaderboard : players).slice(0, 10).map((entry, idx) =>
              el(
                'div',
                { className: 'card row-between', style: { background: 'var(--surface-variant)' } },
                el('span', { className: 'card-title' }, `#${idx + 1} ${entry.nickname}`),
                el('span', { className: 'mono', style: { fontWeight: '800' } }, `${entry.score || 0} pts`)
              )
            )
          )
        )
      : null
  );
}

function buildLiveRoomMessagesNodes(roomMessages) {
  return (roomMessages || []).slice(-10).map((m) =>
    el('div', { className: `small ${isArabicText(m.text) ? 'arabic-text' : ''}` }, el('strong', {}, `${m.senderName}: `), m.text)
  );
}

export function patchQuizArenaLiveRoom() {
  const shell = document.getElementById('live-room-shell');
  if (!shell || !store.roomSession?.room) return false;
  const s = store.roomSession;
  const stage = document.getElementById('live-room-stage');
  if (stage) {
    clearEl(stage);
    stage.appendChild(buildLiveRoomStageNode(s, s.room));
  }
  const msgCount = document.getElementById('live-room-chat-count');
  if (msgCount) {
    msgCount.textContent = `${(s.roomMessages || []).length} messages`;
  }
  const msgList = document.getElementById('live-room-chat-list');
  if (msgList) {
    clearEl(msgList);
    buildLiveRoomMessagesNodes(s.roomMessages).forEach((n) => msgList.appendChild(n));
    msgList.scrollTop = msgList.scrollHeight;
  }
  const input = document.getElementById('live-room-chat-input');
  if (input && input.value !== roomChatDraft) {
    input.value = roomChatDraft;
  }
  return true;
}

function renderLiveRoomView() {
  const s = store.roomSession;
  const room = s.room;
  if (!room) {
    return el(
      'div',
      { className: 'card stack-md' },
      el('h2', { className: 'section-title' }, `Connecting to Room ${s.roomCode}...`),
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { stopRoomTimer(); store.leaveLiveRoom(); } }, 'Leave Room')
    );
  }

  const msgInput = el('input', {
    id: 'live-room-chat-input',
    type: 'text',
    className: 'field flex-1',
    placeholder: 'Send cheer or chat...',
    value: roomChatDraft,
    autocomplete: 'off',
    onInput: (e) => {
      roomChatDraft = e.target.value;
    }
  });

  const sendRoomChat = () => {
    const val = (msgInput.value || '').trim();
    if (!val) return;
    msgInput.value = '';
    roomChatDraft = '';
    store.sendLiveRoomMessage(val, 'TEXT');
    msgInput.focus({ preventScroll: true });
  };

  const chatBox = el(
    'div',
    { className: 'card stack-sm' },
    el('div', { className: 'row-between' }, el('strong', {}, '💬 Room Cheers & Chat'), el('span', { id: 'live-room-chat-count', className: 'xs muted' }, `${(s.roomMessages || []).length} messages`)),
    el(
      'div',
      { className: 'scroll-x' },
      ...['🔥 Let’s go!', '👏 Nice!', '⚡ Fast!', '🤔 سؤال رائع!'].map((rx) =>
        el('button', { type: 'button', className: 'chip', onClick: () => store.sendLiveRoomMessage(rx, 'REACTION') }, rx)
      )
    ),
    el(
      'div',
      { id: 'live-room-chat-list', className: 'stack-xs', style: { maxHeight: '140px', overflowY: 'auto' } },
      ...buildLiveRoomMessagesNodes(s.roomMessages)
    ),
    el(
      'form',
      {
        id: 'live-room-chat-form',
        className: 'row',
        onSubmit: (e) => {
          e.preventDefault();
          sendRoomChat();
        }
      },
      msgInput,
      el('button', { type: 'submit', className: 'btn btn-soft', onMouseDown: (e) => e.preventDefault() }, 'Send')
    )
  );

  return el(
    'div',
    { id: 'live-room-shell', className: 'stack-md' },
    el('div', { id: 'live-room-stage' }, buildLiveRoomStageNode(s, room)),
    chatBox
  );
}

export function renderQuizArenaView({ navigate }) {
  if (store.roomSession) {
    return el(
      'div',
      { className: 'stack-md' },
      el('div', { className: 'row-between' }, el('h1', { className: 'display-title' }, '⚡ Live Quiz Room'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')),
      renderLiveRoomView()
    );
  }
  stopRoomTimer();

  if (soloState) {
    return el(
      'div',
      { className: 'stack-md' },
      renderSoloBlitzView()
    );
  }

  const cefrFilter = store.selectedCefrFilter;
  const activeDiff = store.selectedDifficulty || 'MEDIUM';
  const pinInput = el('input', { type: 'text', className: 'field mono flex-1', placeholder: 'Room PIN (e.g. X9K2M4)', maxLength: 6, style: { textTransform: 'uppercase' } });
  const nickInput = el('input', { type: 'text', className: 'field flex-1', placeholder: 'Nickname', value: store.currentUserName, maxLength: 24 });
  let selectedAvatar = 'INDIGO';

  const matchesLang = (pack) => {
    if (quizLanguageFilter === 'ALL') return true;
    const isAr = pack.language === 'AR' || isArabicText(pack.title) || isArabicText(pack.questions?.[0]?.prompt);
    return quizLanguageFilter === 'AR' ? isAr : !isAr;
  };

  const clubQuizzes = (store.clubContent || []).filter((c) => c.contentType === 'QUIZ' && (!cefrFilter || c.cefrLevel === cefrFilter) && matchesLang(c));
  const customQuizzes = (store.customQuizzes || []).filter((q) => (!cefrFilter || q.cefrLevel === cefrFilter) && matchesLang(q));
  const englishPacks = QUIZ_PACKS.map((p) => ({ ...p, language: p.language || 'EN' })).filter((p) => (!cefrFilter || p.cefrLevel === cefrFilter) && matchesLang(p));
  const arabicPacks = ARABIC_QUIZ_PACKS.filter((p) => (!cefrFilter || p.cefrLevel === cefrFilter) && matchesLang(p));

  const renderQuizPackCard = (pack, { isCustom = false, isClub = false } = {}) => {
    const isAr = pack.language === 'AR' || isArabicText(pack.title);
    const diffSec = store.difficultyConfig?.timeLimitSec || 20;
    const scaledQuestions = (pack.questions || []).map((q) => ({ ...q, timeLimitSec: resolveQuestionLimitSec(q, activeDiff) }));
    return el(
      'div',
      { className: 'card stack-sm' },
      el(
        'div',
        { className: 'row-between' },
        el('div', { className: `card-title flex-1 ${isAr ? 'arabic-text' : ''}`, dir: isAr ? 'rtl' : 'ltr' }, pack.title),
        el('div', { className: 'row', style: { gap: '4px' } }, isAr ? el('span', { className: 'badge-pill card-soft-amber' }, '🇸🇦 AR') : null, createCefrBadge(pack.cefrLevel || 'B1'))
      ),
      el('p', { className: 'small muted', style: { margin: 0 } }, `${pack.topic || 'General'} · ${scaledQuestions.length} Qs · ⏱ ${diffSec}s/Q${isClub ? ' · Official Club' : ''}`),
      el(
        'div',
        { className: 'row-wrap' },
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-primary flex-1',
            onClick: () => startSoloBlitz({ title: pack.title, cefrLevel: pack.cefrLevel, questions: scaledQuestions, difficulty: activeDiff })
          },
          '⚡ Solo Blitz'
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-mint flex-1',
            onClick: async () => {
              try {
                await store.hostQuizRoom({
                  quizTitle: pack.title,
                  cefrLevel: pack.cefrLevel || 'B1',
                  questions: scaledQuestions
                });
              } catch (err) {
                store.toast(err.message, 'error');
              }
            }
          },
          '🎙️ Host PIN'
        ),
        isCustom
          ? el(
              'button',
              {
                type: 'button',
                className: 'btn btn-danger-soft',
                onClick: () => store.deleteCustomQuiz(pack.id)
              },
              '🗑'
            )
          : null
      )
    );
  };

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '⚡ Quiz Arena'),
      el(
        'div',
        { className: 'row' },
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('leaderboard') }, '🏆 Ranks'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
      )
    ),

    // Hero Banner
    el(
      'div',
      { className: 'hero-banner' },
      el(
        'div',
        { className: 'hero-banner-media', style: { height: '140px' } },
        el('img', { src: './assets/img_quiz_arena.jpg', alt: 'Quiz Arena Stage' }),
        el('div', { className: 'hero-banner-overlay' }),
        el(
          'div',
          { style: { position: 'absolute', bottom: '12px', left: '16px', right: '16px' } },
          el('h2', { className: 'section-title', style: { color: '#FFFFFF' } }, 'Kahoot-Style Bilingual Clash'),
          el('p', { className: 'small', style: { margin: 0, color: 'rgba(255,255,255,0.9)' } }, 'English & Arabic quizzes, AI free-prompt generation (3–60 Qs), live PIN rooms & Solo Blitz!')
        )
      )
    ),

    // Language Section Tabs & Difficulty Selector
    el(
      'div',
      { className: 'card stack-sm' },
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap' } },
        el(
          'div',
          { className: 'row-wrap' },
          ...[
            { id: 'ALL', label: '🌐 All Quizzes' },
            { id: 'EN', label: '🇬🇧 English' },
            { id: 'AR', label: '🇸🇦 Arabic (العربية)' }
          ].map((tab) =>
            el('button', {
              type: 'button',
              className: `chip ${quizLanguageFilter === tab.id ? 'selected' : ''}`,
              onClick: () => { quizLanguageFilter = tab.id; store.emit('change'); }
            }, tab.label)
          )
        ),
        el(
          'div',
          { className: 'row-wrap' },
          ...DIFFICULTY_LEVELS.map((d) =>
            el('button', {
              type: 'button',
              className: `chip ${activeDiff === d ? 'selected' : ''}`,
              onClick: () => store.setDifficulty(d)
            }, DIFFICULTY_CONFIG[d].label)
          )
        )
      )
    ),

    // Join Room Card
    el(
      'div',
      { className: 'card stack-sm' },
      el('div', { className: 'card-title' }, '🎮 Join a Live Room'),
      el('div', { className: 'grid-2' }, pinInput, nickInput),
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap' } },
        el(
          'div',
          { className: 'row', style: { gap: '8px' } },
          el('span', { className: 'xs muted' }, 'Badge Color:'),
          ...AVATAR_TAGS.map((tag) =>
            el('button', {
              type: 'button',
              'aria-label': `Select ${tag} color`,
              style: {
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: selectedAvatar === tag ? '3px solid var(--ink)' : '2px solid #FFFFFF',
                background: avatarColorForTag(tag),
                cursor: 'pointer'
              },
              onClick: (e) => {
                selectedAvatar = tag;
                [...e.currentTarget.parentElement.querySelectorAll('button')].forEach((b) => (b.style.border = '2px solid #FFFFFF'));
                e.currentTarget.style.border = '3px solid var(--ink)';
              }
            })
          )
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-primary',
            onClick: async () => {
              try {
                await store.joinQuizRoom({
                  roomCode: pinInput.value,
                  nickname: nickInput.value,
                  avatarColor: selectedAvatar
                });
              } catch (err) {
                store.toast(err.message, 'error');
              }
            }
          },
          'Join PIN →'
        )
      )
    ),

    // Studio Actions
    el(
      'div',
      { className: 'grid-2' },
      el('button', { type: 'button', className: 'btn btn-soft btn-full', onClick: openAiQuizGeneratorModal }, '✨ Generate AI Quiz (Free Prompt)'),
      el('button', { type: 'button', className: 'btn btn-outline btn-full', onClick: openCreateCustomQuizModal }, '📝 Create Custom Quiz')
    ),

    clubQuizzes.length
      ? el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, '🎓 Official Club Quizzes'), el('div', { className: 'grid-2' }, ...clubQuizzes.map((c) => renderQuizPackCard(c, { isClub: true }))))
      : null,

    customQuizzes.length
      ? el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, '📁 My Custom Quizzes'), el('div', { className: 'grid-2' }, ...customQuizzes.map((q) => renderQuizPackCard(q, { isCustom: true }))))
      : null,

    arabicPacks.length
      ? el(
          'div',
          { className: 'stack-sm' },
          el('h2', { className: 'section-title' }, `🇸🇦 مسابقة اللغة العربية — Arabic Quizzes (${arabicPacks.length})`),
          el('div', { className: 'grid-2' }, ...arabicPacks.map((p) => renderQuizPackCard(p)))
        )
      : null,

    englishPacks.length
      ? el(
          'div',
          { className: 'stack-sm' },
          el('h2', { className: 'section-title' }, `🇬🇧 English Quiz Packs (${englishPacks.length})`),
          el('div', { className: 'grid-2' }, ...englishPacks.map((p) => renderQuizPackCard(p)))
        )
      : null
  );
}
