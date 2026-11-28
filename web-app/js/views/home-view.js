// Home Dashboard View (1:1 port of HomeScreen.kt)

import { CEFR_LABELS, CEFR_LEVELS, DIFFICULTY_CONFIG, DIFFICULTY_LEVELS, el } from '../models.js';
import { store } from '../store/app-store.js';
import { createDailyGoalRingCanvas, createLanguageCubeCanvas } from '../components/canvas-3d.js';
import { createCefrBadge, openAiKeyModal, renderCefrFilterRow } from '../components/ui-shared.js';
import { createGlobalTeamLeaderboard } from '../components/global-team-leaderboard.js';

export function renderHomeView({ navigate }) {
  const p = store.profile || {};
  const activeLevel = p.learningLevel || 'B1';
  const activeDiff = store.selectedDifficulty || 'MEDIUM';
  const pinInput = el('input', {
    id: 'home-join-pin-input',
    type: 'text',
    className: 'field mono flex-1',
    placeholder: '6-char PIN (e.g. A7K9P2)',
    maxLength: 6,
    style: { textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '800' }
  });

  const announcements = (store.clubContent || []).filter((c) => c.contentType === 'ANNOUNCEMENT');

  const modeTiles = [
    { route: 'quiz', icon: '⚡', title: 'Live Quiz Clash', sub: 'English & Arabic Quizzes, AI Free Prompt', bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)', tag: 'LIVE + AR' },
    { route: 'curriculum', icon: '📅', title: 'Weekly 200-Word Club', sub: 'Week 1 & 2 · 400 words', bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)', tag: 'CLUB' },
    { route: 'arcade', icon: '🕵️', title: 'Interactive Arcade', sub: '10 EN Games + 6 Arabic Games (ألعاب عربية)', bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)', tag: '16 GAMES' },
    { route: 'cards', icon: '🃏', title: 'Deck Studio', sub: '3D Flip & Custom Decks', bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)', tag: '3D' },
    { route: 'puzzles', icon: '🧩', title: 'Word Forge Puzzles', sub: 'Scramble, Match, Cloze', bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)', tag: 'BRAIN' },
    { route: 'roleplay', icon: '🎭', title: 'Roleplay Stage', sub: 'AI Scenes & Voice Coach', bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)', tag: 'VOICE' },
    { route: 'audiobooks', icon: '🎧', title: 'Audiobook Lounge', sub: 'Leveled Read-Along EN/AR', bg: 'var(--blue-soft)', ink: 'var(--on-blue-soft)', tag: 'TTS' },
    { route: 'guessing', icon: '🎲', title: 'Taboo & Act Party', sub: 'Forbidden Clues & Timer', bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)', tag: 'PARTY' },
    { route: 'dictionary', icon: '📘', title: 'Bilingual Dictionary', sub: '18,600+ EN↔AR Glossary', bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)', tag: '18.6K' },
    { route: 'leaderboard', icon: '🏆', title: 'Global Leaderboard', sub: 'Top 3 Podium & Ranks', bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)', tag: 'RANKS' },
    { route: 'teams', icon: '🛡️', title: 'Teams & Kahoot Battle', sub: 'Squad Podium & Game Contributions', bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)', tag: 'TEAMS' },
    { route: 'chat', icon: '💬', title: 'Team Chat & Squad', sub: 'Teacher Hub & Cross-Tab', bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)', tag: 'SQUAD' },
    { route: 'tutor', icon: '🎓', title: 'Tutor Progress Portal', sub: 'Student Roster & Linking', bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)', tag: 'TUTOR' }
  ];

  const heroCube = createLanguageCubeCanvas({
    size: 74,
    onTap: () => store.toast('Tap any Studio tile below to launch!')
  });

  return el(
    'div',
    { className: 'stack-lg' },

    // Header Row
    el(
      'div',
      { className: 'row-between' },
      el(
        'div',
        { className: 'row', style: { gap: '12px' } },
        el('img', {
          src: './assets/img_3d_lingo_mascot.jpg',
          alt: 'LingoClub Mascot',
          style: { width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }
        }),
        el(
          'div',
          { className: 'stack-xs' },
          el('h1', { className: 'display-title', style: { fontSize: '1.35rem' } }, `Hi, ${store.currentUserName}`),
          el(
            'div',
            { className: 'row-wrap', style: { gap: '6px' } },
            createCefrBadge(activeLevel),
            el('span', { className: 'badge-pill card-soft-amber' }, DIFFICULTY_CONFIG[activeDiff]?.label || '🟡 Medium'),
            el('span', { className: 'badge-pill', style: { background: 'var(--surface-variant)' } }, store.isOfflineMode ? '🧭 Offline' : '☁️ Cloud')
          )
        )
      ),
      el(
        'div',
        { className: 'row', style: { gap: '6px' } },
        el('button', { type: 'button', className: 'btn-icon', title: 'Theme (Auto / Light / Dark)', ariaLabel: 'Cycle theme', onClick: () => store.cycleThemeMode() }, store.themeMode === 'dark' ? '🌙' : store.themeMode === 'light' ? '☀️' : '🌗'),
        el('button', { type: 'button', className: 'btn-icon', title: 'AI Key Settings', ariaLabel: 'AI settings', onClick: openAiKeyModal }, '✨'),
        el('button', { type: 'button', className: 'btn-icon', title: 'Profile & Badges', ariaLabel: 'Open profile', onClick: () => navigate('profile') }, '👤')
      )
    ),

    // Stats + Daily Goal Ring
    el(
      'div',
      { className: 'card row-between', style: { gap: '14px', flexWrap: 'wrap' } },
      el(
        'div',
        { className: 'row', style: { gap: '14px' } },
        createDailyGoalRingCanvas({ xp: p.xp || 0, target: 150, size: 70 }),
        el(
          'div',
          { className: 'stack-xs' },
          el('div', { className: 'card-title' }, 'Daily Studio Goal'),
          el('div', { className: 'small muted' }, `${(p.xp || 0) % 150} / 150 XP toward next milestone`)
        )
      ),
      el(
        'div',
        { className: 'grid-stats', style: { flex: '1', minWidth: '220px' } },
        el('div', { className: 'card card-soft-primary', style: { padding: '10px', textAlign: 'center' } }, el('div', { className: 'card-title mono' }, String(p.xp || 0)), el('div', { className: 'xs' }, 'Total XP')),
        el('div', { className: 'card card-soft-amber', style: { padding: '10px', textAlign: 'center' } }, el('div', { className: 'card-title mono' }, `${p.streak || 1}d`), el('div', { className: 'xs' }, 'Streak')),
        el('div', { className: 'card card-soft-mint', style: { padding: '10px', textAlign: 'center' } }, el('div', { className: 'card-title mono' }, String(p.weeklyWordsMastered || 0)), el('div', { className: 'xs' }, 'Words'))
      )
    ),

    // Tutor Notice / Offline Banner / Announcements
    store.isOfflineMode
      ? el(
          'div',
          { className: 'card card-soft-mint row-between', style: { flexWrap: 'wrap' } },
          el('div', { className: 'small' }, '🧭 Offline Explorer active — all curriculum, 18.6K dictionary, games & cross-tab squad rooms work without internet.'),
          el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('profile') }, 'Switch to Google')
        )
      : null,

    announcements.length > 0
      ? el(
          'div',
          { className: 'card card-soft-amber stack-xs' },
          el('div', { className: 'card-title' }, `📢 ${announcements[0].title}`),
          el('p', { className: 'small', style: { margin: 0 } }, announcements[0].description)
        )
      : null,

    // Hero Quiz Studio Banner
    el(
      'div',
      { className: 'hero-banner' },
      el(
        'div',
        { className: 'hero-banner-media' },
        el('img', { src: './assets/img_hero_studio.jpg', alt: 'LingoClub Hero Studio' }),
        el('div', { className: 'hero-banner-overlay' }),
        el(
          'div',
          { style: { position: 'absolute', bottom: '12px', left: '18px', right: '18px' }, className: 'row-between' },
          el(
            'div',
            { className: 'stack-xs' },
            el('span', { className: 'badge-pill', style: { background: 'rgba(255,255,255,0.22)', color: '#FFFFFF', width: 'fit-content' } }, 'FEATURED ARENA'),
            el('h2', { className: 'section-title', style: { color: '#FFFFFF' } }, 'Live Kahoot Quiz Clash')
          ),
          heroCube
        )
      ),
      el(
        'div',
        { className: 'row-between', style: { padding: '14px 18px', flexWrap: 'wrap' } },
        el('span', { className: 'small', style: { color: 'rgba(255,255,255,0.9)' } }, 'Host a 6-digit PIN room, generate AI quizzes, or race Solo Blitz!'),
        el('button', { type: 'button', className: 'btn', style: { background: '#FFFFFF', color: '#21107A' }, onClick: () => navigate('quiz') }, 'Launch Quiz Arena →')
      )
    ),

    // Quick Join 6-Char Room PIN Card
    el(
      'div',
      { className: 'card stack-sm' },
      el('div', { className: 'card-title' }, '🎯 Quick Join Live Room PIN'),
      el(
        'form',
        {
          className: 'row',
          onSubmit: async (e) => {
            e.preventDefault();
            try {
              await store.joinQuizRoom({ roomCode: pinInput.value, nickname: store.currentUserName });
              navigate('quiz');
            } catch (err) {
              store.toast(err.message, 'error');
            }
          }
        },
        pinInput,
        el('button', { type: 'submit', className: 'btn btn-primary' }, 'Join')
      )
    ),

    // Student Level, Difficulty & Content Filter
    el(
      'div',
      { className: 'card stack-sm' },
      el('div', { className: 'row-between', style: { flexWrap: 'wrap' } },
        el('div', { className: 'stack-xs' },
          el('div', { className: 'small', style: { fontWeight: '700' } }, `My Student Level: ${CEFR_LABELS[activeLevel] || activeLevel}`),
          el('div', { className: 'row-wrap' },
            ...CEFR_LEVELS.map((lvl) =>
              el('button', {
                type: 'button',
                className: `chip ${activeLevel === lvl ? 'selected' : ''}`,
                onClick: () => store.updateLearningLevel(lvl)
              }, CEFR_LABELS[lvl] || lvl)
            )
          )
        ),
        el('div', { className: 'stack-xs' },
          el('div', { className: 'small', style: { fontWeight: '700' } }, 'Game & Quiz Difficulty'),
          el('div', { className: 'row-wrap' },
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
      el('div', { className: 'stack-xs' },
        el('div', { className: 'xs muted', style: { fontWeight: '700' } }, 'Content Level Filter (Quizzes, Puzzles, Cards & Roleplays)'),
        renderCefrFilterRow(store.selectedCefrFilter, (lvl) => store.setCefrFilter(lvl))
      )
    ),

    // Global Team Leaderboard (Top 5 across all active game rooms)
    createGlobalTeamLeaderboard({ navigate, maxTeams: 5, compact: true }),

    // 12 Tactile Mode Tiles
    el('h2', { className: 'section-title' }, 'Learning Studio'),
    el(
      'div',
      { className: 'grid-modes' },
      ...modeTiles.map((m) =>
        el(
          'button',
          {
            type: 'button',
            className: 'tactile-card',
            style: { background: m.bg, color: m.ink },
            onClick: () => navigate(m.route)
          },
          el(
            'div',
            { className: 'row-between' },
            el('span', { style: { fontSize: '1.75rem', lineHeight: 1 } }, m.icon),
            el('span', { className: 'badge-pill', style: { background: 'rgba(255,255,255,0.65)', color: '#171625' } }, m.tag)
          ),
          el(
            'div',
            { className: 'stack-xs' },
            el('div', { className: 'card-title' }, m.title),
            el('div', { className: 'xs', style: { opacity: 0.85 } }, m.sub)
          )
        )
      )
    )
  );
}
