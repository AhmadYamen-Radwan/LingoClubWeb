// LingoClub SPA Entrypoint & Hash/History Router

import { clearEl, el } from './js/models.js';
import { store } from './js/store/app-store.js';
import { loadFullDictionary } from './js/data/dictionary.js';
import { ttsSpeaker } from './js/services/speech-media.js';
import { showToast } from './js/components/ui-shared.js';
import { triggerConfettiBurst } from './js/components/canvas-3d.js';

import { renderAuthView } from './js/views/auth-view.js';
import { renderHomeView } from './js/views/home-view.js';
import { patchQuizArenaLiveRoom, renderQuizArenaView, stopQuizTimers } from './js/views/quiz-arena-view.js';
import { renderArcadeView, stopArcadeTimers } from './js/views/arcade-view.js';
import { renderLeaderboardView } from './js/views/leaderboard-view.js';
import { renderCurriculumView } from './js/views/curriculum-view.js';
import { renderAudiobooksView } from './js/views/audiobooks-view.js';
import { patchTeamChatView, renderTeamChatView } from './js/views/team-chat-view.js';
import { renderTutorDashboardView } from './js/views/tutor-dashboard-view.js';
import { renderProfileView } from './js/views/profile-view.js';
import { renderPuzzlesView } from './js/views/puzzles-view.js';
import { renderCardsView } from './js/views/cards-view.js';
import { renderGuessingView, stopGuessingTimer } from './js/views/guessing-view.js';
import { renderRoleplayView } from './js/views/roleplay-view.js';
import { renderDictionaryView } from './js/views/dictionary-view.js';

const ROUTES = {
  auth: renderAuthView,
  home: renderHomeView,
  quiz: renderQuizArenaView,
  arcade: renderArcadeView,
  leaderboard: renderLeaderboardView,
  curriculum: renderCurriculumView,
  audiobooks: renderAudiobooksView,
  chat: renderTeamChatView,
  tutor: renderTutorDashboardView,
  profile: renderProfileView,
  puzzles: renderPuzzlesView,
  cards: renderCardsView,
  guessing: renderGuessingView,
  roleplay: renderRoleplayView,
  dictionary: renderDictionaryView
};

const NAV_ITEMS = [
  { route: 'home', icon: '🏠', label: 'Studio' },
  { route: 'quiz', icon: '⚡', label: 'Quiz' },
  { route: 'curriculum', icon: '📅', label: 'Weekly' },
  { route: 'arcade', icon: '🎮', label: 'Arcade' },
  { route: 'chat', icon: '💬', label: 'Squad' }
];

function getRouteFromHash() {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
  return ROUTES[raw] ? raw : 'home';
}

function navigate(route) {
  const target = ROUTES[route] ? route : 'home';
  if (getRouteFromHash() !== target) {
    window.location.hash = `#/${target}`;
  } else {
    renderApp();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderNavigation(currentRoute, signedIn) {
  const rail = document.getElementById('nav-rail');
  const bottom = document.getElementById('bottom-nav');
  const appRoot = document.getElementById('app-root');
  if (!rail || !bottom || !appRoot) return;

  if (!signedIn || currentRoute === 'auth') {
    rail.classList.add('hidden');
    bottom.classList.add('hidden');
    appRoot.classList.add('no-nav');
    return;
  }

  rail.classList.remove('hidden');
  bottom.classList.remove('hidden');
  appRoot.classList.remove('no-nav');

  clearEl(rail);
  rail.appendChild(
    el('img', { src: './assets/app_icon_lingoclub.jpg', alt: 'LingoClub', className: 'rail-brand', style: { cursor: 'pointer' }, onClick: () => navigate('home') })
  );
  NAV_ITEMS.forEach((item) => {
    rail.appendChild(
      el(
        'button',
        {
          type: 'button',
          className: `rail-btn ${currentRoute === item.route ? 'active' : ''}`,
          onClick: () => navigate(item.route)
        },
        el('span', { className: 'nav-icon' }, item.icon),
        el('span', {}, item.label)
      )
    );
  });
  rail.appendChild(
    el(
      'button',
      {
        type: 'button',
        className: `rail-btn ${currentRoute === 'profile' ? 'active' : ''}`,
        style: { marginTop: 'auto' },
        onClick: () => navigate('profile')
      },
      el('span', { className: 'nav-icon' }, '👤'),
      el('span', {}, 'Profile')
    )
  );

  clearEl(bottom);
  NAV_ITEMS.forEach((item) => {
    bottom.appendChild(
      el(
        'button',
        {
          type: 'button',
          className: `bnav-btn ${currentRoute === item.route ? 'active' : ''}`,
          onClick: () => navigate(item.route)
        },
        el('span', { className: 'nav-pill' }, item.icon),
        el('span', {}, item.label)
      )
    );
  });
}

function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  const isSignedIn = store.authMode === 'GOOGLE' || store.authMode === 'OFFLINE';
  let route = getRouteFromHash();

  if (!isSignedIn) {
    route = 'auth';
  } else if (route === 'auth') {
    route = 'home';
  }

  renderNavigation(route, isSignedIn);

  // In-place patch for live-updating routes with active chat inputs so the mobile soft keyboard never drops or wipes typed drafts
  if (route === 'chat' && document.getElementById('team-chat-shell')) {
    if (patchTeamChatView()) return;
  }
  if (route === 'quiz' && store.roomSession?.room && document.getElementById('live-room-shell')) {
    if (patchQuizArenaLiveRoom()) return;
  }

  // Preserve active input focus, cursor selection, and typed value across view re-renders
  const activeEl = document.activeElement;
  const activeElId = activeEl?.id || null;
  const activeSelStart = typeof activeEl?.selectionStart === 'number' ? activeEl.selectionStart : null;
  const activeSelEnd = typeof activeEl?.selectionEnd === 'number' ? activeEl.selectionEnd : null;

  const viewFn = ROUTES[route] || renderHomeView;
  const viewNode = viewFn({ navigate, route });

  clearEl(root);
  root.appendChild(viewNode);

  if (activeElId) {
    const restored = document.getElementById(activeElId);
    if (restored && typeof restored.focus === 'function') {
      restored.focus({ preventScroll: true });
      if (activeSelStart !== null && typeof restored.setSelectionRange === 'function') {
        try {
          restored.setSelectionRange(activeSelStart, activeSelEnd ?? activeSelStart);
        } catch (_) {}
      }
    }
  }
}

// Subscribe to global store events
store.addEventListener('change', () => renderApp());
store.addEventListener('auth', () => {
  const isSignedIn = store.authMode === 'GOOGLE' || store.authMode === 'OFFLINE';
  if (isSignedIn && getRouteFromHash() === 'auth') {
    navigate('home');
  } else {
    renderApp();
  }
});
store.addEventListener('toast', (e) => showToast(e.detail?.message || '', e.detail?.kind || 'info'));
store.addEventListener('confetti', () => triggerConfettiBurst());

window.addEventListener('hashchange', () => {
  ttsSpeaker.stop();
  const nextRoute = getRouteFromHash();
  if (nextRoute !== 'quiz') stopQuizTimers();
  if (nextRoute !== 'arcade') stopArcadeTimers();
  if (nextRoute !== 'guessing') stopGuessingTimer();
  renderApp();
});

// Preload 18.6K+ TSV dictionary in background after initial paint
setTimeout(() => {
  loadFullDictionary().catch(() => {});
}, 400);

renderApp();
