// Weekly 200-Word Club & Mini-Games View (1:1 port of WeeklyCurriculumScreen.kt + WeeklyGamesComponents.kt)

import { VOCAB_DOMAIN_LABELS, VocabDomain, el, shuffleArray } from '../models.js';
import { WEEKLY_CURRICULUM } from '../data/weekly-curriculum.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { aiService } from '../services/ai-service.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, renderTranslatableText } from '../components/ui-shared.js';

let selectedWeek = 1;
let selectedSession = 1;
let viewMode = 'WORDS'; // 'WORDS' | 'STORY' | 'GAMES'
let selectedDomain = 'ALL';
let searchQuery = '';
let weeklyGameState = null;

function startWeeklyMeaningBlitz(week, sessionWords) {
  const pool = shuffleArray(sessionWords.length >= 6 ? sessionWords : week.words).slice(0, 10);
  const questions = pool.map((w) => {
    const distractors = shuffleArray(week.words.filter((x) => x.id !== w.id)).slice(0, 3);
    const opts = shuffleArray([w.arabic, ...distractors.map((d) => d.arabic)]);
    return {
      word: w,
      options: opts,
      correctIdx: opts.indexOf(w.arabic)
    };
  });
  weeklyGameState = {
    mode: 'BLITZ',
    weekNumber: week.weekNumber,
    questions,
    idx: 0,
    score: 0,
    correct: 0,
    picked: null,
    finished: false
  };
  store.emit('change');
}

function startWeeklySpeedMatch(week, sessionWords) {
  const pairWords = shuffleArray(sessionWords.length >= 6 ? sessionWords : week.words).slice(0, 6);
  weeklyGameState = {
    mode: 'MATCH',
    weekNumber: week.weekNumber,
    pairs: pairWords,
    leftItems: shuffleArray(pairWords.map((w) => ({ id: w.id, text: w.word || w.english || '' }))),
    rightItems: shuffleArray(pairWords.map((w) => ({ id: w.id, text: w.arabic }))),
    selectedLeft: null,
    matchedIds: new Set(),
    attempts: 0,
    finished: false
  };
  store.emit('change');
}

