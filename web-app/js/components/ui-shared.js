// Shared UI Components: CEFR Badges/Filter, Tap-to-Translate Popover, Modals, Toasts, Squad Chat Modal

import { CEFR_LEVELS, el, clearEl } from '../models.js';
import { lookupGlossaryWord } from '../data/dictionary.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { getSavedGeminiKey, setSavedGeminiKey } from '../services/offline-store.js';
import { store } from '../store/app-store.js';

export function createCefrBadge(level) {
  const safe = CEFR_LEVELS.includes(level) ? level : 'B1';
  return el('span', { className: `badge-pill cefr-${safe}` }, safe);
}

export function renderCefrFilterRow(selectedLevel, onSelect) {
  return el(
    'div',
    { className: 'scroll-x', role: 'group', ariaLabel: 'Filter by CEFR level' },
    el(
      'button',
      {
        type: 'button',
        className: `chip ${!selectedLevel ? 'selected' : ''}`,
        onClick: () => onSelect(null)
      },
      'All Levels'
    ),
    ...CEFR_LEVELS.map((lvl) =>
      el(
        'button',
        {
          type: 'button',
          className: `chip ${selectedLevel === lvl ? 'selected' : ''}`,
          onClick: () => onSelect(lvl)
        },
        lvl
      )
    )
  );
}

export function showToast(message, kind = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const node = el(
    'div',
    { className: `toast-item ${kind}` },
    el('span', {}, message),
    el(
      'button',
      {
        type: 'button',
        style: { background: 'transparent', border: 'none', color: 'inherit', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' },
        ariaLabel: 'Dismiss notification',
        onClick: () => node.remove()
      },
      '✕'
    )
  );
  root.appendChild(node);
  setTimeout(() => {
    if (node.isConnected) node.remove();
  }, 3800);
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  clearEl(root);
  root.classList.add('hidden');
}

export function openModal({ title, subtitle = '', content, maxWidth = 540 }) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  clearEl(root);

  const card = el(
    'div',
    {
      className: 'modal-card stack-md',
      style: { maxWidth: `${maxWidth}px` },
      onClick: (e) => e.stopPropagation()
    },
    el(
      'div',
      { className: 'row-between' },
      el(
        'div',
        { className: 'stack-xs flex-1' },
        el('h2', { className: 'section-title' }, title),
        subtitle ? el('p', { className: 'small muted', style: { margin: 0 } }, subtitle) : null
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'btn-icon',
          ariaLabel: 'Close modal',
          onClick: closeModal
        },
        '✕'
      )
    ),
    content
  );

  root.onclick = closeModal;
  root.appendChild(card);
  root.classList.remove('hidden');
}

export function closeTranslationPopover() {
  const root = document.getElementById('popover-root');
  if (!root) return;
  clearEl(root);
  root.classList.add('hidden');
}

export function openTranslationPopover(rawToken, cefrLevel = 'B1') {
  const root = document.getElementById('popover-root');
  if (!root) return;
  const entry = lookupGlossaryWord(rawToken);
  clearEl(root);

  const cleanWord = String(rawToken || '').replace(/[^a-zA-Z'-]/g, '') || rawToken;
  const displayWord = entry?.english || cleanWord;
  const displayAr = entry?.arabic || 'اضغط لحفظ الكلمة أو استمع للنطق الإنجليزي';

  const card = el(
    'div',
    {
      className: 'modal-card stack-md',
      onClick: (e) => e.stopPropagation()
    },
    el(
      'div',
      { className: 'row-between' },
      el(
        'div',
        { className: 'row-wrap' },
        el('span', { className: 'badge-pill cefr-' + (entry?.cefrLevel || cefrLevel) }, entry?.cefrLevel || cefrLevel),
        entry?.partOfSpeech ? el('span', { className: 'small muted' }, entry.partOfSpeech) : null,
        entry?.phonetic ? el('span', { className: 'small mono muted' }, entry.phonetic) : null
      ),
      el(
        'button',
        { type: 'button', className: 'btn-icon', ariaLabel: 'Close translation', onClick: closeTranslationPopover },
        '✕'
      )
    ),
    el('h2', { className: 'display-title', style: { fontSize: '1.65rem' } }, displayWord),
    el(
      'div',
      { className: 'card card-soft-primary stack-xs' },
      el('div', { className: 'arabic-text', style: { fontSize: '1.35rem', fontWeight: '800' } }, displayAr),
      entry?.example ? el('p', { className: 'small', style: { margin: 0 } }, `"${entry.example}"`) : null
    ),
    el(
      'div',
      { className: 'row-wrap' },
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-primary flex-1',
          onClick: () => ttsSpeaker.speak(displayWord, { lang: 'en-US' })
        },
        '🔊 Listen (EN)'
      ),
      entry?.arabic
        ? el(
            'button',
            {
              type: 'button',
              className: 'btn btn-outline',
              onClick: () => ttsSpeaker.speak(entry.arabic, { lang: 'ar-SA' })
            },
            '🔊 AR'
          )
        : null,
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-mint flex-1',
          onClick: async () => {
            await store.quickSaveWordToDeck({
              english: displayWord,
              arabic: entry?.arabic || '',
              phonetic: entry?.phonetic || '',
              example: entry?.example || '',
              cefrLevel: entry?.cefrLevel || cefrLevel
            });
            closeTranslationPopover();
          }
        },
        '➕ Save to Deck'
      )
    )
  );

  root.onclick = closeTranslationPopover;
  root.appendChild(card);
  root.classList.remove('hidden');
}

