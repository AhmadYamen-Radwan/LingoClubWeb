import React, { useEffect, useState } from 'react';
import { ActivityType, AudiobookItem, AudiobookParagraph } from '../types';
import { useApp } from '../context/AppContext';
import { CURATED_AUDIOBOOKS } from '../data/audiobooks';
import { ttsSpeaker } from '../services/speechMedia';
import { CefrBadge } from '../components/CefrBadge';
import { TranslatableText } from '../components/TranslatableText';

export const AudiobooksView: React.FC = () => {
  const { awardActivity, sfx, toast, triggerConfetti, navigate } = useApp();

  const [bookId, setBookId] = useState(CURATED_AUDIOBOOKS[0]?.id || '');
  const [chapIdx, setChapIdx] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [showArabic, setShowArabic] = useState(true);
  const [activeParaIdx, setActiveParaIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const book: AudiobookItem =
    CURATED_AUDIOBOOKS.find((b) => b.id === bookId) || CURATED_AUDIOBOOKS[0];
  const chapter = book?.chapters[chapIdx % Math.max(1, book.chapters.length)];

  useEffect(() => {
    return () => {
      ttsSpeaker.stop();
    };
  }, []);

  const paragraphs: AudiobookParagraph[] = (chapter?.paragraphs || []).map((p, idx) =>
    typeof p === 'string'
      ? { id: `p_${idx}`, english: p, arabic: '' }
      : p
  );

  const handleTogglePlay = () => {
    if (isPlaying) {
      ttsSpeaker.stop();
      setIsPlaying(false);
      setActiveParaIdx(null);
      return;
    }
    if (paragraphs.length === 0) return;
    sfx.playClick();
    setIsPlaying(true);
    ttsSpeaker.speakParagraphs(
      paragraphs.map((p) => p.english),
      {
        startIndex: activeParaIdx ?? 0,
        rate,
        lang: 'en-US',
        onParagraphStart: (idx) => setActiveParaIdx(idx),
        onComplete: () => {
          setIsPlaying(false);
          setActiveParaIdx(null);
        },
      }
    );
  };

  const handleFinishChapter = async () => {
    sfx.playFanfare();
    triggerConfetti();
    await awardActivity({
      activityType: ActivityType.AUDIOBOOK,
      title: `${book.title} · ${chapter?.title || 'Chapter'}`,
      cefrLevel: book.cefrLevel,
      score: 120,
      xpDelta: 55,
      audiobooksFinishedDelta: 1,
      wordsPracticed: paragraphs.length * 12,
    });
    toast('Chapter finished! +55 XP', 'info');
  };

  return (
    <div className="stack-lg" data-testid="audiobooks-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            🎧 Bilingual Audiobooks
          </h1>
          <span className="small muted">
            Listen with live narration speed control & tap any word for instant Arabic
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      {/* Book Selector */}
      <div className="scroll-x">
        {CURATED_AUDIOBOOKS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`chip ${book.id === b.id ? 'selected' : ''}`}
            onClick={() => {
              ttsSpeaker.stop();
              setIsPlaying(false);
              setActiveParaIdx(null);
              setBookId(b.id);
              setChapIdx(0);
              sfx.playClick();
            }}
          >
            {b.title} ({b.cefrLevel})
          </button>
        ))}
      </div>

      {/* Player Card */}
      <section className="card card-soft-primary stack-sm">
        <div className="row-between row-wrap">
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>
              {book.title}
            </h2>
            <span className="xs muted">
              {book.subtitle || book.genre} · Narrated by {book.narrator || 'Lingo Studio'}
            </span>
          </div>
          <div className="row">
            <CefrBadge level={book.cefrLevel} />
            <div className={`eq-bars ${isPlaying ? 'active' : ''}`} aria-hidden="true">
              <div className="eq-bar" />
              <div className="eq-bar" />
              <div className="eq-bar" />
              <div className="eq-bar" />
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="row-wrap">
          {book.chapters.map((ch, idx) => (
            <button
              key={ch.id || idx}
              type="button"
              className={`chip ${idx === chapIdx ? 'selected' : ''}`}
              onClick={() => {
                ttsSpeaker.stop();
                setIsPlaying(false);
                setActiveParaIdx(null);
                setChapIdx(idx);
              }}
            >
              Ch {idx + 1}: {ch.title}
            </button>
          ))}
        </div>

        {/* Playback Controls */}
        <div className="row-between row-wrap">
          <div className="row-wrap">
            <button type="button" className="btn btn-primary" onClick={handleTogglePlay}>
              {isPlaying ? '⏹ Stop Reading' : '▶ Listen Chapter'}
            </button>
            <button
              type="button"
              className={`chip ${showArabic ? 'selected' : ''}`}
              onClick={() => setShowArabic((v) => !v)}
            >
              {showArabic ? 'Arabic On' : 'Arabic Off'}
            </button>
          </div>
          <div className="row">
            {[0.8, 1.0, 1.2].map((spd) => (
              <button
                key={spd}
                type="button"
                className={`chip ${rate === spd ? 'selected' : ''}`}
                onClick={() => setRate(spd)}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter Paragraphs */}
      {chapter ? (
        <div className="stack-sm">
          {paragraphs.map((para, idx) => (
            <div
              key={para.id || idx}
              className={`card stack-xs ${activeParaIdx === idx ? 'card-soft-mint' : ''}`}
            >
              <div className="row-between">
                <span className="xs muted mono">Paragraph {idx + 1}</span>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Read paragraph ${idx + 1}`}
                  onClick={() => {
                    setActiveParaIdx(idx);
                    ttsSpeaker.speak(para.english, {
                      rate,
                      onEnd: () => setActiveParaIdx(null),
                    });
                  }}
                >
                  🔊
                </button>
              </div>
              <TranslatableText text={para.english} />
              {showArabic && para.arabic ? (
                <p className="small muted arabic-text" dir="rtl" style={{ margin: 0 }}>
                  {para.arabic}
                </p>
              ) : null}
            </div>
          ))}

          {chapter.reflectionPrompt ? (
            <div className="card card-soft-amber stack-xs">
              <span className="xs muted">CLUB DISCUSSION PROMPT</span>
              <p className="small" style={{ margin: 0 }}>
                {chapter.reflectionPrompt}
              </p>
            </div>
          ) : null}

          <div className="row-between">
            <span className="small muted">Finished listening?</span>
            <button type="button" className="btn btn-primary" onClick={() => void handleFinishChapter()}>
              ✓ Complete Chapter (+55 XP)
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
