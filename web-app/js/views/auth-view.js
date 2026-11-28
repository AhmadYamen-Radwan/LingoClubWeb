// Auth View (1:1 port of AuthScreen.kt)

import { el } from '../models.js';
import { store } from '../store/app-store.js';
import { getSavedExplorerName } from '../services/offline-store.js';
import { createLanguageCubeCanvas } from '../components/canvas-3d.js';

export function renderAuthView({ navigate }) {
  let busy = false;
  let errorMsg = store.authError || '';
  const nameInput = el('input', {
    type: 'text',
    className: 'field',
    placeholder: 'Your Explorer nickname (e.g. Sarah)',
    value: getSavedExplorerName(),
    maxLength: 40
  });

  const cube = createLanguageCubeCanvas({
    size: 86,
    onTap: () => store.toast('Drag or tap the 3D EN↔AR cube!')
  });

  const errorBox = el(
    'div',
    { className: `card card-soft-secondary small ${errorMsg ? '' : 'hidden'}` },
    errorMsg
  );

  const googleBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-primary btn-full',
      onClick: async () => {
        if (busy) return;
        busy = true;
        errorMsg = '';
        errorBox.classList.add('hidden');
        googleBtn.disabled = true;
        redirectBtn.disabled = true;
        googleBtn.textContent = 'Connecting to Google...';
        try {
          const user = await store.signInWithGoogle({ preferRedirect: false, silentToast: true });
          if (user) {
            navigate('home');
          }
        } catch (err) {
          errorMsg = err?.message || 'Google Sign-In failed. You can also try Redirect Sign-In or Offline Explorer below.';
          errorBox.textContent = errorMsg;
          errorBox.classList.remove('hidden');
        } finally {
          busy = false;
          googleBtn.disabled = false;
          redirectBtn.disabled = false;
          googleBtn.textContent = '🔐 Continue with Google (Cloud Sync)';
        }
      }
    },
    '🔐 Continue with Google (Cloud Sync)'
  );

  const redirectBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-outline btn-full',
      onClick: async () => {
        if (busy) return;
        busy = true;
        errorMsg = '';
        errorBox.classList.add('hidden');
        googleBtn.disabled = true;
        redirectBtn.disabled = true;
        redirectBtn.textContent = 'Redirecting to Google...';
        try {
          await store.signInWithGoogle({ preferRedirect: true, silentToast: true });
        } catch (err) {
          errorMsg = err?.message || 'Google Redirect Sign-In failed.';
          errorBox.textContent = errorMsg;
          errorBox.classList.remove('hidden');
          busy = false;
          googleBtn.disabled = false;
          redirectBtn.disabled = false;
          redirectBtn.textContent = '↗ Sign in via Full-Page Redirect (Mobile)';
        }
      }
    },
    '↗ Sign in via Full-Page Redirect (Mobile)'
  );

  const offlineBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-mint btn-full',
      onClick: () => {
        store.authError = '';
        store.enterOfflineMode(nameInput.value.trim() || 'Offline Explorer');
        navigate('home');
      }
    },
    '🧭 Start as Offline Explorer (Instant Access)'
  );

  const highlights = [
    '⚡ Live Kahoot Quiz Clash',
    '📅 200-Word Weekly Club',
    '🕵️ Crime Mystery Arcade',
    '📘 18,600+ EN↔AR Dictionary'
  ];

  return el(
    'div',
    { className: 'stack-lg', style: { maxWidth: '560px', margin: '12px auto' } },
    el(
      'div',
      { className: 'hero-banner', style: { padding: '22px' } },
      el(
        'div',
        { className: 'row-between' },
        el(
          'div',
          { className: 'row', style: { gap: '14px' } },
          el('img', {
            src: './assets/img_3d_lingo_mascot.jpg',
            alt: 'LingoClub 3D mascot',
            style: { width: '68px', height: '68px', borderRadius: '18px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.45)' }
          }),
          el(
            'div',
            { className: 'stack-xs' },
            el('h1', { className: 'display-title', style: { color: '#FFFFFF' } }, 'LingoClub'),
            el('p', { className: 'small', style: { margin: 0, color: 'rgba(255,255,255,0.9)' } }, 'Bilingual English–Arabic Social Studio')
          )
        ),
        cube
      ),
      el(
        'div',
        { className: 'row-wrap', style: { marginTop: '14px' } },
        ...highlights.map((h) =>
          el('span', { className: 'badge-pill', style: { background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' } }, h)
        )
      )
    ),
    errorBox,
    el(
      'div',
      { className: 'card stack-md' },
      el('h2', { className: 'section-title' }, 'Cloud Sync & Multiplayer'),
      el('p', { className: 'small muted', style: { margin: 0 } }, 'Sign in with Google to sync XP, custom decks, live Kahoot rooms, and squad scores across Android and Web.'),
      googleBtn,
      redirectBtn
    ),
    el(
      'div',
      { className: 'card stack-md' },
      el('h2', { className: 'section-title' }, 'Instant Offline Explorer'),
      el('p', { className: 'small muted', style: { margin: 0 } }, 'Use all 400 weekly words, 18 animated games, 18,600+ word dictionary, audiobooks, flashcards, and cross-tab squad rooms immediately in this browser.'),
      el('label', { className: 'field-label' }, 'Explorer Display Name'),
      nameInput,
      offlineBtn
    )
  );
}