export function renderTranslatableText(text, { className = '', cefrLevel = 'B1' } = {}) {
  const container = el('span', { className });
  const parts = String(text || '').split(/(\s+)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      container.appendChild(document.createTextNode(part));
      continue;
    }
    const clean = part.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (clean.length >= 2) {
      const span = el(
        'span',
        {
          className: 'translatable-word',
          role: 'button',
          tabindex: '0',
          title: `Tap to translate "${clean}"`,
          onClick: (e) => {
            e.stopPropagation();
            openTranslationPopover(clean, cefrLevel);
          },
          onKeydown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openTranslationPopover(clean, cefrLevel);
            }
          }
        },
        part
      );
      container.appendChild(span);
    } else {
      container.appendChild(document.createTextNode(part));
    }
  }
  return container;
}

export function openAiKeyModal() {
  const input = el('input', {
    type: 'password',
    className: 'field mono',
    placeholder: 'AIza... (optional Gemini API key)',
    value: getSavedGeminiKey()
  });

  const body = el(
    'div',
    { className: 'stack-md' },
    el(
      'div',
      { className: 'card card-soft-primary small' },
      'All AI features (Quiz Generator, Roleplay Generator, and Speech Coach) already include smart built-in offline engines! Optionally add your own Google Gemini API key below (stored only in your browser localStorage) for live cloud LLM generation.'
    ),
    el('label', { className: 'field-label' }, 'Optional Gemini API Key'),
    input,
    el(
      'div',
      { className: 'row-between' },
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-danger-soft',
          onClick: () => {
            setSavedGeminiKey('');
            store.toast('Cleared Gemini API key — using built-in offline AI engine.');
            closeModal();
          }
        },
        'Clear Key'
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-primary',
          onClick: () => {
            setSavedGeminiKey(input.value);
            store.toast(input.value.trim() ? 'Gemini API key saved locally!' : 'Using offline AI engine.');
            closeModal();
          }
        },
        'Save Key'
      )
    )
  );

  openModal({
    title: 'AI Engine Settings',
    subtitle: 'Configure Gemini Cloud AI or built-in Offline Engine',
    content: body
  });
}

export function openInGameSquadChatModal() {
  const wrap = el('div', { className: 'stack-md' });
  const listEl = el('div', { className: 'card chat-scroll', style: { background: 'var(--surface-variant)' } });

  const renderMsgs = () => {
    clearEl(listEl);
    const msgs = store.chatMessages || [];
    if (!msgs.length) {
      listEl.appendChild(el('p', { className: 'small muted', style: { textAlign: 'center', margin: '16px 0' } }, 'No messages in your squad yet. Say hi!'));
      return;
    }
    msgs.slice(-25).forEach((m) => {
      const mine = m.senderUid === store.currentUserId;
      listEl.appendChild(
        el(
          'div',
          { className: `chat-bubble ${mine ? 'mine' : ''}` },
          el('div', { className: 'xs', style: { fontWeight: '800' } }, m.senderName || 'Member'),
          el('div', { className: 'small' }, m.text)
        )
      );
    });
    listEl.scrollTop = listEl.scrollHeight;
  };

  const quick = ['Great round! 👏', 'Ready for the next question!', 'Need a clue? 🔍', 'Let\'s practice English!'];
  const quickRow = el(
    'div',
    { className: 'scroll-x' },
    ...quick.map((q) =>
      el('button', { type: 'button', className: 'chip', onClick: () => store.sendTeamMessage(q) }, q)
    )
  );

  const input = el('input', { type: 'text', className: 'field flex-1', placeholder: 'Send a quick squad note...' });
  const sendBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-primary',
      onClick: () => {
        if (!input.value.trim()) return;
        store.sendTeamMessage(input.value);
        input.value = '';
      }
    },
    'Send'
  );

  wrap.append(
    el('p', { className: 'small muted', style: { margin: 0 } }, `Active Channel: ${store.profile?.teamName || 'Club Squad'}`),
    listEl,
    quickRow,
    el('div', { className: 'row' }, input, sendBtn)
  );
  renderMsgs();

  const onChange = () => {
    if (!listEl.isConnected) {
      store.removeEventListener('change', onChange);
      return;
    }
    renderMsgs();
  };
  store.addEventListener('change', onChange);

  openModal({
    title: '💬 Squad Quick Chat',
    subtitle: 'Chat with teammates without losing your game progress',
    content: wrap
  });
}
