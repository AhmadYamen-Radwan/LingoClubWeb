// Deck Studio 3D Flashcards View (1:1 port of CardsScreen.kt)

import { ActivityType, CEFR_LEVELS, el, sanitizeId, shuffleArray } from '../models.js';
import { FLASHCARD_DECKS } from '../data/curated-content.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { closeModal, createCefrBadge, openModal, renderTranslatableText } from '../components/ui-shared.js';

let activeDeckId = null;
let cardIndex = 0;
let isFlipped = false;
let needsReviewOnly = false;
let shuffledOrder = null;

function openDeckEditorModal(existingDeck = null) {
  const titleInput = el('input', { type: 'text', className: 'field', placeholder: 'Deck Title (e.g., Medical Verbs)', value: existingDeck?.title || '' });
  const levelSel = el('select', { className: 'field' }, ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === (existingDeck?.cefrLevel || 'B1') }, l)));
  const cards = (existingDeck?.cards || [{ term: '', translation: '', pronunciation: '', exampleSentence: '' }]).map((c) => ({ ...c }));
  const cardsWrap = el('div', { className: 'stack-sm' });

  const renderRows = () => {
    while (cardsWrap.firstChild) cardsWrap.removeChild(cardsWrap.firstChild);
    cards.forEach((c, i) => {
      cardsWrap.appendChild(
        el(
          'div',
          { className: 'card stack-xs', style: { background: 'var(--surface-variant)' } },
          el(
            'div',
            { className: 'row-between' },
            el('strong', {}, `Card ${i + 1}`),
            cards.length > 1 ? el('button', { type: 'button', className: 'btn btn-danger-soft', onClick: () => { cards.splice(i, 1); renderRows(); } }, '✕') : null
          ),
          el('input', { type: 'text', className: 'field', placeholder: 'English term', value: c.term, onInput: (e) => { c.term = e.target.value; } }),
          el('input', { type: 'text', className: 'field arabic-text', placeholder: 'Arabic meaning', value: c.translation, onInput: (e) => { c.translation = e.target.value; } }),
          el('input', { type: 'text', className: 'field', placeholder: 'Pronunciation / IPA (optional)', value: c.pronunciation || '', onInput: (e) => { c.pronunciation = e.target.value; } }),
          el('input', { type: 'text', className: 'field', placeholder: 'Example sentence', value: c.exampleSentence || '', onInput: (e) => { c.exampleSentence = e.target.value; } })
        )
      );
    });
  };
  renderRows();

  openModal({
    title: existingDeck ? '✏️ Edit Flashcard Deck' : '🃏 Create Flashcard Deck',
    subtitle: 'Add up to 40 bilingual cards',
    content: el(
      'div',
      { className: 'stack-md' },
      titleInput,
      levelSel,
      cardsWrap,
      el(
        'div',
        { className: 'row-between' },
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { if (cards.length < 40) { cards.push({ term: '', translation: '', pronunciation: '', exampleSentence: '' }); renderRows(); } } }, '+ Add Card'),
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-primary',
            onClick: async () => {
              const title = titleInput.value.trim();
              const valid = cards.filter((c) => c.term.trim() && c.translation.trim()).map((c) => ({
                term: c.term.trim(),
                translation: c.translation.trim(),
                pronunciation: (c.pronunciation || '').trim(),
                exampleSentence: (c.exampleSentence || c.term).trim()
              }));
              if (!title || !valid.length) return store.toast('Enter deck title and at least 1 card.', 'error');
              if (existingDeck) await store.updateCustomDeck(existingDeck.id, { title, cefrLevel: levelSel.value, cards: valid });
              else await store.saveCustomDeck({ title, cefrLevel: levelSel.value, cards: valid });
              closeModal();
            }
          },
          'Save Deck'
        )
      )
    )
  });
}

