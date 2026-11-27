// Leveled Audiobook Lounge View (1:1 port of AudiobooksScreen.kt)

import { ActivityType, el } from '../models.js';
import { CURATED_AUDIOBOOKS } from '../data/audiobooks.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, renderTranslatableText } from '../components/ui-shared.js';

let selectedBookId = null;
let selectedChapterIdx = 0;
let isPlaying = false;
let activeParagraphIdx = -1;
let playbackRate = 1.0;
let showArabic = true;

function stopAudio() {
  ttsSpeaker.stop();
  isPlaying = false;
  activeParagraphIdx = -1;
}

export function renderAudiobooksView({ navigate }) {
  const cefrFilter = store.selectedCefrFilter;
  const books = CURATED_AUDIOBOOKS.filter((b) => !cefrFilter || b.cefrLevel === cefrFilter);

  if (!selectedBookId) {
    return el(
      'div',
      { className: 'stack-lg' },
      el(
        'div',
        { className: 'row-between' },
        el('h1', { className: 'display-title' }, '🎧 Audiobook Lounge'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')
      ),
      el('p', { className: 'small muted', style: { margin: 0 } }, 'Listen to leveled bilingual stories with auto-advancing paragraphs, adjustable speed, and tap-to-translate words.'),
      el(
        'div',
        { className: 'grid-2' },
        ...books.map((book) =>
          el(
            'div',
            { className: 'card stack-sm' },
            el('div', { className: 'row-between' }, createCefrBadge(book.cefrLevel), el('span', { className: 'xs muted' }, `${book.durationMinutes} min · ${(book.chapters || []).length} chapters`)),
            el('h2', { className: 'section-title' }, book.title),
            el('div', { className: 'arabic-text small', style: { fontWeight: '700', color: 'var(--primary)' } }, book.arabicTitle),
            el('p', { className: 'small muted', style: { margin: 0 } }, book.synopsis),
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn-primary btn-full',
                onClick: () => {
                  selectedBookId = book.id;
                  selectedChapterIdx = 0;
                  stopAudio();
                  store.emit('change');
                }
              },
              '🎧 Open & Listen'
            )
          )
        )
      )
    );
  }

  const book = CURATED_AUDIOBOOKS.find((b) => b.id === selectedBookId) || CURATED_AUDIOBOOKS[0];
  const chapters = book.chapters || [];
  const chapter = chapters[selectedChapterIdx] || chapters[0];

  const startPlayback = () => {
    isPlaying = true;
    store.emit('change');
    ttsSpeaker.speakParagraphs(chapter.paragraphs || [], {
      startIndex: Math.max(0, activeParagraphIdx),
      lang: 'en-US',
      rate: playbackRate,
      onParagraphStart: (idx) => {
        activeParagraphIdx = idx;
        store.emit('change');
      },
      onComplete: () => {
        isPlaying = false;
        activeParagraphIdx = -1;
        store.emit('change');
      }
    });
  };

  return el(
    'div',
    { className: 'stack-lg' },
    el(
      'div',
      { className: 'row-between' },
      el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { stopAudio(); selectedBookId = null; store.emit('change'); } }, '← All Books'),
      createCefrBadge(book.cefrLevel)
    ),

    // Audio Studio Banner
    el(
      'div',
      { className: 'card card-solid-primary stack-md' },
      el(
        'div',
        { className: 'row-between' },
        el(
          'div',
          { className: 'stack-xs flex-1' },
          el('h2', { className: 'section-title', style: { color: '#FFFFFF' } }, book.title),
          el('div', { className: 'small', style: { opacity: 0.9 } }, chapter.title)
        ),
        el(
          'div',
          { className: `eq-bars ${isPlaying ? 'active' : ''}`, ariaLabel: isPlaying ? 'Playing audio' : 'Audio paused' },
          el('span', { className: 'eq-bar' }),
          el('span', { className: 'eq-bar' }),
          el('span', { className: 'eq-bar' }),
          el('span', { className: 'eq-bar' })
        )
      ),
      el(
        'div',
        { className: 'row-wrap' },
        el(
          'button',
          {
            type: 'button',
            className: 'btn',
            style: { background: '#FFFFFF', color: '#21107A' },
            onClick: () => {
              if (isPlaying) {
                stopAudio();
                store.emit('change');
              } else {
                startPlayback();
              }
            }
          },
          isPlaying ? '⏹ Stop Reading' : '▶ Listen Chapter'
        ),
        ...[0.75, 1.0, 1.25].map((spd) =>
          el(
            'button',
            {
              type: 'button',
              className: 'btn',
              style: {
                background: playbackRate === spd ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.14)',
                color: '#FFFFFF'
              },
              onClick: () => {
                playbackRate = spd;
                if (isPlaying) startPlayback();
                else store.emit('change');
              }
            },
            `${spd}x`
          )
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'btn',
            style: { background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' },
            onClick: () => { showArabic = !showArabic; store.emit('change'); }
          },
          showArabic ? 'AR: ON' : 'AR: OFF'
        )
      )
    ),

    // Chapter Tabs
    el(
      'div',
      { className: 'scroll-x' },
      ...chapters.map((ch, idx) =>
        el(
          'button',
          {
            type: 'button',
            className: `chip ${selectedChapterIdx === idx ? 'selected' : ''}`,
            onClick: () => {
              stopAudio();
              selectedChapterIdx = idx;
              store.emit('change');
            }
          },
          `Ch ${idx + 1}: ${ch.title}`
        )
      )
    ),

    // Paragraphs Reader
    el(
      'div',
      { className: 'stack-sm' },
      ...(chapter.paragraphs || []).map((para, idx) =>
        el(
          'div',
          {
            className: `card stack-xs ${activeParagraphIdx === idx ? 'card-soft-primary' : ''}`,
            style: { borderLeft: activeParagraphIdx === idx ? '4px solid var(--primary)' : undefined }
          },
          el('p', { style: { margin: 0, lineHeight: 1.75, fontSize: '1.03rem' } }, renderTranslatableText(para, { cefrLevel: book.cefrLevel })),
          showArabic && chapter.arabicSummary && idx === 0
            ? el('div', { className: 'arabic-text small muted' }, chapter.arabicSummary)
            : null
        )
      )
    ),

    // Key Vocab + Complete Chapter
    (chapter.keyVocabulary || []).length
      ? el(
          'div',
          { className: 'card stack-sm' },
          el('strong', {}, '🔑 Key Vocabulary (Tap to Listen)'),
          el(
            'div',
            { className: 'row-wrap' },
            ...chapter.keyVocabulary.map((kw) =>
              el('button', { type: 'button', className: 'chip', onClick: () => ttsSpeaker.speak(kw) }, `🔊 ${kw}`)
            )
          )
        )
      : null,

    el(
      'div',
      { className: 'card card-soft-mint stack-sm' },
      el('strong', {}, '💭 Reflection Prompt'),
      el('p', { className: 'small', style: { margin: 0 } }, chapter.reflectionPrompt || 'Summarize what happened in two English sentences.'),
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-mint btn-full',
          onClick: async () => {
            await store.awardActivityProgress({
              xpDelta: 30,
              activityType: ActivityType.AUDIOBOOK,
              title: `${book.title} · ${chapter.title}`,
              cefrLevel: book.cefrLevel,
              score: 30,
              accuracyPct: 100,
              wordsPracticed: (chapter.keyVocabulary || []).length || 6,
              durationMinutes: 6,
              audiobooksFinishedDelta: 1
            });
            store.confetti();
            store.toast('Chapter completed! +30 XP');
          }
        },
        '✅ Mark Chapter Complete (+30 XP)'
      )
    )
  );
}