function renderWeeklyMiniGame(week) {
  const g = weeklyGameState;
  if (g.mode === 'BLITZ') {
    if (g.finished) {
      const acc = Math.round((g.correct / g.questions.length) * 100);
      return el(
        'div',
        { className: 'card card-soft-mint stack-md', style: { textAlign: 'center' } },
        el('h3', { className: 'section-title' }, '⚡ Meaning Blitz Complete!'),
        el('div', { className: 'display-title mono' }, `${g.score} pts (${acc}%)`),
        el('button', { type: 'button', className: 'btn btn-primary', onClick: () => { weeklyGameState = null; store.emit('change'); } }, 'Back to Games')
      );
    }
    const q = g.questions[g.idx];
    const wordStr = q.word.word || q.word.english || '';
    return el(
      'div',
      { className: 'card stack-md' },
      el('div', { className: 'row-between' }, el('strong', {}, `Word ${g.idx + 1}/${g.questions.length}`), el('button', { type: 'button', className: 'btn btn-ghost', onClick: () => { weeklyGameState = null; store.emit('change'); } }, '✕ Exit')),
      el('div', { className: 'row-between' }, el('h3', { className: 'display-title' }, wordStr), el('button', { type: 'button', className: 'btn-icon', onClick: () => ttsSpeaker.speak(wordStr) }, '🔊')),
      el(
        'div',
        { className: 'grid-2' },
        ...q.options.map((opt, idx) => {
          const picked = g.picked !== null;
          const isRight = idx === q.correctIdx;
          return el(
            'button',
            {
              type: 'button',
              className: `btn ${picked ? (isRight ? 'btn-mint' : idx === g.picked ? 'btn-danger-soft' : 'btn-outline') : 'btn-outline'} arabic-text`,
              style: { justifyContent: 'center', minHeight: '56px', fontSize: '1rem' },
              disabled: picked,
              onClick: async () => {
                g.picked = idx;
                if (isRight) {
                  g.correct += 1;
                  g.score += 100;
                }
                store.emit('change');
                setTimeout(async () => {
                  if (!weeklyGameState) return;
                  if (g.idx + 1 >= g.questions.length) {
                    g.finished = true;
                    const acc = Math.round((g.correct / g.questions.length) * 100);
                    await store.recordWeeklyGame(g.weekNumber, `Week ${g.weekNumber} Meaning Blitz`, g.score, acc);
                    store.confetti();
                  } else {
                    g.idx += 1;
                    g.picked = null;
                  }
                  store.emit('change');
                }, 650);
              }
            },
            opt
          );
        })
      )
    );
  }

  // MATCH mode
  if (g.finished) {
    const acc = Math.min(100, Math.round((g.pairs.length / Math.max(g.pairs.length, g.attempts)) * 100));
    return el(
      'div',
      { className: 'card card-soft-mint stack-md', style: { textAlign: 'center' } },
      el('h3', { className: 'section-title' }, '🔗 Speed Match Cleared!'),
      el('p', { className: 'small', style: { margin: 0 } }, `Matched all 6 bilingual pairs with ${acc}% accuracy!`),
      el('button', { type: 'button', className: 'btn btn-primary', onClick: () => { weeklyGameState = null; store.emit('change'); } }, 'Back to Games')
    );
  }

  return el(
    'div',
    { className: 'card stack-md' },
    el('div', { className: 'row-between' }, el('strong', {}, `Matched ${g.matchedIds.size}/6 pairs`), el('button', { type: 'button', className: 'btn btn-ghost', onClick: () => { weeklyGameState = null; store.emit('change'); } }, '✕ Exit')),
    el(
      'div',
      { className: 'grid-2' },
      el(
        'div',
        { className: 'stack-sm' },
        ...g.leftItems.map((item) => {
          const done = g.matchedIds.has(item.id);
          const sel = g.selectedLeft === item.id;
          return el(
            'button',
            {
              type: 'button',
              className: `btn btn-full ${done ? 'btn-mint' : sel ? 'btn-primary' : 'btn-outline'}`,
              disabled: done,
              onClick: () => {
                g.selectedLeft = item.id;
                store.emit('change');
              }
            },
            item.text
          );
        })
      ),
      el(
        'div',
        { className: 'stack-sm' },
        ...g.rightItems.map((item) => {
          const done = g.matchedIds.has(item.id);
          return el(
            'button',
            {
              type: 'button',
              className: `btn btn-full arabic-text ${done ? 'btn-mint' : 'btn-outline'}`,
              disabled: done || !g.selectedLeft,
              onClick: async () => {
                g.attempts += 1;
                if (g.selectedLeft === item.id) {
                  g.matchedIds.add(item.id);
                  g.selectedLeft = null;
                  if (g.matchedIds.size === g.pairs.length) {
                    g.finished = true;
                    const acc = Math.min(100, Math.round((g.pairs.length / Math.max(g.pairs.length, g.attempts)) * 100));
                    await store.recordWeeklyGame(g.weekNumber, `Week ${g.weekNumber} Speed Match`, 600, acc);
                    store.confetti();
                  }
                } else {
                  g.selectedLeft = null;
                  store.toast('Try another Arabic pair!', 'error');
                }
                store.emit('change');
              }
            },
            item.text
          );
        })
      )
    )
  );
}

