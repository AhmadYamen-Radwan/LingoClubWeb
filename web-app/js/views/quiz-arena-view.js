// Quiz Arena View — Live Kahoot PIN Rooms, Solo Blitz, AI Generator (w/ Free Prompt & 3-60 Qs),
// Explorer Difficulty, CSV Export/Import & Bilingual English + Arabic Quiz Packs

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
import { audioService } from '../services/audio-service.js';
import { downloadQuizCsv, parseKahootCsv } from '../services/csv-quiz.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openModal, closeModal } from '../components/ui-shared.js';
import { createTrophyCanvas } from '../components/canvas-3d.js';
import { createLiveQuizGeneratorComponent } from '../components/live-quiz-generator.js';
import { createStickerBubbleNode, createStickerTray, parseStickerMessage } from '../components/stickers.js';

const KAHOOT_SHAPES = ['▲', '◆', '●', '■'];
const AVATAR_TAGS = ['INDIGO', 'CORAL', 'AMBER', 'MINT'];

let soloState = null; // { title, cefrLevel, difficulty, questions, index, score, streak, bestStreak, correctCount, selectedIdx, timeLeft, timerId, finished }
let roomTimerId = null;
let quizLanguageFilter = 'ALL'; // 'ALL' | 'EN' | 'AR'
let roomChatDraft = '';
let roomStickerDrawerOpen = false;

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
  'ألغاز الجرائم والتحقيق (Arabic Crime Mysteries)',
  'حقائق العلوم والفضاء (Arabic Science & Space)',
  'تاريخ وحضارات وعجائب العالم (Arabic History)',
  'Science & Space',
  'World History & Geography',
  'Technology & AI',
  'Animals & Nature',
  'Sports & Pop Culture',
  'Everyday Conversations',
  'English Idioms & Expressions',
  'Arabic–English Vocabulary'
];

