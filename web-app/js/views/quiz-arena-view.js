// Quiz Arena View — Live Kahoot PIN Rooms, Solo Blitz, AI Generator & Custom Builder
// (1:1 port of QuizArenaScreen.kt)

import {
  ActivityType,
  CEFR_LEVELS,
  RoomStatus,
  avatarColorForTag,
  computeQuizPointsEarned,
  el,
  prepareDynamicQuizQuestions
} from '../models.js';
import { QUIZ_PACKS } from '../data/curated-content.js';
import { aiService } from '../services/ai-service.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openModal, closeModal } from '../components/ui-shared.js';
import { createTrophyCanvas } from '../components/canvas-3d.js';

const KAHOOT_SHAPES = ['▲', '◆', '●', '■'];
const AVATAR_TAGS = ['INDIGO', 'CORAL', 'AMBER', 'MINT'];

let soloState = null; // { title, cefrLevel, questions, index, score, streak, bestStreak, correctCount, selectedIdx, timeLeft, timerId, finished }
let roomTimerId = null;

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

function startSoloBlitz({ title, cefrLevel, questions }) {
  stopSoloTimer();
  const prepared = prepareDynamicQuizQuestions(questions).slice(0, 60);
  if (!prepared.length) {
    store.toast('This quiz has no questions yet.', 'error');
    return;
  }
  soloState = {
    title,
    cefrLevel: cefrLevel || 'B1',
    questions: prepared,
    index: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    selectedIdx: null,
    timeLeft: Number(prepared[0].timeLimitSec || 20),
    timerId: null,
    finished: false
  };

  const startQuestionTimer = () => {
    stopSoloTimer();
    soloState.timerId = setInterval(() => {
      if (!soloState || soloState.finished || soloState.selectedIdx !== null) return;
      soloState.timeLeft = Math.max(0, soloState.timeLeft - 1);
      const timerEl = document.getElementById('solo-timer-pill');
      if (timerEl) timerEl.textContent = `⏱ ${soloState.timeLeft}s`;
      if (soloState.timeLeft <= 0) {
        soloState.selectedIdx = -1; // Timed out
        soloState.streak = 0;
        stopSoloTimer();
        store.emit('change');
      }
    }, 1000);
  };

  soloState.startQuestionTimer = startQuestionTimer;
  startQuestionTimer();
  store.emit('change');
}

const AI_TOPIC_PRESETS = [
  'General Knowledge & Facts',
  'Science & Space',
  'World History & Geography',
  'Technology & AI',
  'Animals & Nature',
  'Sports & Pop Culture',
  'Everyday Conversations',
  'Travel & Airports',
  'Business & Job Interviews',
  'English Grammar & Idioms',
  'Arabic–English Vocabulary'
];

function openAiQuizGeneratorModal() {
  const topicInput = el('input', {
    type: 'text',
    className: 'field',
    placeholder: 'Type ANY topic (e.g. General Facts, Football, Space, Cooking...)',
    value: 'General Knowledge & Facts'
  });
  const levelSelect = el(
    'select',
    { className: 'field' },
    ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === (store.profile?.learningLevel || 'B1') }, l))
  );
  const modeSelect = el(
    'select',
    { className: 'field' },
    el('option', { value: 'AUTO', selected: true }, 'Auto (Match Topic)'),
    el('option', { value: 'GENERAL' }, 'General Facts & Trivia'),
    el('option', { value: 'VOCAB' }, 'English & Arabic Vocab')
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
        className: `chip ${preset === 'General Knowledge & Facts' ? 'selected' : ''}`,
        dataset: { topic: preset },
        onClick: () => {
          topicInput.value = preset;
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
            questionCount: requestedCount,
            quizMode: modeSelect.value,
            onProgress: (msg) => {
              statusEl.textContent = msg;
            }
          });
          await store.saveCustomQuiz(draft);
          closeModal();
          startSoloBlitz(draft);
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
    subtitle: 'Pick any topic (general facts, science, history, English) and generate 3 to 60 questions',
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
        el('label', { className: 'field-label' }, 'Number of Questions (up to 60)'),
        el('div', { className: 'row-wrap' }, ...countChips),
        countInput
      ),
      el(
        'div',
        { className: 'grid-2' },
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'CEFR Level'), levelSelect),
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Quiz Style'), modeSelect)
      ),
      statusEl,
      genBtn
    )
  });
}

