import React, { useEffect, useMemo, useState } from 'react';
import { DictionaryEntry } from '../types';
import { useApp } from '../context/AppContext';
import {
  CURATED_DICTIONARY,
  getLoadedDictionarySync,
  loadFullDictionary,
} from '../data/dictionary';
import { CEFR_LEVELS } from '../utils/constants';
import { ttsSpeaker } from '../services/speechMedia';
import { CefrBadge } from '../components/CefrBadge';

export const DictionaryView: React.FC = () => {
  const { navigate, sfx } = useApp();
  const [entries, setEntries] = useState<DictionaryEntry[]>(() => {
    const sync = getLoadedDictionarySync();
    return sync.length > 0 ? sync : CURATED_DICTIONARY;
  });
  const [query, setQuery] = useState('');
  const [cefrFilter, setCefrFilter] = useState('ALL');
  const [limit, setLimit] = useState(40);

  useEffect(() => {
    let mounted = true;
    void loadFullDictionary().then((all) => {
      if (mounted && all.length > 0) setEntries(all);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((item) => {
      if (cefrFilter !== 'ALL' && item.cefrLevel !== cefrFilter) return false;
      if (!q) return true;
      return (
        item.english.toLowerCase().includes(q) ||
        item.arabic.includes(query.trim()) ||
        String(item.topic || item.category || '').toLowerCase().includes(q)
      );
    });
  }, [cefrFilter, entries, query]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="stack-lg" data-testid="dictionary-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            📖 Bilingual Dictionary
          </h1>
          <span className="small muted">
            {entries.length.toLocaleString()} English–Arabic entries searchable offline
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      <section className="card stack-sm">
        <div className="row-between row-wrap">
          <input
            type="search"
            className="field flex-1"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(40);
            }}
            placeholder="Search English or Arabic (e.g. evidence, مقهى, resilient)..."
            aria-label="Search dictionary"
          />
          <div className="row-wrap">
            {['ALL', ...CEFR_LEVELS].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`chip ${cefrFilter === lvl ? 'selected' : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setCefrFilter(lvl);
                  setLimit(40);
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
        <span className="xs muted">
          Showing {visible.length} of {filtered.length.toLocaleString()} matching words
        </span>
      </section>

      <div className="grid-2">
        {visible.map((entry) => (
          <div key={entry.id} className="card stack-xs">
            <div className="row-between">
              <div className="row" style={{ gap: 6, minWidth: 0 }}>
                <strong className="card-title" style={{ margin: 0 }}>
                  {entry.english}
                </strong>
                {entry.partOfSpeech ? <span className="xs muted">({entry.partOfSpeech})</span> : null}
              </div>
              <div className="row">
                <CefrBadge level={entry.cefrLevel} />
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Pronounce ${entry.english}`}
                  onClick={() => ttsSpeaker.speak(entry.english)}
                >
                  🔊
                </button>
              </div>
            </div>
            <div className="small arabic-text" style={{ fontWeight: 700 }} dir="rtl">
              {entry.arabic}
            </div>
            {entry.exampleEn || entry.example ? (
              <div className="xs muted">{entry.exampleEn || entry.example}</div>
            ) : null}
          </div>
        ))}
      </div>

      {filtered.length > visible.length ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setLimit((n) => n + 40)}
          >
            Load 40 More Words ({filtered.length - visible.length} remaining)
          </button>
        </div>
      ) : null}
    </div>
  );
};
