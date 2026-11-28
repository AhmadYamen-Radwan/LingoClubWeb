import React, { useMemo, useState } from 'react';
import { StickerCategoryId, StickerItem } from '../types';
import {
  STICKER_CATEGORIES,
  filterStickers,
  getStickerById,
  parseStickerMessage,
} from '../utils/gameLogic';
import { useApp } from '../context/AppContext';

export { parseStickerMessage };

const StickerArtwork: React.FC<{ sticker: StickerItem; size?: number }> = ({ sticker, size = 46 }) => {
  const { accent, motif, emoji } = sticker;
  return (
    <div
      className={`sticker-anim-${sticker.anim}`}
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <radialGradient id={`sg_${sticker.id}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.28" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill={`url(#sg_${sticker.id})`} stroke={accent} strokeWidth="2.5" />
        {motif === 'trophy' ? (
          <path d="M22 20h20v10c0 6-4.5 11-10 11s-10-5-10-11V20zm-5 3h5v6c-3 0-5-2-5-6zm30 0h-5v6c3 0 5-2 5-6zM28 41h8v5h4v3H24v-3h4v-5z" fill={accent} opacity="0.22" />
        ) : motif === 'bolt' ? (
          <polygon points="35,12 20,34 31,34 27,52 44,29 33,29" fill={accent} opacity="0.24" />
        ) : (
          <circle cx="32" cy="32" r="21" fill="none" stroke={accent} strokeDasharray="4 4" strokeWidth="1.5" opacity="0.55" />
        )}
      </svg>
      <span
        style={{
          position: 'absolute',
          fontSize: Math.round(size * 0.56),
          lineHeight: 1,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
        }}
      >
        {emoji}
      </span>
    </div>
  );
};

export const StickerBubble: React.FC<{
  stickerId: string;
  label: string;
  emoji: string;
}> = ({ stickerId, label, emoji }) => {
  const catalogSticker = getStickerById(stickerId);
  const sticker: StickerItem = catalogSticker || {
    id: stickerId,
    category: 'REACTIONS',
    emoji,
    label,
    keywords: [],
    bg: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
    accent: '#563AE4',
    ink: '#312E81',
    anim: 'bounce',
    motif: 'sparkles',
  };

  return (
    <div
      className="sticker-card"
      data-testid={`sticker-bubble-${sticker.id}`}
      style={{ background: sticker.bg, color: sticker.ink }}
    >
      <StickerArtwork sticker={sticker} size={52} />
      <span style={{ fontWeight: 800, fontSize: '0.84rem', textAlign: 'center' }}>
        {label || sticker.label}
      </span>
    </div>
  );
};

export const StickerPickerDrawer: React.FC<{
  onSelect: (sticker: StickerItem) => void;
  onClose?: () => void;
}> = ({ onSelect, onClose }) => {
  const { recentStickers, recordStickerUsed, sfx } = useApp();
  const [category, setCategory] = useState<StickerCategoryId>('MASCOT');
  const [search, setSearch] = useState('');

  const items = useMemo(
    () => filterStickers(category, search, recentStickers),
    [category, search, recentStickers]
  );

  return (
    <div className="wa-sticker-drawer" role="region" aria-label="WhatsApp-style sticker picker">
      <div className="row-between">
        <span className="small" style={{ fontWeight: 800 }}>
          Stickers & Club Reactions
        </span>
        {onClose ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ minHeight: 34, padding: '4px 10px' }}
            aria-label="Close sticker drawer"
            onClick={onClose}
          >
            ✕
          </button>
        ) : null}
      </div>

      <input
        type="search"
        className="field"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search stickers (trophy, arabic, coffee, vault...)"
        aria-label="Search stickers"
        style={{ padding: '8px 12px', minHeight: 40 }}
      />

      <div className="scroll-x" role="tablist" aria-label="Sticker categories">
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={!search.trim() && category === cat.id}
            className={`chip ${!search.trim() && category === cat.id ? 'selected' : ''}`}
            onClick={() => {
              sfx.playClick();
              setSearch('');
              setCategory(cat.id);
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="small muted" style={{ textAlign: 'center', padding: '14px 0', margin: 0 }}>
          No stickers matched "{search}". Try another keyword!
        </p>
      ) : (
        <div className="wa-sticker-grid">
          {items.map((st) => (
            <button
              key={st.id}
              type="button"
              className="sticker-pick-btn"
              aria-label={`Send ${st.label} sticker`}
              onClick={() => {
                sfx.playStickerPop();
                recordStickerUsed(st.id);
                onSelect(st);
              }}
            >
              <StickerArtwork sticker={st} size={42} />
              <span className="xs" style={{ fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                {st.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
