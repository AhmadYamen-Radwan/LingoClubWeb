// Profile, Badges & Session History View (1:1 port of ProfileScreen.kt)

import { ACTIVITY_LABELS, BadgeCategory, CEFR_LABELS, CEFR_LEVELS, DIFFICULTY_CONFIG, DIFFICULTY_LEVELS, LINGO_BADGES, el } from '../models.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openAiKeyModal } from '../components/ui-shared.js';

let selectedBadgeCategory = 'ALL';

export function renderProfileView({ navigate }) {
  const p = store.profile || {};
  const activeLevel = p.learningLevel || 'B1';
  const activeDiff = store.selectedDifficulty || 'MEDIUM';
  const earnedSet = new Set(p.earnedBadges || []);
  const nameInput = el('input', {
    id: 'profile-display-name-input',
    type: 'text',
    className: 'field flex-1',
    value: p.displayName || store.currentUserName,
    maxLength: 50
  });

  const stats = [
    { label: 'Total XP', val: p.xp || 0, tone: 'card-soft-primary' },
    { label: 'Day Streak', val: `${p.streak || 1}d`, tone: 'card-soft-amber' },
    { label: 'Weekly Words', val: p.weeklyWordsMastered || 0, tone: 'card-soft-mint' },
    { label: 'Sessions Done', val: p.sessionsCompleted || 0, tone: 'card-soft-primary' },
    { label: 'Quizzes Played', val: p.quizzesPlayed || 0, tone: 'card-soft-secondary' },
    { label: 'Best Live Quiz', val: p.bestLiveQuizScore || 0, tone: 'card-soft-amber' },
    { label: 'Cards Mastered', val: p.cardsMastered || 0, tone: 'card-soft-mint' },
    { label: 'Audiobooks', val: p.audiobooksFinished || 0, tone: 'card-soft-primary' }
  ];

  const categories = [
    { id: 'ALL', label: `All (${LINGO_BADGES.length})` },
    { id: 'WEEKLY', label: BadgeCategory.WEEKLY },
    { id: 'QUIZ', label: BadgeCategory.QUIZ },
    { id: 'CLUB', label: BadgeCategory.CLUB }
  ];

  const visibleBadges = selectedBadgeCategory === 'ALL'
    ? LINGO_BADGES
    : LINGO_BADGES.filter((b) => b.category === selectedBadgeCategory);

  const sessions = (store.sessionHistory || []).slice(0, 30);

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '👤 My Profile'),
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
    ),

    // Hero Identity Card
    el(
      'div',
      { className: 'card stack-md' },
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap' } },
        el(
          'div',
          { className: 'row', style: { gap: '12px' } },
          el('div', {
            style: {
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '800'
            }
          }, (store.currentUserName || 'L')[0].toUpperCase()),
          el(
            'div',
            { className: 'stack-xs' },
            el('div', { className: 'section-title' }, store.currentUserName),
            el(
              'div',
              { className: 'row-wrap' },
              createCefrBadge(p.learningLevel || 'B1'),
              el('span', { className: 'badge-pill', style: { background: 'var(--surface-variant)' } }, store.isOfflineMode ? '🧭 Club Explorer' : '☁️ Club Member'),
              p.teamName ? el('span', { className: 'badge-pill card-soft-primary' }, `💬 ${p.teamName}`) : null
            )
          )
        ),
        el('span', { className: 'badge-pill card-soft-amber' }, `🏅 ${earnedSet.size}/${LINGO_BADGES.length} Badges`)
      ),

      store.isOfflineMode
        ? el(
            'div',
            { className: 'row' },
            nameInput,
            el('button', { type: 'button', className: 'btn btn-primary', onClick: () => store.updateDisplayName(nameInput.value) }, 'Save Name')
          )
        : null,

      el(
        'div',
        { className: 'stack-xs' },
        el('div', { className: 'field-label' }, `CEFR Level (${CEFR_LABELS[activeLevel] || activeLevel})`),
        el(
          'div',
          { className: 'row-wrap' },
          ...CEFR_LEVELS.map((lvl) =>
            el(
              'button',
              {
                type: 'button',
                className: `chip ${activeLevel === lvl ? 'selected' : ''}`,
                onClick: () => store.updateLearningLevel(lvl)
              },
              CEFR_LABELS[lvl] || lvl
            )
          )
        )
      ),

      el(
        'div',
        { className: 'stack-xs' },
        el('div', { className: 'field-label' }, 'Active Quiz & Arcade Difficulty'),
        el(
          'div',
          { className: 'row-wrap' },
          ...DIFFICULTY_LEVELS.map((d) =>
            el(
              'button',
              {
                type: 'button',
                className: `chip ${activeDiff === d ? 'selected' : ''}`,
                onClick: () => store.setDifficulty(d)
              },
              DIFFICULTY_CONFIG[d].label
            )
          )
        )
      ),

      el(
        'div',
        { className: 'row-wrap' },
        el('button', { type: 'button', className: 'btn btn-outline', onClick: openAiKeyModal }, '✨ AI Engine Key'),
        store.isOfflineMode
          ? el('button', {
              type: 'button',
              className: 'btn btn-primary',
              onClick: async () => {
                try {
                  const user = await store.signInWithGoogle();
                  if (user) navigate('home');
                } catch (_) {}
              }
            }, '🔐 Sign in with Google')
          : null,
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-danger-soft',
            onClick: async () => {
              await store.signOut();
              navigate('auth');
            }
          },
          store.isOfflineMode ? 'Exit Offline Mode' : 'Sign Out'
        )
      )
    ),

    // 8 Stats Grid
    el(
      'div',
      { className: 'grid-modes', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' } },
      ...stats.map((s) =>
        el(
          'div',
          { className: `card ${s.tone}`, style: { minHeight: 'auto', textAlign: 'center', padding: '14px' } },
          el('div', { className: 'display-title mono', style: { fontSize: '1.45rem' } }, String(s.val)),
          el('div', { className: 'xs', style: { fontWeight: '700' } }, s.label)
        )
      )
    ),

    // Badges Section
    el(
      'div',
      { className: 'stack-md' },
      el('h2', { className: 'section-title' }, '🏅 Milestone Badges'),
      el(
        'div',
        { className: 'scroll-x' },
        ...categories.map((c) =>
          el(
            'button',
            {
              type: 'button',
              className: `chip ${selectedBadgeCategory === c.id ? 'selected' : ''}`,
              onClick: () => {
                selectedBadgeCategory = c.id;
                store.emit('change');
              }
            },
            c.label
          )
        )
      ),
      el(
        'div',
        { className: 'grid-2' },
        ...visibleBadges.map((b) => {
          const unlocked = earnedSet.has(b.id);
          return el(
            'div',
            {
              className: `card row ${unlocked ? 'card-soft-primary' : ''}`,
              style: { opacity: unlocked ? 1 : 0.62, gap: '12px' }
            },
            el('div', { style: { fontSize: '2rem', filter: unlocked ? 'none' : 'grayscale(1)' } }, b.icon),
            el(
              'div',
              { className: 'stack-xs flex-1' },
              el('div', { className: 'row-between' }, el('span', { className: 'card-title' }, b.title), el('span', { className: 'xs mono' }, unlocked ? 'UNLOCKED' : 'LOCKED')),
              el('div', { className: 'small' }, unlocked ? b.subtitle : `Goal: ${b.criteria}`)
            )
          );
        })
      )
    ),

    // Session History
    el(
      'div',
      { className: 'stack-md' },
      el('h2', { className: 'section-title' }, `📜 Recent Activity (${sessions.length})`),
      sessions.length === 0
        ? el('div', { className: 'card small muted' }, 'No practice sessions recorded yet. Play a quiz, puzzle, or audiobook to start logging history!')
        : el(
            'div',
            { className: 'stack-sm' },
            ...sessions.map((s) =>
              el(
                'div',
                { className: 'card row-between' },
                el(
                  'div',
                  { className: 'stack-xs' },
                  el('div', { className: 'card-title' }, s.title || ACTIVITY_LABELS[s.activityType] || 'Session'),
                  el('div', { className: 'xs muted' }, `${ACTIVITY_LABELS[s.activityType] || s.activityType} · ${s.wordsPracticed || 0} words · ${s.durationMinutes || 1}m`)
                ),
                el(
                  'div',
                  { className: 'row', style: { gap: '8px' } },
                  createCefrBadge(s.cefrLevel || 'B1'),
                  el('span', { className: 'badge-pill card-soft-mint mono' }, `${s.score || 0} pts (${s.accuracyPct || 100}%)`)
                )
              )
            )
          )
    )
  );
}
