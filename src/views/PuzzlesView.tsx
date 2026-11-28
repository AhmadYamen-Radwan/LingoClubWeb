import React, { useMemo, useState } from 'react';
import { ActivityType } from '../types';
import { useApp } from '../context/AppContext';
import {
  CLOZE_PUZZLES,
  MATCH_PUZZLE_SETS,
  SENTENCE_PUZZLES,
} from '../data/curatedContent';
import { CefrBadge } from '../components/CefrBadge';

type PuzzleTab = 'SENTENCE' | 'MATCH' | 'CLOZE';

function shuffleTokens(tokens: string[]): string[] {
  const arr = [...tokens];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const PuzzlesView: React.FC = () => {
  const { awardActivity, sfx, toast, triggerConfetti, navigate } = useApp();
  const [tab, setTab] = useState<PuzzleTab>('SENTENCE');

  // Sentence Builder state
  const [sentIdx, setSentIdx] = useState(0);
  const curSentence = SENTENCE_PUZZLES[sentIdx % SENTENCE_PUZZLES.length];
  const initialPool = useMemo(() => shuffleTokens(curSentence.tokens), [curSentence]);
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [sentenceSolved, setSentenceSolved] = useState(false);

  // Pair Match state
  const [matchIdx, setMatchIdx] = useState(0);
  const curMatch = MATCH_PUZZLE_SETS[matchIdx % MATCH_PUZZLE_SETS.length];
  const shuffledRight = useMemo(
    () => shuffleTokens(curMatch.pairs.map((p) => p.right)),
    [curMatch]
  );
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // Cloze Fill state
  const [clozeIdx, setClozeIdx] = useState(0);
  const curCloze = CLOZE_PUZZLES[clozeIdx % CLOZE_PUZZLES.length];
  const [clozePick, setClozePick] = useState<string | null>(null);

  const builtSentence = pickedIndices.map((i) => initialPool[i]).join(' ');

  return (
    <div className="stack-lg" data-testid="puzzles-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            🧩 Word Forge Puzzles
          </h1>
          <span className="small muted">
            Build natural sentences, match collocations & fill real-world blanks
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      <div className="scroll-x">
        <button
          type="button"
          className={`chip ${tab === 'SENTENCE' ? 'selected' : ''}`}
          onClick={() => {
            sfx.playClick();
            setTab('SENTENCE');
          }}
        >
          🧱 Sentence Builder ({SENTENCE_PUZZLES.length})
        </button>
        <button
          type="button"
          className={`chip ${tab === 'MATCH' ? 'selected' : ''}`}
          onClick={() => {
            sfx.playClick();
            setTab('MATCH');
          }}
        >
          🔗 Pair Match ({MATCH_PUZZLE_SETS.length})
        </button>
        <button
          type="button"
          className={`chip ${tab === 'CLOZE' ? 'selected' : ''}`}
          onClick={() => {
            sfx.playClick();
            setTab('CLOZE');
          }}
        >
          ✏️ Cloze Fill ({CLOZE_PUZZLES.length})
        </button>
      </div>

      {tab === 'SENTENCE' ? (
        <section className="card stack-md">
          <div className="row-between">
            <span className="badge-pill card-soft-primary">
              Puzzle {(sentIdx % SENTENCE_PUZZLES.length) + 1}/{SENTENCE_PUZZLES.length}
            </span>
            <CefrBadge level={curSentence.cefrLevel} />
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            Hint: {curSentence.hint || curSentence.promptHint || 'Arrange the words in natural English order'}
          </p>

          <div
            className={`card ${sentenceSolved ? 'card-soft-mint' : 'card-soft-primary'}`}
            style={{ minHeight: 72, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
          >
            {pickedIndices.length === 0 ? (
              <span className="small muted">Tap word tiles below to assemble the sentence...</span>
            ) : (
              pickedIndices.map((poolIdx, pos) => (
                <button
                  key={`${poolIdx}_${pos}`}
                  type="button"
                  className="chip selected"
                  onClick={() => {
                    if (sentenceSolved) return;
                    sfx.playClick();
                    setPickedIndices((prev) => prev.filter((_, p) => p !== pos));
                  }}
                >
                  {initialPool[poolIdx]}
                </button>
              ))
            )}
          </div>

          <div className="row-wrap">
            {initialPool.map((tok, i) => {
              const used = pickedIndices.includes(i);
              return (
                <button
                  key={`${tok}_${i}`}
                  type="button"
                  disabled={used || sentenceSolved}
                  className="btn btn-outline btn-sm"
                  style={{ opacity: used ? 0.35 : 1 }}
                  onClick={() => {
                    sfx.playPop();
                    setPickedIndices((prev) => [...prev, i]);
                  }}
                >
                  {tok}
                </button>
              );
            })}
          </div>

          {sentenceSolved && curSentence.explanation ? (
            <div className="card card-soft-mint small">{curSentence.explanation}</div>
          ) : null}

          <div className="row-between row-wrap">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setPickedIndices([]);
                setSentenceSolved(false);
              }}
            >
              Reset
            </button>
            {!sentenceSolved ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = curSentence.tokens.join(' ');
                  if (builtSentence.trim() === target.trim()) {
                    sfx.playSuccess();
                    triggerConfetti();
                    setSentenceSolved(true);
                    void awardActivity({
                      activityType: ActivityType.PUZZLE,
                      title: 'Word Forge · Sentence Builder',
                      cefrLevel: curSentence.cefrLevel,
                      score: 85,
                      xpDelta: 30,
                      wordsPracticed: curSentence.tokens.length,
                    });
                    toast('Spot on! +30 XP', 'info');
                  } else {
                    sfx.playError();
                    toast('Word order is not quite right yet — tap any placed tile to remove it.', 'error');
                  }
                }}
              >
                Check Order
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSentIdx((i) => i + 1);
                  setPickedIndices([]);
                  setSentenceSolved(false);
                }}
              >
                Next Puzzle →
              </button>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'MATCH' ? (
        <section className="card stack-md">
          <div className="row-between">
            <h2 className="card-title" style={{ margin: 0 }}>
              {curMatch.title}
            </h2>
            <CefrBadge level={curMatch.cefrLevel} />
          </div>
          {curMatch.teachingTip ? <p className="xs muted">{curMatch.teachingTip}</p> : null}
          <div className="grid-2">
            <div className="stack-xs">
              {curMatch.pairs.map((p) => {
                const done = matchedPairs.includes(p.left);
                return (
                  <button
                    key={p.left}
                    type="button"
                    disabled={done}
                    className={`btn btn-outline ${selLeft === p.left ? 'chip selected' : ''} ${
                      done ? 'card-soft-mint' : ''
                    }`}
                    onClick={() => {
                      sfx.playClick();
                      setSelLeft(p.left);
                    }}
                  >
                    {done ? '✅ ' : ''}
                    {p.left}
                  </button>
                );
              })}
            </div>
            <div className="stack-xs">
              {shuffledRight.map((rightText) => {
                const owning = curMatch.pairs.find((p) => p.right === rightText);
                const done = owning ? matchedPairs.includes(owning.left) : false;
                return (
                  <button
                    key={rightText}
                    type="button"
                    disabled={done}
                    className={`btn btn-outline ${done ? 'card-soft-mint' : ''}`}
                    onClick={() => {
                      if (!selLeft) {
                        toast('Select a left-column starter first.', 'info');
                        return;
                      }
                      const matchObj = curMatch.pairs.find((p) => p.left === selLeft);
                      if (matchObj && matchObj.right === rightText) {
                        sfx.playSuccess();
                        const next = [...matchedPairs, matchObj.left];
                        setMatchedPairs(next);
                        setSelLeft(null);
                        if (next.length === curMatch.pairs.length) {
                          triggerConfetti();
                          void awardActivity({
                            activityType: ActivityType.PUZZLE,
                            title: `Pair Match · ${curMatch.title}`,
                            cefrLevel: curMatch.cefrLevel,
                            score: 120,
                            xpDelta: 40,
                            wordsPracticed: curMatch.pairs.length,
                          });
                          toast('All pairs matched! +40 XP', 'info');
                        }
                      } else {
                        sfx.playError();
                        setSelLeft(null);
                        toast('Not a pair — try another combo!', 'error');
                      }
                    }}
                  >
                    {rightText}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="row-between">
            <span className="small muted">
              Matched {matchedPairs.length}/{curMatch.pairs.length}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setMatchIdx((i) => i + 1);
                setMatchedPairs([]);
                setSelLeft(null);
              }}
            >
              Next Set →
            </button>
          </div>
        </section>
      ) : null}

      {tab === 'CLOZE' ? (
        <section className="card stack-md">
          <div className="row-between">
            <span className="badge-pill card-soft-primary">
              Cloze {(clozeIdx % CLOZE_PUZZLES.length) + 1}/{CLOZE_PUZZLES.length}
            </span>
            <CefrBadge level={curCloze.cefrLevel} />
          </div>
          <div className="card card-soft-primary" style={{ fontSize: '1.15rem', lineHeight: 1.65 }}>
            {curCloze.before || curCloze.beforeBlank || ''}{' '}
            <strong style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              {clozePick || '_____'}
            </strong>{' '}
            {curCloze.after || curCloze.afterBlank || ''}
          </div>
          <div className="grid-2">
            {curCloze.options.map((opt) => {
              const target = curCloze.answer || curCloze.correctWord || '';
              const chosen = clozePick === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={Boolean(clozePick)}
                  className={`btn btn-outline ${
                    clozePick ? (opt === target ? 'card-soft-mint' : chosen ? 'card-soft-secondary' : '') : ''
                  }`}
                  onClick={() => {
                    setClozePick(opt);
                    if (opt === target) {
                      sfx.playSuccess();
                      void awardActivity({
                        activityType: ActivityType.PUZZLE,
                        title: 'Word Forge · Cloze Fill',
                        cefrLevel: curCloze.cefrLevel,
                        score: 70,
                        xpDelta: 25,
                        wordsPracticed: 1,
                      });
                    } else {
                      sfx.playError();
                    }
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {clozePick ? (
            <div className="row-between row-wrap">
              <span className="small muted">{curCloze.explanation}</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setClozePick(null);
                  setClozeIdx((i) => i + 1);
                }}
              >
                Next Cloze →
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};