function openAiQuizGeneratorModal({ prefillQuiz = null } = {}) {
  const initialTopic =
    prefillQuiz?.topic ||
    (quizLanguageFilter === 'AR' ? 'ألغاز الجرائم والتحقيق (Arabic Crime Mysteries)' : 'General Knowledge & Facts');
  const topicInput = el('input', {
    type: 'text',
    className: 'field',
    placeholder: 'Type ANY topic (e.g. General Facts, Crime Mysteries, حقائق الفضاء...)',
    value: initialTopic
  });
  const freePromptInput = el('textarea', {
    id: 'ai-quiz-free-prompt',
    className: 'field',
    rows: 3,
    placeholder: 'Free prompt instructions: e.g. "Focus on tricky real-world examples, add hints in Arabic, or ask about 1990s World Cup facts..."',
    value: prefillQuiz?.customPrompt || ''
  });
  freePromptInput.value = prefillQuiz?.customPrompt || '';

  const levelSelect = el(
    'select',
    { className: 'field' },
    ...CEFR_LEVELS.map((l) =>
      el('option', { value: l, selected: l === (prefillQuiz?.cefrLevel || store.profile?.learningLevel || 'B1') }, CEFR_LABELS[l] || l)
    )
  );
  const diffSelect = el(
    'select',
    { className: 'field' },
    ...DIFFICULTY_LEVELS.map((d) =>
      el(
        'option',
        { value: d, selected: d === (prefillQuiz?.difficulty || store.selectedDifficulty || 'MEDIUM') },
        `${DIFFICULTY_CONFIG[d].label} (${DIFFICULTY_CONFIG[d].timeLimitSec}s/Q)`
      )
    )
  );
  const defaultMode =
    prefillQuiz?.language === 'AR' || quizLanguageFilter === 'AR' ? 'ARABIC' : 'AUTO';
  const modeSelect = el(
    'select',
    { className: 'field' },
    el('option', { value: 'AUTO', selected: defaultMode === 'AUTO' }, 'Auto (Match Topic & Prompt)'),
    el('option', { value: 'GENERAL' }, 'General Facts & Trivia'),
    el('option', { value: 'VOCAB' }, 'English & Arabic Vocab'),
    el('option', { value: 'ARABIC', selected: defaultMode === 'ARABIC' }, '🇸🇦 Arabic Language (العربية)')
  );
  const initialCount = Math.min(Math.max(Number(prefillQuiz?.questions?.length) || 10, 3), 60);
  const countInput = el('input', {
    type: 'number',
    className: 'field',
    min: '3',
    max: '60',
    value: String(initialCount),
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
        className: `chip ${n === initialCount ? 'selected' : ''}`,
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

  const savedMatchesContainer = el('div', { className: 'stack-xs' });
  const getMatchingSavedQuizzes = () => {
    const allSaved = store.customQuizzes || [];
    if (!allSaved.length) return [];
    const topicQ = topicInput.value.trim().toLowerCase();
    const promptQ = freePromptInput.value.trim().toLowerCase();
    const scored = allSaved.map((q) => {
      let score = 0;
      const qt = String(q.topic || '').toLowerCase();
      const qTitle = String(q.title || '').toLowerCase();
      const qp = String(q.customPrompt || '').toLowerCase();
      if (promptQ && qp && (qp === promptQ || qp.includes(promptQ) || promptQ.includes(qp))) score += 5;
      if (topicQ && (qt.includes(topicQ) || topicQ.includes(qt) || qTitle.includes(topicQ))) score += 3;
      if (q.customPrompt) score += 1;
      return { q, score };
    });
    return scored
      .sort((a, b) => b.score - a.score || (b.q.createdAtMs || 0) - (a.q.createdAtMs || 0))
      .slice(0, 3)
      .map((x) => x.q);
  };

  let genPlayBtn;
  const renderSavedMatches = () => {
    clearEl(savedMatchesContainer);
    const savedList = getMatchingSavedQuizzes();
    if (!savedList.length) {
      if (genPlayBtn) genPlayBtn.textContent = '✨ Save & Play Solo';
      return;
    }
    const topicLow = topicInput.value.trim().toLowerCase();
    const promptLow = freePromptInput.value.trim().toLowerCase();
    const hasExactOrCloseMatch = savedList.some((q) => {
      const qt = String(q.topic || '').toLowerCase();
      const qp = String(q.customPrompt || '').toLowerCase();
      return (promptLow && qp === promptLow) || (topicLow && qt === topicLow);
    });
    if (genPlayBtn) {
      genPlayBtn.textContent = hasExactOrCloseMatch ? '🆕 Brand-New Set & Play' : '✨ Save & Play Solo';
    }

    savedMatchesContainer.appendChild(
      el(
        'div',
        { className: 'card card-soft-primary stack-xs', style: { padding: '10px 12px' } },
        el('div', { className: 'row-between' },
          el('strong', { className: 'small' }, '📚 Reuse a Saved Custom Quiz (No Regeneration Needed)'),
          el('span', { className: 'xs muted' }, `${(store.customQuizzes || []).length} saved`)
        ),
        ...savedList.map((sq) => {
          const isAr = sq.language === 'AR' || isArabicText(sq.title);
          return el(
            'div',
            {
              className: 'row-between',
              style: {
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '10px',
                background: 'var(--surface)',
                flexWrap: 'wrap'
              }
            },
            el(
              'div',
              { className: 'stack-xs flex-1', style: { minWidth: '160px' } },
              el('div', { className: `small ${isAr ? 'arabic-text' : ''}`, style: { fontWeight: '700' }, dir: isAr ? 'rtl' : 'ltr' }, `${sq.title} (${(sq.questions || []).length} Qs)`),
              sq.customPrompt
                ? el('div', { className: `xs muted ${isArabicText(sq.customPrompt) ? 'arabic-text' : ''}`, dir: isArabicText(sq.customPrompt) ? 'rtl' : 'ltr' }, `💬 ${sq.customPrompt.slice(0, 70)}${sq.customPrompt.length > 70 ? '…' : ''}`)
                : null
            ),
            el(
              'div',
              { className: 'row', style: { gap: '6px' } },
              el('button', {
                type: 'button',
                className: 'btn btn-primary small',
                onClick: () => {
                  closeModal();
                  startSoloBlitz({
                    title: sq.title,
                    cefrLevel: sq.cefrLevel,
                    questions: sq.questions || [],
                    difficulty: diffSelect.value
                  });
                }
              }, '▶ Play Saved'),
              el('button', {
                type: 'button',
                className: 'btn btn-mint small',
                onClick: async () => {
                  try {
                    closeModal();
                    await store.hostQuizRoom({
                      quizTitle: sq.title,
                      cefrLevel: sq.cefrLevel || 'B1',
                      questions: (sq.questions || []).map((q) => ({ ...q, timeLimitSec: resolveQuestionLimitSec(q, diffSelect.value) }))
                    });
                  } catch (err) {
                    store.toast(err.message, 'error');
                  }
                }
              }, '🎙️ Host Saved')
            )
          );
        })
      )
    );
  };

  let topicChips = [];
  const syncTopicChips = () => {
    const val = topicInput.value.trim().toLowerCase();
    topicChips.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.topic.toLowerCase() === val);
    });
    renderSavedMatches();
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
  freePromptInput.addEventListener('input', renderSavedMatches);

  const statusEl = el('p', { className: 'small muted hidden', style: { margin: 0 } });
  const freshSetToggle = el('input', { type: 'checkbox', id: 'ai-fresh-set-toggle', checked: true });
  freshSetToggle.checked = true;

  const runGenerateAction = async (afterMode) => {
    const requestedCount = Math.min(Math.max(Number(countInput.value) || 10, 3), 60);
    countInput.value = String(requestedCount);
    const allBtns = [genPlayBtn, genHostBtn, genSaveOnlyBtn].filter(Boolean);
    allBtns.forEach((b) => { b.disabled = true; });
    statusEl.textContent = `Creating ${requestedCount} interactive questions...`;
    statusEl.classList.remove('hidden');

    const matchingSaved = getMatchingSavedQuizzes();
    const avoidFromSaved = freshSetToggle.checked
      ? matchingSaved.flatMap((q) => (q.questions || []).map((qq) => qq.prompt)).filter(Boolean)
      : [];

    try {
      const draft = await aiService.generateQuizDraft({
        topic: topicInput.value.trim() || 'General Knowledge & Facts',
        cefrLevel: levelSelect.value,
        difficulty: diffSelect.value,
        customPrompt: freePromptInput.value.trim(),
        questionCount: requestedCount,
        quizMode: modeSelect.value,
        avoidPrompts: avoidFromSaved,
        freshSet: freshSetToggle.checked,
        onProgress: (msg) => {
          statusEl.textContent = msg;
        }
      });
      const savedQuiz = await store.saveCustomQuiz(draft);
      closeModal();
      const targetQuiz = savedQuiz?.questions?.length ? savedQuiz : draft;
      if (afterMode === 'PLAY') {
        startSoloBlitz({ ...targetQuiz, difficulty: diffSelect.value });
      } else if (afterMode === 'HOST') {
        await store.hostQuizRoom({
          quizTitle: targetQuiz.title,
          cefrLevel: targetQuiz.cefrLevel || levelSelect.value || 'B1',
          questions: (targetQuiz.questions || []).map((q) => ({ ...q, timeLimitSec: resolveQuestionLimitSec(q, diffSelect.value) }))
        });
      }
    } catch (err) {
      statusEl.textContent = err?.message || 'Could not generate quiz.';
    } finally {
      allBtns.forEach((b) => { b.disabled = false; });
      renderSavedMatches();
    }
  };

  genPlayBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-primary flex-1',
      onClick: () => runGenerateAction('PLAY')
    },
    '✨ Save & Play Solo'
  );
  const genHostBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-mint flex-1',
      onClick: () => runGenerateAction('HOST')
    },
    '🎙️ Generate & Host PIN'
  );
  const genSaveOnlyBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-outline btn-full',
      onClick: () => runGenerateAction('SAVE_ONLY')
    },
    '💾 Generate & Save to My Quizzes Only'
  );

  renderSavedMatches();

  openModal({
    title: '✨ Custom Quiz Prompt Studio',
    subtitle: 'Reuse any saved prompted quiz anytime, or generate a brand-new non-repeating set (3–60 Qs)',
    content: el(
      'div',
      { className: 'stack-md' },
      savedMatchesContainer,
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
        el('label', { className: 'field-label', htmlFor: 'ai-quiz-free-prompt' }, 'Custom Free Prompt / Instructions (Saved with Quiz)'),
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
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'CEFR Level'), levelSelect),
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Difficulty & Timer'), diffSelect)
      ),
      el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Language / Quiz Style'), modeSelect),
      el(
        'label',
        { className: 'row small', style: { gap: '8px', cursor: 'pointer' }, htmlFor: 'ai-fresh-set-toggle' },
        freshSetToggle,
        el('span', {}, 'Exclude previously generated questions for this prompt (Brand-New Set)')
      ),
      statusEl,
      el('div', { className: 'row-wrap' }, genPlayBtn, genHostBtn),
      genSaveOnlyBtn
    )
  });
}

