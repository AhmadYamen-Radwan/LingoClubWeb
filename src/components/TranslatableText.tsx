import React, { useEffect, useState } from 'react';
import { GlossaryMatch, lookupGlossaryWord } from '../data/dictionary';
import { ttsSpeaker } from '../services/speechMedia';
import { useApp } from '../context/AppContext';

export const TranslatableText: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = '' }) => {
  const { sfx } = useApp();
  const [selected, setSelected] = useState<GlossaryMatch | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const tokens = String(text || '').split(/(\s+)/);

  return (
    <>
      <span className={className}>
        {tokens.map((tok, idx) => {
          if (!tok.trim()) return <React.Fragment key={idx}>{tok}</React.Fragment>;
          const match = lookupGlossaryWord(tok);
          if (!match) return <React.Fragment key={idx}>{tok}</React.Fragment>;
          return (
            <button
              key={idx}
              type="button"
              className="translatable-word"
              onClick={(e) => {
                e.stopPropagation();
                sfx.playPop();
                setSelected(match);
              }}
            >
              {tok}
            </button>
          );
        })}
      </span>

      {selected ? (
        <div
          className="popover-root"
          role="dialog"
          aria-modal="true"
          aria-label={`Word definition for ${selected.word}`}
          onClick={() => setSelected(null)}
        >
          <div className="modal-card stack-sm" onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <div className="stack-xs">
                <span className="xs muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  {selected.partOfSpeech || 'Vocabulary'}
                </span>
                <h3 className="section-title" style={{ margin: 0 }}>
                  {selected.word}
                </h3>
                {selected.phonetic ? (
                  <span className="mono small muted">{selected.phonetic}</span>
                ) : null}
              </div>
              <button
                type="button"
                className="btn-icon"
                aria-label="Close dictionary popup"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="card card-soft-primary stack-xs" style={{ padding: 14 }}>
              <span className="xs muted" style={{ fontWeight: 700 }}>
                Arabic Translation
              </span>
              <div className="arabic-text" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                {selected.arabic}
              </div>
            </div>

            {selected.meaning ? (
              <p className="small" style={{ margin: 0 }}>
                <strong>Context:</strong> {selected.meaning}
              </p>
            ) : null}

            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  sfx.playClick();
                  ttsSpeaker.speak(selected.word, { lang: 'en-US' });
                }}
              >
                🔊 Listen
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelected(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