function openCreateCustomQuizModal() {
  const titleInput = el('input', { type: 'text', className: 'field', placeholder: 'e.g., World Trivia or Phrasal Verbs' });
  const topicInput = el('input', { type: 'text', className: 'field', placeholder: 'Topic (e.g., Science, Verbs)' });
  const levelSelect = el('select', { className: 'field' }, ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === 'B1' }, l)));

  const questions = [
    { prompt: '', options: ['', '', '', ''], correctIndex: 0, tip: '' }
  ];
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
              const validQs = questions
                .map((q) => ({
                  prompt: q.prompt.trim(),
                  options: q.options.map((o) => o.trim()),
                  correctIndex: q.correctIndex,
                  timeLimitSec: 20,
                  tip: q.tip.trim()
                }))
                .filter((q) => q.prompt && q.options.every(Boolean));
              if (!validQs.length) return store.toast('Complete at least 1 question with all 4 options.', 'error');
              await store.saveCustomQuiz({
                title,
                topic: topicInput.value.trim() || 'Custom',
                cefrLevel: levelSelect.value,
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

  if (s.finished) {
    const acc = Math.round((s.correctCount / s.questions.length) * 100);
    return el(
      'div',
      { className: 'card stack-md', style: { textAlign: 'center', padding: '26px' } },
      el('div', { style: { display: 'flex', justifyContent: 'center' } }, createTrophyCanvas({ size: 100 })),
      el('h2', { className: 'display-title' }, 'Blitz Complete!'),
      el('p', { className: 'small muted', style: { margin: 0 } }, s.title),
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
        el('button', { type: 'button', className: 'btn btn-primary', onClick: () => startSoloBlitz({ title: s.title, cefrLevel: s.cefrLevel, questions: s.questions }) }, 'Play Again')
      )
    );
  }

  const answered = s.selectedIdx !== null;
  const advanceNext = async () => {
    if (s.index + 1 >= s.questions.length) {
      stopSoloTimer();
      s.finished = true;
      const acc = Math.round((s.correctCount / s.questions.length) * 100);
      store.confetti();
      await store.awardActivityProgress({
        xpDelta: Math.max(20, Math.round(s.score / 30)),
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
    s.timeLeft = Number(s.questions[s.index].timeLimitSec || 20);
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
      el('span', { id: 'solo-timer-pill', className: 'badge-pill card-soft-amber mono' }, `⏱ ${s.timeLeft}s`)
    ),

    el(
      'div',
      { className: 'row-between small' },
      el('span', { className: 'mono', style: { fontWeight: '800' } }, `Score: ${s.score}`),
      el('span', { className: 'mono', style: { fontWeight: '800' } }, `🔥 Streak: ${s.streak}x`)
    ),

    el(
      'div',
      { className: 'card stack-sm' },
      el('div', { className: 'row-between' }, el('span', { className: 'small muted' }, s.title), createCefrBadge(s.cefrLevel)),
      el('h2', { className: 'section-title' }, q.prompt)
    ),

    el(
      'div',
      { className: 'kahoot-grid' },
      ...(q.options || []).map((opt, idx) => {
        const isCorrect = idx === Number(q.correctIndex);
        const isSelected = idx === s.selectedIdx;
        let extra = '';
        if (answered) {
          if (isCorrect) extra = 'selected-ring';
          else extra = 'dimmed';
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
                const pts = computeQuizPointsEarned(true, s.timeLeft, Number(q.timeLimitSec || 20), s.streak);
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
          el('span', { className: 'flex-1' }, opt),
          answered && isCorrect ? el('span', {}, '✓') : answered && isSelected ? el('span', {}, '✕') : null
        );
      })
    ),

    answered
      ? el(
          'div',
          { className: `card stack-sm ${s.selectedIdx === Number(q.correctIndex) ? 'card-soft-mint' : 'card-soft-secondary'}` },
          el('div', { className: 'card-title' }, s.selectedIdx === Number(q.correctIndex) ? '🎉 Correct!' : s.selectedIdx === -1 ? '⏱ Time Up!' : '💡 Not quite!'),
          q.tip ? el('p', { className: 'small', style: { margin: 0 } }, q.tip) : null,
          el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: advanceNext }, s.index + 1 >= s.questions.length ? 'See Final Score →' : 'Next Question →')
        )
      : null
  );
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

  const qIdx = Number(room.currentQuestionIndex || 0);
  const questions = room.questions || [];
  const q = questions[qIdx];
  const players = s.players || [];
  const msgInput = el('input', { type: 'text', className: 'field flex-1', placeholder: 'Send cheer or chat...' });

  // Live question countdown updater
  stopRoomTimer();
  if (room.status === RoomStatus.QUESTION && q) {
    const updateTick = () => {
      const pill = document.getElementById('live-room-timer');
      if (!pill) return;
      const elapsed = (Date.now() - Number(room.questionStartedAtMs || Date.now())) / 1000;
      const left = Math.max(0, Math.ceil(Number(q.timeLimitSec || 20) - elapsed));
      pill.textContent = `⏱ ${left}s`;
    };
    roomTimerId = setInterval(updateTick, 500);
  }

  const chatBox = el(
    'div',
    { className: 'card stack-sm' },
    el('div', { className: 'row-between' }, el('strong', {}, '💬 Room Cheers & Chat'), el('span', { className: 'xs muted' }, `${(s.roomMessages || []).length} messages`)),
    el(
      'div',
      { className: 'scroll-x' },
      ...['🔥 Let’s go!', '👏 Nice!', '⚡ Fast!', '🤔 Tough one!'].map((rx) =>
        el('button', { type: 'button', className: 'chip', onClick: () => store.sendLiveRoomMessage(rx, 'REACTION') }, rx)
      )
    ),
    (s.roomMessages || []).length
      ? el(
          'div',
          { className: 'stack-xs', style: { maxHeight: '140px', overflowY: 'auto' } },
          ...(s.roomMessages || []).slice(-8).map((m) =>
            el('div', { className: 'small' }, el('strong', {}, `${m.senderName}: `), m.text)
          )
        )
      : null,
    el(
      'form',
      {
        className: 'row',
        onSubmit: (e) => {
          e.preventDefault();
          if (!msgInput.value.trim()) return;
          store.sendLiveRoomMessage(msgInput.value, 'TEXT');
          msgInput.value = '';
        }
      },
      msgInput,
      el('button', { type: 'submit', className: 'btn btn-soft' }, 'Send')
    )
  );

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
        'Leave Room'
      )
    ),

    // LOBBY
    room.status === RoomStatus.LOBBY
      ? el(
          'div',
          { className: 'card stack-md' },
          el('h2', { className: 'section-title' }, 'Waiting in Lobby...'),
          el('p', { className: 'small muted', style: { margin: 0 } }, store.isOfflineMode ? 'Open a second tab in Offline Explorer and enter this 6-character PIN to play live across tabs!' : 'Share the 6-character PIN with classmates to join from Android or Web.'),
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

    // QUESTION or REVEAL
    (room.status === RoomStatus.QUESTION || room.status === RoomStatus.REVEAL) && q
      ? el(
          'div',
          { className: 'stack-md' },
          el(
            'div',
            { className: 'row-between' },
            el('span', { className: 'badge-pill card-soft-primary mono' }, `Question ${qIdx + 1} / ${questions.length}`),
            room.status === RoomStatus.QUESTION
              ? el('span', { id: 'live-room-timer', className: 'badge-pill card-soft-amber mono' }, `⏱ ${q.timeLimitSec || 20}s`)
              : el('span', { className: 'badge-pill card-soft-mint' }, 'Answer Revealed')
          ),
          el('div', { className: 'card' }, el('h2', { className: 'section-title' }, q.prompt)),
          el(
            'div',
            { className: 'kahoot-grid' },
            ...(q.options || []).map((opt, idx) => {
              const already = s.answeredQuestionIndex === qIdx;
              const isReveal = room.status === RoomStatus.REVEAL;
              const isCorrect = idx === Number(q.correctIndex);
              let cls = '';
              if (isReveal) cls = isCorrect ? 'selected-ring' : 'dimmed';
              else if (already) cls = s.selectedOptionIndex === idx ? 'selected-ring' : 'dimmed';
              return el(
                'button',
                {
                  type: 'button',
                  className: `kahoot-tile c-${idx % 4} ${cls}`,
                  disabled: already || isReveal,
                  onClick: () => store.submitLiveAnswer(idx)
                },
                el('span', {}, KAHOOT_SHAPES[idx % 4]),
                el('span', { className: 'flex-1' }, opt),
                isReveal && isCorrect ? el('span', {}, '✓') : null
              );
            })
          ),
          room.status === RoomStatus.REVEAL && q.tip
            ? el('div', { className: 'card card-soft-mint small' }, `💡 ${q.tip}`)
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

    // PODIUM
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
      : null,

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

  if (soloState) {
    return el(
      'div',
      { className: 'stack-md' },
      renderSoloBlitzView()
    );
  }

  const cefrFilter = store.selectedCefrFilter;
  const pinInput = el('input', { type: 'text', className: 'field mono flex-1', placeholder: 'Room PIN (e.g. X9K2M4)', maxLength: 6, style: { textTransform: 'uppercase' } });
  const nickInput = el('input', { type: 'text', className: 'field flex-1', placeholder: 'Nickname', value: store.currentUserName, maxLength: 24 });
  let selectedAvatar = 'INDIGO';

  const clubQuizzes = (store.clubContent || []).filter((c) => c.contentType === 'QUIZ' && (!cefrFilter || c.cefrLevel === cefrFilter));
  const customQuizzes = (store.customQuizzes || []).filter((q) => !cefrFilter || q.cefrLevel === cefrFilter);
  const curatedPacks = QUIZ_PACKS.filter((p) => !cefrFilter || p.cefrLevel === cefrFilter);

  const renderQuizPackCard = (pack, { isCustom = false, isClub = false } = {}) =>
    el(
      'div',
      { className: 'card stack-sm' },
      el(
        'div',
        { className: 'row-between' },
        el('div', { className: 'card-title flex-1' }, pack.title),
        createCefrBadge(pack.cefrLevel || 'B1')
      ),
      el('p', { className: 'small muted', style: { margin: 0 } }, `${pack.topic || 'General'} · ${(pack.questions || []).length} questions${isClub ? ' · Official Club' : ''}`),
      el(
        'div',
        { className: 'row-wrap' },
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-primary flex-1',
            onClick: () => startSoloBlitz({ title: pack.title, cefrLevel: pack.cefrLevel, questions: pack.questions })
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
                  questions: pack.questions
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
          el('p', { className: 'small', style: { margin: 0, color: 'rgba(255,255,255,0.9)' } }, 'Speed bonus + combo streaks. Host live PIN rooms or race Solo Blitz!')
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
          ...AVATAR_TAGS.map((tag) => {
            const btn = el('button', {
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
            });
            return btn;
          })
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
      el('button', { type: 'button', className: 'btn btn-soft btn-full', onClick: openAiQuizGeneratorModal }, '✨ Generate AI Quiz'),
      el('button', { type: 'button', className: 'btn btn-outline btn-full', onClick: openCreateCustomQuizModal }, '📝 Create Custom Quiz')
    ),

    clubQuizzes.length
      ? el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, '🎓 Official Club Quizzes'), el('div', { className: 'grid-2' }, ...clubQuizzes.map((c) => renderQuizPackCard(c, { isClub: true }))))
      : null,

    customQuizzes.length
      ? el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, '📁 My Custom Quizzes'), el('div', { className: 'grid-2' }, ...customQuizzes.map((q) => renderQuizPackCard(q, { isCustom: true }))))
      : null,

    el(
      'div',
      { className: 'stack-sm' },
      el('h2', { className: 'section-title' }, `📚 Curated Quiz Packs (${curatedPacks.length})`),
      el('div', { className: 'grid-2' }, ...curatedPacks.map((p) => renderQuizPackCard(p)))
    )
  );
}