function openCreateCustomQuizModal() {
  const titleInput = el('input', { type: 'text', className: 'field', placeholder: 'e.g., World Trivia or ألغاز الجرائم' });
  const topicInput = el('input', { type: 'text', className: 'field', placeholder: 'Topic (e.g., Science, حقائق الفضاء)' });
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
      { className: 'row-between', style: { flexWrap: 'wrap', gap: '8px' } },
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { stopSoloTimer(); soloState = null; store.emit('change'); } }, '✕ Exit Blitz'),
      el('div', { className: 'row', style: { gap: '8px' } },
        el('button', {
          type: 'button',
          className: 'btn btn-soft small',
          onClick: () => store.openTeamBuzzer({
            contextKey: `solo:${s.title}`,
            title: `🚨 ${s.title}`,
            prompt: q.prompt
          })
        }, '🚨 Team Buzzer'),
        el('span', { className: 'badge-pill card-soft-primary mono' }, `Q ${s.index + 1}/${s.questions.length}`),
        el('span', { id: 'solo-timer-pill', className: `badge-pill mono ${s.timeLeft <= 5 ? 'card-soft-secondary' : 'card-soft-amber'}` }, s.timeLeft > 0 ? `⏱ ${s.timeLeft}s` : '⏱ Time Up!')
      )
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
                audioService.playCorrect();
                const basePts = computeQuizPointsEarned(true, s.timeLeft, Number(q.timeLimitSec || 20), s.streak);
                const pts = Math.round(basePts * (diffCfg.xpMultiplier || 1));
                s.score += pts;
                s.streak += 1;
                s.bestStreak = Math.max(s.bestStreak, s.streak);
                s.correctCount += 1;
                store.toast(`+${pts} pts!`);
              } else {
                audioService.playIncorrect();
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
        'div',
        { className: 'row', style: { gap: '8px' } },
        el(
          'button',
          {
            type: 'button',
            className: 'btn',
            style: { background: 'rgba(255,255,255,0.22)', color: '#FFFFFF' },
            onClick: () => store.openTeamBuzzer({
              contextKey: `room:${s.roomCode}`,
              title: `🚨 Live Buzzer · ${room.quizTitle}`,
              prompt: q?.prompt || 'Buzz in first to answer!'
            })
          },
          '🚨 Team Buzzer'
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
          room.status === RoomStatus.REVEAL
            ? (() => {
                const rawStandings = players.length ? players : (room.leaderboard || []);
                const topStandings = [...rawStandings]
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .slice(0, 5);
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return el(
                  'div',
                  { id: 'live-reveal-standings', className: 'card stack-sm' },
                  el(
                    'div',
                    { className: 'row-between' },
                    el('strong', {}, `🏆 Standings After Question ${qIdx + 1}`),
                    el('span', { className: 'xs muted' }, `${rawStandings.length} players`)
                  ),
                  topStandings.length === 0
                    ? el('p', { className: 'xs muted', style: { margin: 0 } }, 'No player scores recorded yet for this round.')
                    : el(
                        'div',
                        { className: 'stack-xs' },
                        ...topStandings.map((entry, rIdx) => {
                          const earnedRound = entry.lastAnsweredQuestion === qIdx && entry.lastAnswerCorrect && Number(entry.lastPointsEarned || 0) > 0;
                          const isMe = entry.uid && entry.uid === store.currentUserId;
                          return el(
                            'div',
                            {
                              className: `row-between ${rIdx === 0 ? 'card-soft-amber' : isMe ? 'card-soft-primary' : ''}`,
                              style: {
                                padding: '8px 12px',
                                borderRadius: 'var(--r-md)',
                                background: rIdx === 0 || isMe ? undefined : 'var(--surface-variant)'
                              }
                            },
                            el(
                              'div',
                              { className: 'row', style: { gap: '8px', minWidth: 0 } },
                              el('span', { style: { fontSize: '1.1rem' } }, medals[rIdx] || `#${rIdx + 1}`),
                              el('strong', { className: 'small', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, `${entry.nickname || 'Player'}${isMe ? ' (You)' : ''}`),
                              Number(entry.streak || 0) >= 2 ? el('span', { className: 'badge-pill card-soft-secondary xs' }, `🔥 ${entry.streak}x`) : null
                            ),
                            el(
                              'div',
                              { className: 'row', style: { gap: '8px', flexShrink: 0 } },
                              earnedRound
                                ? el('span', { className: 'badge-pill card-soft-mint mono' }, `+${entry.lastPointsEarned}`)
                                : null,
                              el('span', { className: 'mono small', style: { fontWeight: '800' } }, `${entry.score || 0} pts`)
                            )
                          );
                        })
                      )
                );
              })()
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
  return (roomMessages || []).slice(-12).map((m) => {
    const raw = String(m.text || '');
    if (raw.startsWith('[BUZZ|') && raw.endsWith(']')) {
      const parts = raw.slice(6, -1).split('|');
      const teamName = parts[1] || 'Squad';
      const playerName = parts[2] || m.senderName || 'Player';
      return el('div', { className: 'small', style: { fontWeight: '700', color: 'var(--primary)' } }, `⚡ ${teamName} (${playerName}) buzzed in! (5s lock)`);
    }
    if (raw.startsWith('[LEAVE|') && raw.endsWith(']')) {
      const leaver = raw.slice(7, -1).trim() || m.senderName || 'Player';
      return el('div', { className: 'xs muted', style: { fontWeight: '700' } }, `👋 ${leaver} left the quiz room`);
    }
    const sticker = parseStickerMessage(raw);
    if (sticker) {
      return el(
        'div',
        { className: 'row', style: { gap: '8px', alignItems: 'center' } },
        el('strong', { className: 'xs' }, `${m.senderName}:`),
        createStickerBubbleNode(sticker)
      );
    }
    return el('div', { className: `small ${isArabicText(raw) ? 'arabic-text' : ''}` }, el('strong', {}, `${m.senderName}: `), raw);
  });
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

  const roomStickerHost = el('div', { className: roomStickerDrawerOpen ? '' : 'hidden' });
  const renderRoomStickers = () => {
    clearEl(roomStickerHost);
    if (!roomStickerDrawerOpen) {
      roomStickerHost.classList.add('hidden');
      return;
    }
    roomStickerHost.classList.remove('hidden');
    roomStickerHost.appendChild(
      createStickerTray({
        onSelect: (encoded) => store.sendLiveRoomMessage(encoded, 'REACTION')
      })
    );
  };
  renderRoomStickers();

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
    el('div', { className: 'row-between' }, el('strong', {}, '💬 Room Cheers & Stickers'), el('span', { id: 'live-room-chat-count', className: 'xs muted' }, `${(s.roomMessages || []).length} messages`)),
    el(
      'div',
      { className: 'scroll-x' },
      ...['🔥 Let’s go!', '👏 Nice!', '⚡ Fast!', '🤔 سؤال رائع!'].map((rx) =>
        el('button', { type: 'button', className: 'chip', onClick: () => store.sendLiveRoomMessage(rx, 'REACTION') }, rx)
      )
    ),
    el(
      'div',
      { id: 'live-room-chat-list', className: 'stack-xs', style: { maxHeight: '170px', overflowY: 'auto' } },
      ...buildLiveRoomMessagesNodes(s.roomMessages)
    ),
    roomStickerHost,
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
      el(
        'button',
        {
          type: 'button',
          className: `btn ${roomStickerDrawerOpen ? 'btn-primary' : 'btn-soft'}`,
          style: { minWidth: '48px', padding: '0 12px' },
          title: 'Stickers',
          onMouseDown: (e) => e.preventDefault(),
          onClick: () => {
            roomStickerDrawerOpen = !roomStickerDrawerOpen;
            renderRoomStickers();
          }
        },
        '🎭'
      ),
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
    const newSetBtn = isCustom
      ? el(
          'button',
          {
            type: 'button',
            className: 'btn btn-soft small',
            title: 'Generate a brand-new set of questions using this quiz topic & prompt',
            onClick: async () => {
              newSetBtn.disabled = true;
              newSetBtn.textContent = '⏳...';
              try {
                const draft = await aiService.generateQuizDraft({
                  topic: pack.topic || pack.title,
                  cefrLevel: pack.cefrLevel || 'B1',
                  difficulty: activeDiff,
                  customPrompt: pack.customPrompt || '',
                  questionCount: Math.max(3, (pack.questions || []).length || 10),
                  quizMode: isAr ? 'ARABIC' : 'AUTO',
                  avoidPrompts: (pack.questions || []).map((q) => q.prompt),
                  freshSet: true
                });
                await store.updateCustomQuiz(pack.id, {
                  title: pack.title,
                  topic: pack.topic || draft.topic,
                  cefrLevel: pack.cefrLevel || draft.cefrLevel,
                  customPrompt: pack.customPrompt || draft.customPrompt || '',
                  language: draft.language,
                  questions: draft.questions
                });
                store.toast(`Loaded a fresh non-repeating set for "${pack.title}"!`);
              } catch (err) {
                store.toast(err?.message || 'Could not generate new set.', 'error');
              } finally {
                newSetBtn.disabled = false;
                newSetBtn.textContent = '🔄 New Set';
              }
            }
          },
          '🔄 New Set'
        )
      : null;

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
      pack.customPrompt
        ? el(
            'div',
            { className: `xs muted ${isArabicText(pack.customPrompt) ? 'arabic-text' : ''}`, dir: isArabicText(pack.customPrompt) ? 'rtl' : 'ltr', style: { background: 'var(--surface-variant)', padding: '6px 10px', borderRadius: '8px' } },
            `💬 Prompt: ${pack.customPrompt}`
          )
        : null,
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
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline small',
            title: 'Export quiz as Kahoot CSV spreadsheet',
            onClick: () => {
              downloadQuizCsv({ ...pack, questions: scaledQuestions });
              store.toast(`Exported "${pack.title}" as Kahoot CSV!`);
            }
          },
          '📥 CSV'
        ),
        newSetBtn,
        isCustom
          ? el(
              'button',
              {
                type: 'button',
                className: 'btn btn-outline small',
                title: 'Edit prompt or save a new copy in Prompt Studio',
                onClick: () => openAiQuizGeneratorModal({ prefillQuiz: pack })
              },
              '✨ Prompt'
            )
          : null,
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

    // Live Topic & Keyword Gemini Quiz Generator
    createLiveQuizGeneratorComponent({ onStartSoloBlitz: startSoloBlitz }),

    // Studio Actions + Kahoot CSV Import
    (() => {
      const csvFileInput = el('input', {
        type: 'file',
        accept: '.csv,text/csv',
        className: 'hidden',
        onChange: async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const parsed = parseKahootCsv(text, {
              cefrLevel: store.profile?.learningLevel || 'B1',
              title: file.name.replace(/\.csv$/i, '') || 'Imported CSV Quiz'
            });
            await store.saveCustomQuiz(parsed);
            store.toast(`Imported "${parsed.title}" (${parsed.questions.length} Qs) from CSV!`);
          } catch (err) {
            store.toast(err?.message || 'Could not import CSV quiz.', 'error');
          } finally {
            csvFileInput.value = '';
          }
        }
      });
      return el(
        'div',
        { className: 'row-wrap' },
        csvFileInput,
        el('button', { type: 'button', className: 'btn btn-soft flex-1', onClick: () => openAiQuizGeneratorModal() }, '✨ Prompt Studio Modal'),
        el('button', { type: 'button', className: 'btn btn-outline flex-1', onClick: openCreateCustomQuizModal }, '📝 Create Custom Quiz'),
        el('button', { type: 'button', className: 'btn btn-outline flex-1', onClick: () => csvFileInput.click() }, '📤 Import CSV (Kahoot)')
      );
    })(),

    clubQuizzes.length
      ? el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, '🌟 Official Club Quizzes'), el('div', { className: 'grid-2' }, ...clubQuizzes.map((c) => renderQuizPackCard(c, { isClub: true }))))
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