export function renderCurriculumView({ navigate }) {
  const week = WEEKLY_CURRICULUM.find((w) => w.weekNumber === selectedWeek) || WEEKLY_CURRICULUM[0];
  const progress = store.weeklyProgress[week.weekNumber] || { masteredWordIds: [], completedSessions: [], gamesPlayed: 0 };
  const masteredSet = new Set(progress.masteredWordIds || []);
  const completedSessions = new Set((progress.completedSessions || []).map(Number));

  const session = week.sessions.find((s) => s.sessionNumber === selectedSession) || week.sessions[0];
  const sessionWords = week.words.filter((w) => w.sessionNumber === selectedSession);
  const filteredWords = sessionWords
    .filter((w) => (selectedDomain === 'ALL' ? true : w.domain === selectedDomain))
    .filter((w) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const eng = String(w.word || w.english || '').toLowerCase();
      return eng.includes(q) || String(w.arabic || '').includes(q);
    });

  const teacherPacks = (store.clubContent || []).filter((c) => c.contentType === 'WEEKLY_PACK' && Number(c.weekNumber) === week.weekNumber);
  const weekCefr = week.cefrLevel || (week.weekNumber === 1 ? 'A1–B1' : 'B1–B2');

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '📅 Weekly 200-Word Club'),
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
    ),

    // Week Selector
    el(
      'div',
      { className: 'row-wrap' },
      ...WEEKLY_CURRICULUM.map((w) =>
        el(
          'button',
          {
            type: 'button',
            className: `chip ${selectedWeek === w.weekNumber ? 'selected' : ''}`,
            onClick: () => {
              selectedWeek = w.weekNumber;
              weeklyGameState = null;
              store.emit('change');
            }
          },
          w.title || `Week ${w.weekNumber}`
        )
      )
    ),

    // Week Mastery Progress Card
    el(
      'div',
      { className: 'card card-soft-primary stack-sm' },
      el('div', { className: 'row-between' }, el('strong', {}, `Week ${week.weekNumber} Mastery`), createCefrBadge(week.weekNumber === 1 ? 'B1' : 'B2')),
      el('p', { className: 'small', style: { margin: 0 } }, week.themeStory || week.theme || week.subtitle || ''),
      el('div', { className: 'progress-track' }, el('div', { className: 'progress-fill mint', style: { width: `${Math.min(100, Math.round((masteredSet.size / Math.max(1, week.words.length)) * 100))}%` } })),
      el('div', { className: 'row-between xs' }, el('span', {}, `${masteredSet.size} / ${week.words.length} words mastered (${weekCefr})`), el('span', {}, `${completedSessions.size}/3 sessions · ${progress.gamesPlayed || 0} games`))
    ),

    // Session 1/2/3 Tabs + Complete Button
    el(
      'div',
      { className: 'row-between', style: { flexWrap: 'wrap' } },
      el(
        'div',
        { className: 'row-wrap' },
        ...week.sessions.map((s) =>
          el(
            'button',
            {
              type: 'button',
              className: `chip ${selectedSession === s.sessionNumber ? 'selected' : ''}`,
              onClick: () => {
                selectedSession = s.sessionNumber;
                weeklyGameState = null;
                store.emit('change');
              }
            },
            `${completedSessions.has(s.sessionNumber) ? '✅ ' : ''}Session ${s.sessionNumber}`
          )
        )
      ),
      el(
        'button',
        {
          type: 'button',
          className: `btn ${completedSessions.has(selectedSession) ? 'btn-soft' : 'btn-mint'}`,
          onClick: () => store.completeWeeklySession(week.weekNumber, selectedSession)
        },
        completedSessions.has(selectedSession) ? '✅ Completed (+15 XP)' : 'Complete Session (+50 XP)'
      )
    ),

    // View Mode Toggle
    el(
      'div',
      { className: 'row-wrap' },
      ...[
        { id: 'WORDS', label: `📚 Words (${sessionWords.length})` },
        { id: 'STORY', label: '📖 Story Chain' },
        { id: 'GAMES', label: '🎮 Mini-Games' }
      ].map((m) =>
        el(
          'button',
          {
            type: 'button',
            className: `chip ${viewMode === m.id ? 'selected' : ''}`,
            onClick: () => {
              viewMode = m.id;
              weeklyGameState = null;
              store.emit('change');
            }
          },
          m.label
        )
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-soft',
          onClick: async () => {
            store.toast('Creating AI quiz from Session words...');
            const draft = await aiService.generateQuizDraft({
              topic: session.title,
              cefrLevel: week.weekNumber === 1 ? 'B1' : 'B2',
              questionCount: 10,
              quizMode: 'VOCAB',
              focusWords: sessionWords.slice(0, 16).map((w) => w.word || w.english).filter(Boolean)
            });
            await store.saveCustomQuiz(draft);
            navigate('quiz');
          }
        },
        '✨ Quiz These Words'
      )
    ),

    // Teacher Bonus Packs
    teacherPacks.length
      ? el(
          'div',
          { className: 'card card-soft-amber stack-xs' },
          el('strong', {}, `🎓 Teacher Bonus Pack: ${teacherPacks[0].title}`),
          el('p', { className: 'small', style: { margin: 0 } }, teacherPacks[0].description)
        )
      : null,

    // Mode Body
    viewMode === 'WORDS'
      ? el(
          'div',
          { className: 'stack-md' },
          el('input', {
            type: 'search',
            className: 'field',
            placeholder: `Filter Session ${selectedSession} words (English or Arabic)...`,
            value: searchQuery,
            onInput: (e) => {
              searchQuery = e.target.value;
              store.emit('change');
            }
          }),
          el(
            'div',
            { className: 'scroll-x' },
            el('button', { type: 'button', className: `chip ${selectedDomain === 'ALL' ? 'selected' : ''}`, onClick: () => { selectedDomain = 'ALL'; store.emit('change'); } }, 'All Domains'),
            ...Object.values(VocabDomain).map((d) =>
              el('button', { type: 'button', className: `chip ${selectedDomain === d ? 'selected' : ''}`, onClick: () => { selectedDomain = d; store.emit('change'); } }, VOCAB_DOMAIN_LABELS[d])
            )
          ),
          el(
            'div',
            { className: 'grid-2' },
            ...filteredWords.map((w) => {
              const isMastered = masteredSet.has(w.id);
              const engWord = w.word || w.english || '';
              const sentence = w.storyLine || w.exampleSentence || w.meaning || '';
              return el(
                'div',
                { className: `card stack-xs ${isMastered ? 'card-soft-mint' : ''}` },
                el(
                  'div',
                  { className: 'row-between' },
                  el(
                    'div',
                    { className: 'stack-xs' },
                    el('div', { className: 'card-title' }, engWord),
                    el('div', { className: 'xs mono muted' }, w.meaning || w.phonetic || '')
                  ),
                  el(
                    'div',
                    { className: 'row', style: { gap: '4px' } },
                    el('button', { type: 'button', className: 'btn-icon', ariaLabel: `Pronounce ${engWord}`, onClick: () => ttsSpeaker.speak(engWord) }, '🔊'),
                    el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Toggle mastered', onClick: () => store.toggleWeeklyWordMastered(week.weekNumber, w.id) }, isMastered ? '✅' : '⬜')
                  )
                ),
                el('div', { className: 'arabic-text', style: { fontWeight: '700', fontSize: '1.05rem' } }, w.arabic),
                el('div', { className: 'small muted' }, renderTranslatableText(sentence, { cefrLevel: w.cefrLevel || 'B1' }))
              );
            })
          )
        )
      : viewMode === 'STORY'
        ? (() => {
            const storyParas = session.storyParagraphs || [
              session.storyOpening,
              ...sessionWords.slice(0, 12).map((w) => w.storyLine).filter(Boolean),
              session.storyClosing
            ].filter(Boolean);
            return el(
              'div',
              { className: 'card stack-md' },
              el(
                'div',
                { className: 'row-between' },
                el('h2', { className: 'section-title' }, `📖 ${session.storyTitle || session.title}`),
                el('button', { type: 'button', className: 'btn btn-soft', onClick: () => ttsSpeaker.speak(storyParas.join(' ')) }, '🔊 Read Aloud')
              ),
              el('p', { className: 'small muted', style: { margin: 0 } }, session.storyPrompt || session.teachingTip || ''),
              ...storyParas.map((para) =>
                el('p', { style: { margin: 0, lineHeight: 1.75 } }, renderTranslatableText(para, { cefrLevel: week.weekNumber === 1 ? 'B1' : 'B2' }))
              )
            );
          })()
        : weeklyGameState
          ? renderWeeklyMiniGame(week)
          : el(
              'div',
              { className: 'grid-2' },
              el(
                'div',
                { className: 'card stack-md' },
                el('h3', { className: 'section-title' }, '⚡ Meaning Blitz'),
                el('p', { className: 'small muted', style: { margin: 0 } }, 'Pick the right Arabic meaning for 10 words from this session.'),
                el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: () => startWeeklyMeaningBlitz(week, sessionWords) }, 'Play Meaning Blitz')
              ),
              el(
                'div',
                { className: 'card stack-md' },
                el('h3', { className: 'section-title' }, '🔗 Speed Pair Match'),
                el('p', { className: 'small muted', style: { margin: 0 } }, 'Connect 6 English words to their Arabic equivalents fast.'),
                el('button', { type: 'button', className: 'btn btn-mint btn-full', onClick: () => startWeeklySpeedMatch(week, sessionWords) }, 'Play Speed Match')
              )
            )
  );
}