export function renderCardsView({ navigate }) {
  const cefrFilter = store.selectedCefrFilter;
  const clubDecks = (store.clubContent || []).filter((c) => c.contentType === 'DECK' && (!cefrFilter || c.cefrLevel === cefrFilter));
  const customDecks = (store.customDecks || []).filter((d) => !cefrFilter || d.cefrLevel === cefrFilter);
  const curated = FLASHCARD_DECKS.filter((d) => !cefrFilter || d.cefrLevel === cefrFilter);

  const allDecks = [...clubDecks, ...customDecks, ...curated];
  const selectedDeck = allDecks.find((d) => d.id === activeDeckId);

  if (selectedDeck) {
    const rawCards = selectedDeck.cards || [];
    const masteryMap = store.cardMastery || {};
    const indexedCards = rawCards
      .map((c, origIdx) => ({
        card: c,
        origIdx,
        mastered: Boolean(masteryMap[sanitizeId(`${selectedDeck.id}_${origIdx}`)]?.mastered)
      }))
      .filter((item) => (!needsReviewOnly ? true : !item.mastered));

    const order = shuffledOrder && shuffledOrder.length === indexedCards.length
      ? shuffledOrder.map((i) => indexedCards[i]).filter(Boolean)
      : indexedCards;

    const current = order[cardIndex % Math.max(1, order.length)];
    let pointerStartX = 0;

    return el(
      'div',
      { className: 'stack-lg' },
      el(
        'div',
        { className: 'row-between' },
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { activeDeckId = null; cardIndex = 0; isFlipped = false; shuffledOrder = null; store.emit('change'); } }, '← All Decks'),
        createCefrBadge(selectedDeck.cefrLevel || 'B1')
      ),
      el(
        'div',
        { className: 'row-between', style: { flexWrap: 'wrap' } },
        el('h2', { className: 'section-title' }, selectedDeck.title),
        el(
          'div',
          { className: 'row' },
          el('button', { type: 'button', className: `chip ${needsReviewOnly ? 'selected' : ''}`, onClick: () => { needsReviewOnly = !needsReviewOnly; cardIndex = 0; isFlipped = false; shuffledOrder = null; store.emit('change'); } }, needsReviewOnly ? 'Needs Review' : 'All Cards'),
          el('button', { type: 'button', className: 'chip', onClick: () => { shuffledOrder = shuffleArray(indexedCards.map((_, i) => i)); cardIndex = 0; isFlipped = false; store.emit('change'); } }, '🔀 Shuffle')
        )
      ),
      !current
        ? el('div', { className: 'card card-soft-mint', style: { textAlign: 'center', padding: '26px' } }, '🎉 Every card in this filter is mastered! Toggle "All Cards" to review.')
        : el(
            'div',
            { className: 'stack-md' },
            el(
              'div',
              {
                className: 'flip-scene',
                onPointerdown: (e) => { pointerStartX = e.clientX; },
                onPointerup: (e) => {
                  const dx = e.clientX - pointerStartX;
                  if (Math.abs(dx) > 48) {
                    cardIndex = (cardIndex + (dx < 0 ? 1 : -1) + order.length) % order.length;
                    isFlipped = false;
                    store.emit('change');
                  }
                }
              },
              el(
                'div',
                {
                  className: `flip-card ${isFlipped ? 'flipped' : ''}`,
                  role: 'button',
                  tabindex: '0',
                  ariaLabel: 'Flip flashcard',
                  onClick: () => { isFlipped = !isFlipped; store.emit('change'); }
                },
                el(
                  'div',
                  { className: 'flip-face flip-front' },
                  el('div', { className: 'row-between' }, el('span', { className: 'xs mono muted' }, `CARD ${(cardIndex % order.length) + 1} / ${order.length}`), el('button', { type: 'button', className: 'btn-icon', onClick: (e) => { e.stopPropagation(); ttsSpeaker.speak(current.card.term); } }, '🔊')),
                  el('div', { style: { textAlign: 'center' } }, el('h3', { className: 'display-title' }, current.card.term), current.card.pronunciation ? el('div', { className: 'small mono muted' }, current.card.pronunciation) : null),
                  el('div', { className: 'xs muted', style: { textAlign: 'center' } }, 'Tap card to flip · Swipe left/right for next')
                ),
                el(
                  'div',
                  { className: 'flip-face flip-back' },
                  el('div', { className: 'row-between' }, el('span', { className: 'xs' }, 'ARABIC MEANING'), el('button', { type: 'button', className: 'btn-icon', onClick: (e) => { e.stopPropagation(); ttsSpeaker.speak(current.card.translation, { lang: 'ar-SA' }); } }, '🔊')),
                  el('div', { className: 'arabic-text', style: { textAlign: 'center', fontSize: '1.65rem', fontWeight: '800' } }, current.card.translation),
                  el('div', { className: 'small', style: { textAlign: 'center' } }, renderTranslatableText(current.card.exampleSentence || '', { cefrLevel: selectedDeck.cefrLevel }))
                )
              )
            ),
            el(
              'div',
              { className: 'row-between' },
              el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { cardIndex = (cardIndex - 1 + order.length) % order.length; isFlipped = false; store.emit('change'); } }, '← Prev'),
              el('button', { type: 'button', className: `btn ${current.mastered ? 'btn-outline' : 'btn-mint'}`, onClick: () => store.toggleCardMastery(selectedDeck.id, current.origIdx, !current.mastered) }, current.mastered ? '↺ Practicing' : '✓ Mastered (+8 XP)'),
              el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { cardIndex = (cardIndex + 1) % order.length; isFlipped = false; store.emit('change'); } }, 'Next →')
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn-primary btn-full',
                onClick: async () => {
                  await store.awardActivityProgress({
                    xpDelta: 25,
                    activityType: ActivityType.CARDS,
                    title: `Deck Study: ${selectedDeck.title}`,
                    cefrLevel: selectedDeck.cefrLevel,
                    score: order.length * 10,
                    accuracyPct: 100,
                    wordsPracticed: order.length,
                    durationMinutes: 3
                  });
                  store.confetti();
                  store.toast('Deck session logged! +25 XP');
                }
              },
              'Save Study Session (+25 XP)'
            )
          )
    );
  }

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('h1', { className: 'display-title' }, '🃏 Deck Studio'),
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
    ),
    el(
      'div',
      { className: 'hero-banner' },
      el(
        'div',
        { className: 'hero-banner-media', style: { height: '128px' } },
        el('img', { src: './assets/img_party_cards.jpg', alt: 'Deck Studio Cards' }),
        el('div', { className: 'hero-banner-overlay' }),
        el('div', { style: { position: 'absolute', bottom: '12px', left: '16px' } }, el('h2', { className: 'section-title', style: { color: '#FFFFFF' } }, '3D Flip Bilingual Flashcards'))
      )
    ),
    el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: () => openDeckEditorModal(null) }, '➕ Create Custom Flashcard Deck'),
    customDecks.length
      ? el(
          'div',
          { className: 'stack-sm' },
          el('h2', { className: 'section-title' }, '📁 My Custom Decks'),
          el(
            'div',
            { className: 'grid-2' },
            ...customDecks.map((d) =>
              el(
                'div',
                { className: 'card stack-sm' },
                el('div', { className: 'row-between' }, el('div', { className: 'card-title' }, d.title), createCefrBadge(d.cefrLevel)),
                el('div', { className: 'small muted' }, `${(d.cards || []).length} cards`),
                el(
                  'div',
                  { className: 'row' },
                  el('button', { type: 'button', className: 'btn btn-primary flex-1', onClick: () => { activeDeckId = d.id; cardIndex = 0; isFlipped = false; store.emit('change'); } }, 'Study'),
                  el('button', { type: 'button', className: 'btn btn-outline', onClick: () => openDeckEditorModal(d) }, '✏️'),
                  el('button', { type: 'button', className: 'btn btn-danger-soft', onClick: () => store.deleteCustomDeck(d.id) }, '🗑')
                )
              )
            )
          )
        )
      : null,
    el(
      'div',
      { className: 'stack-sm' },
      el('h2', { className: 'section-title' }, `📚 Curated Decks (${curated.length + clubDecks.length})`),
      el(
        'div',
        { className: 'grid-2' },
        ...[...clubDecks, ...curated].map((d) =>
          el(
            'div',
            { className: 'card stack-sm' },
            el('div', { className: 'row-between' }, el('div', { className: 'card-title' }, d.title), createCefrBadge(d.cefrLevel)),
            el('div', { className: 'small muted' }, `${d.description || 'Interactive bilingual deck'} · ${(d.cards || []).length} cards`),
            el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: () => { activeDeckId = d.id; cardIndex = 0; isFlipped = false; store.emit('change'); } }, 'Open 3D Deck →')
          )
        )
      )
    )
  );
}
