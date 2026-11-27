// Bilingual Dictionary View — 18,600+ EN↔AR Glossary with IndexedDB caching
// (1:1 port of DictionaryScreen.kt)

import { CEFR_LEVELS, el } from '../models.js';
import { CURATED_DICTIONARY, getLoadedDictionarySync, loadFullDictionary } from '../data/dictionary.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { createCefrBadge } from '../components/ui-shared.js';

let searchText = '';
let dictCefr = 'ALL';
let dictTopic = 'ALL';
let visibleLimit = 60;
let expandedId = null;
let loadTriggered = false;
let fullCount = CURATED_DICTIONARY.length;

export function renderDictionaryView({ navigate }) {
  if (!loadTriggered) {
    loadTriggered = true;
    loadFullDictionary().then((all) => {
      fullCount = all.length;
      store.emit('change');
    });
  }

  const allEntries = getLoadedDictionarySync();
  fullCount = allEntries.length;

  const topics = ['ALL', 'Daily Life', 'Academic', 'Science', 'Technology', 'Medical', 'Business', 'Legal'];
  const q = searchText.trim().toLowerCase();

  const matches = allEntries.filter((e) => {
    if (dictCefr !== 'ALL' && e.cefrLevel !== dictCefr) return false;
    if (dictTopic !== 'ALL' && !String(e.category || '').toLowerCase().includes(dictTopic.toLowerCase())) return false;
    if (!q) return true;
    return (
      e.english.toLowerCase().includes(q) ||
      (e.arabic || '').includes(q) ||
      (e.category || '').toLowerCase().includes(q)
    );
  });

  const shown = matches.slice(0, visibleLimit);

  return el(
    'div',
    { className: 'stack-lg' },
    el('div', { className: 'row-between' }, el('h1', { className: 'display-title' }, '📘 Bilingual Dictionary'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')),
    el(
      'div',
      { className: 'card card-soft-mint row-between' },
      el('div', { className: 'small' }, `📚 ${fullCount.toLocaleString()} English–Arabic words indexed (cached locally in IndexedDB)`),
      el('span', { className: 'badge-pill card-soft-primary mono' }, `${matches.length.toLocaleString()} matches`)
    ),
    el('input', {
      id: 'dictionary-search-input',
      type: 'search',
      className: 'field',
      placeholder: 'Search English word, Arabic translation, or topic...',
      value: searchText,
      onInput: (e) => {
        searchText = e.target.value;
        visibleLimit = 60;
        store.emit('change');
      }
    }),
    el(
      'div',
      { className: 'stack-xs' },
      el(
        'div',
        { className: 'scroll-x' },
        el('button', { type: 'button', className: `chip ${dictCefr === 'ALL' ? 'selected' : ''}`, onClick: () => { dictCefr = 'ALL'; store.emit('change'); } }, 'All Levels'),
        ...CEFR_LEVELS.map((l) => el('button', { type: 'button', className: `chip ${dictCefr === l ? 'selected' : ''}`, onClick: () => { dictCefr = l; store.emit('change'); } }, l))
      ),
      el(
        'div',
        { className: 'scroll-x' },
        ...topics.map((t) => el('button', { type: 'button', className: `chip ${dictTopic === t ? 'selected' : ''}`, onClick: () => { dictTopic = t; store.emit('change'); } }, t === 'ALL' ? 'All Topics' : t))
      )
    ),
    el(
      'div',
      { className: 'stack-sm' },
      ...shown.map((entry) => {
        const isOpen = expandedId === entry.id;
        return el(
          'div',
          { className: 'card stack-xs' },
          el(
            'div',
            {
              className: 'row-between',
              style: { cursor: 'pointer' },
              onClick: () => { expandedId = isOpen ? null : entry.id; store.emit('change'); }
            },
            el(
              'div',
              { className: 'stack-xs flex-1' },
              el('div', { className: 'row-wrap' }, el('span', { className: 'card-title' }, entry.english), entry.partOfSpeech ? el('span', { className: 'xs muted' }, entry.partOfSpeech) : null, createCefrBadge(entry.cefrLevel)),
              el('div', { className: 'arabic-text', style: { fontWeight: '700', color: 'var(--primary)' } }, entry.arabic)
            ),
            el(
              'div',
              { className: 'row', style: { gap: '4px' } },
              el('button', { type: 'button', className: 'btn-icon', ariaLabel: `Pronounce ${entry.english}`, onClick: (e) => { e.stopPropagation(); ttsSpeaker.speak(entry.english); } }, '🔊'),
              el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Save to deck', onClick: (e) => { e.stopPropagation(); store.quickSaveWordToDeck(entry); } }, '➕')
            )
          ),
          isOpen
            ? el(
                'div',
                { className: 'stack-xs', style: { borderTop: '1px solid var(--outline-soft)', paddingTop: '8px' } },
                entry.phonetic ? el('div', { className: 'small mono muted' }, `IPA: ${entry.phonetic}`) : null,
                entry.category ? el('div', { className: 'xs muted' }, `Domain: ${entry.category}`) : null,
                entry.example ? el('div', { className: 'small' }, `Example: "${entry.example}"`) : null,
                el('button', { type: 'button', className: 'btn btn-soft', onClick: () => ttsSpeaker.speak(entry.arabic, { lang: 'ar-SA' }) }, '🔊 Speak Arabic')
              )
            : null
        );
      })
    ),
    matches.length > shown.length
      ? el('button', { type: 'button', className: 'btn btn-outline btn-full', onClick: () => { visibleLimit += 60; store.emit('change'); } }, `Load More (${matches.length - shown.length} remaining)`)
      : null
  );
}
