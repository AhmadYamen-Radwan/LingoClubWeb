import React, { useEffect, useState } from 'react';
import { ActivityType, GuessingPack, GuessingPrompt } from '../types';
import { useApp } from '../context/AppContext';
import { GUESSING_PACKS } from '../data/curatedContent';
import { CefrBadge } from '../components/CefrBadge';

export const GuessingView: React.FC = () => {
  const { awardActivity, openTeamBuzzer, sfx, toast, triggerConfetti, navigate } = useApp();

  const [selectedPackId, setSelectedPackId] = useState(GUESSING_PACKS[0].id);
  const [playing, setPlaying] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gotCount, setGotCount] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);

  const activePack: GuessingPack =
    GUESSING_PACKS.find((p) => p.id === selectedPackId) || GUESSING_PACKS[0];
  const cards: GuessingPrompt[] = activePack.cards || activePack.prompts || [];
  const curCard = cards[cardIdx % Math.max(1, cards.length)];

  useEffect(() => {
    if (!playing || finished) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setFinished(true);
          sfx.playFanfare();
          triggerConfetti();
          return 0;
        }
        if (t <= 5) sfx.playTick();
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finished, playing, sfx, triggerConfetti]);

  const startRound = (packId: string) => {
    setSelectedPackId(packId);
    setPlaying(true);
    setCardIdx(0);
    setTimeLeft(60);
    setGotCount(0);
    setPassCount(0);
    setShowHint(false);
    setFinished(false);
    sfx.playClick();
  };

  const finishAndSave = async () => {
    const score = gotCount * 100;
    const total = Math.max(1, gotCount + passCount);
    const acc = Math.round((gotCount / total) * 100);
    await awardActivity({
      activityType: ActivityType.GUESSING,
      title: `Taboo & Act · ${activePack.title}`,
      cefrLevel: activePack.cefrLevel,
      score,
      xpDelta: Math.max(20, gotCount * 18),
      accuracyPct: acc,
      wordsPracticed: total,
    });
    toast(`Saved ${gotCount} guessed cards!`, 'info');
    setPlaying(false);
    setFinished(false);
  };

  if (playing) {
    if (finished) {
      return (
        <div className="card card-soft-mint stack-md" style={{ textAlign: 'center', padding: 28 }}>
          <h1 className="display-title">🎉 Time&apos;s Up!</h1>
          <div className="display-title mono">{gotCount * 100} pts</div>
          <p className="small muted">
            Got It: {gotCount} · Passed: {passCount}
          </p>
          <div className="row-between row-wrap">
            <button type="button" className="btn btn-outline" onClick={() => setPlaying(false)}>
              Back to Packs
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void finishAndSave()}>
              Save XP & Continue
            </button>
          </div>
        </div>
      );
    }

    const forbidden = curCard?.tabooWords || curCard?.forbiddenWords || [];

    return (
      <div className="stack-lg" data-testid="guessing-active">
        <div className="row-between row-wrap">
          <span className="badge-pill card-soft-secondary mono">⏱ {timeLeft}s</span>
          <span className="mono" style={{ fontWeight: 800 }}>
            Got It: {gotCount} · Passed: {passCount}
          </span>
          <div className="row">
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() =>
                openTeamBuzzer({
                  contextKey: 'guessing_party',
                  title: 'Party Word Buzzer',
                  prompt: `Describe "${curCard?.word}" without using forbidden words!`,
                })
              }
            >
              🚨 Buzzer
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPlaying(false)}>
              Exit
            </button>
          </div>
        </div>

        {curCard ? (
          <div className="card stack-md" style={{ textAlign: 'center', padding: '26px 18px' }}>
            <div className="row-between">
              <span className="badge-pill card-soft-primary">{curCard.category || 'Party Card'}</span>
              <CefrBadge level={activePack.cefrLevel} />
            </div>

            <div className="display-title" style={{ fontSize: '2.1rem' }}>
              {curCard.word}
            </div>

            {forbidden.length > 0 ? (
              <div className="card card-soft-secondary stack-xs">
                <span className="xs" style={{ fontWeight: 800 }}>
                  TABOO / DO NOT SAY
                </span>
                <div className="row-wrap" style={{ justifyContent: 'center' }}>
                  {forbidden.map((fw) => (
                    <span key={fw} className="badge-pill" style={{ background: '#FFFFFF', color: '#881337' }}>
                      🚫 {fw}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <button type="button" className="chip" onClick={() => setShowHint((v) => !v)}>
              {showHint ? 'Hide Clue Hint' : '💡 Need a Clue Hint?'}
            </button>
            {showHint && (curCard.clueHint || curCard.arabicHint) ? (
              <div className="card card-soft-amber small">
                {curCard.clueHint || curCard.arabicHint}
              </div>
            ) : null}

            <div className="grid-2">
              <button
                type="button"
                className="btn btn-outline btn-lg"
                onClick={() => {
                  sfx.playError();
                  setPassCount((p) => p + 1);
                  setShowHint(false);
                  setCardIdx((i) => i + 1);
                }}
              >
                ⏭ Pass
              </button>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => {
                  sfx.playSuccess();
                  setGotCount((g) => g + 1);
                  setShowHint(false);
                  setCardIdx((i) => i + 1);
                }}
              >
                ✓ Got It! (+100)
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="stack-lg" data-testid="guessing-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            🎭 Taboo & Act Guessing
          </h1>
          <span className="small muted">
            60-second party guessing rounds with forbidden words & Team Buzzer support
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      <div className="grid-2">
        {GUESSING_PACKS.map((pack) => {
          const list = pack.cards || pack.prompts || [];
          return (
            <div key={pack.id} className="card stack-sm">
              <div className="row-between">
                <h2 className="card-title" style={{ margin: 0 }}>
                  {pack.title}
                </h2>
                <CefrBadge level={pack.cefrLevel} />
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {pack.description || pack.modeLabel} · {list.length} cards
              </p>
              <button type="button" className="btn btn-primary" onClick={() => startRound(pack.id)}>
                Start 60s Party Round
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
