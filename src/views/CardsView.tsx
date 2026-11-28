import React, { useMemo, useState } from 'react';
import { ActivityType, CefrLevel, FlashcardDeck, FlashcardItem } from '../types';
import { useApp } from '../context/AppContext';
import { FLASHCARD_DECKS } from '../data/curatedContent';
import { CEFR_LEVELS } from '../utils/constants';
import { ttsSpeaker } from '../services/speechMedia';
import { CefrBadge } from '../components/CefrBadge';

export const CardsView: React.FC = () => {
  const {
    customDecks,
    saveCustomDeck,
    deleteCustomDeck,
    awardActivity,
    profile,
    sfx,
    toast,
    navigate,
  } = useApp();

  const allDecks = useMemo(() => [...customDecks, ...FLASHCARD_DECKS], [customDecks]);
  const [selectedDeckId, setSelectedDeckId] = useState(allDecks[0]?.id || '');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  // Create deck drawer
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLevel, setNewLevel] = useState<string>(profile.learningLevel || CefrLevel.B1);
  const [newCardsText, setNewCardsText] = useState(
    'resilient | مرن وقوي | Teams stay resilient under pressure.\nclarify | يوضح | Please clarify the deadline.'
  );

  const activeDeck = allDecks.find((d) => d.id === selectedDeckId) || allDecks[0];
  const cards = activeDeck?.cards || [];
  const curCard: FlashcardItem | undefined = cards[cardIdx % Math.max(1, cards.length)];
  const isCustom = customDecks.some((d) => d.id === activeDeck?.id);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = newCardsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed: FlashcardItem[] = lines
      .map((l) => {
        const [term, translation, example] = l.split('|').map((s) => s.trim());
        return { term: term || '', translation: translation || '', exampleSentence: example || '' };
      })
      .filter((c) => c.term && c.translation);

    if (!newTitle.trim() || parsed.length === 0) {
      toast('Add a title and at least one "Term | Meaning | Example" line.', 'error');
      return;
    }

    await saveCustomDeck({
      title: newTitle.trim(),
      subtitle: `${parsed.length} custom cards`,
      cefrLevel: newLevel,
      cards: parsed,
    });
    sfx.playSuccess();
    setCreating(false);
    setNewTitle('');
  };

  return (
    <div className="stack-lg" data-testid="cards-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            🃏 Flashcard Studio
          </h1>
          <span className="small muted">
            Tap any 3D card to flip between English, Arabic & usage tips
          </span>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              sfx.playClick();
              setCreating((v) => !v);
            }}
          >
            {creating ? 'Cancel' : '+ New Deck'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
            ← Home
          </button>
        </div>
      </div>

      {creating ? (
        <form onSubmit={handleCreateDeck} className="card card-soft-primary stack-sm">
          <h2 className="card-title" style={{ margin: 0 }}>
            Create Custom Flashcard Deck
          </h2>
          <div className="grid-2">
            <input
              type="text"
              className="field"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Deck title (e.g. Medical Clinic Verbs)"
            />
            <select
              className="field"
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              aria-label="Custom deck CEFR level"
            >
              {CEFR_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="field"
            value={newCardsText}
            onChange={(e) => setNewCardsText(e.target.value)}
            placeholder="Term | Arabic meaning | Example sentence"
          />
          <button type="submit" className="btn btn-primary">
            Save Custom Deck
          </button>
        </form>
      ) : null}

      {/* Deck Picker */}
      <div className="scroll-x">
        {allDecks.map((deck: FlashcardDeck) => (
          <button
            key={deck.id}
            type="button"
            className={`chip ${activeDeck?.id === deck.id ? 'selected' : ''}`}
            onClick={() => {
              sfx.playClick();
              setSelectedDeckId(deck.id);
              setCardIdx(0);
              setFlipped(false);
            }}
          >
            {deck.title} ({deck.cards.length})
          </button>
        ))}
      </div>

      {/* Active 3D Flip Stage */}
      {activeDeck && curCard ? (
        <div className="stack-md" style={{ maxWidth: 620, margin: '0 auto', width: '100%' }}>
          <div className="row-between">
            <div className="row">
              <CefrBadge level={activeDeck.cefrLevel} />
              <span className="small muted mono">
                Card {(cardIdx % cards.length) + 1} / {cards.length}
              </span>
            </div>
            <div className="row">
              <button
                type="button"
                className="btn-icon"
                aria-label="Pronounce card term"
                onClick={() => ttsSpeaker.speak(curCard.term)}
              >
                🔊
              </button>
              {isCustom ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => void deleteCustomDeck(activeDeck.id)}
                >
                  Delete Deck
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="flip-scene"
            style={{ border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer' }}
            onClick={() => {
              sfx.playFlip();
              setFlipped((f) => !f);
            }}
            aria-label="Flip flashcard"
          >
            <div className={`flip-card ${flipped ? 'flipped' : ''}`}>
              <div className="flip-face flip-front">
                <span className="xs muted" style={{ fontWeight: 800 }}>
                  {curCard.partOfSpeech || 'VOCABULARY'} · TAP TO FLIP
                </span>
                <div className="display-title" style={{ fontSize: '2rem' }}>
                  {curCard.term}
                </div>
                {curCard.phonetic || curCard.pronunciation ? (
                  <span className="mono small muted">{curCard.phonetic || curCard.pronunciation}</span>
                ) : null}
              </div>

              <div className="flip-face flip-back">
                <span className="xs" style={{ opacity: 0.85 }}>
                  ARABIC & USAGE
                </span>
                <div className="display-title arabic-text" dir="rtl" style={{ color: '#FFFFFF', fontSize: '1.75rem' }}>
                  {curCard.translation || curCard.meaning}
                </div>
                {curCard.exampleSentence || curCard.example ? (
                  <p className="small" style={{ margin: 0, textAlign: 'center', opacity: 0.94 }}>
                    &ldquo;{curCard.exampleSentence || curCard.example}&rdquo;
                  </p>
                ) : null}
                {curCard.teachingTip ? (
                  <span className="xs" style={{ opacity: 0.86, textAlign: 'center' }}>
                    💡 {curCard.teachingTip}
                  </span>
                ) : null}
              </div>
            </div>
          </button>

          <div className="row-between row-wrap">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                sfx.playClick();
                setFlipped(false);
                setCardIdx((i) => (i - 1 + cards.length) % cards.length);
              }}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                sfx.playSuccess();
                const nextMastered = masteredCount + 1;
                setMasteredCount(nextMastered);
                setFlipped(false);
                setCardIdx((i) => (i + 1) % cards.length);
                void awardActivity({
                  activityType: ActivityType.CARDS,
                  title: `${activeDeck.title} · Card Mastered`,
                  cefrLevel: activeDeck.cefrLevel,
                  score: 30,
                  xpDelta: 15,
                  cardsMasteredDelta: 1,
                  wordsPracticed: 1,
                });
                toast(`Card mastered! (${nextMastered} this session)`, 'info');
              }}
            >
              ✓ Mark Mastered (+15 XP)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                sfx.playClick();
                setFlipped(false);
                setCardIdx((i) => (i + 1) % cards.length);
              }}
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
