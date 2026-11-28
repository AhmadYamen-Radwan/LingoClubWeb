// Expressive Animated Stickers Catalog & Message Renderer for Squad & Live Room Chat

import { el } from '../models.js';
import { audioService } from '../services/audio-service.js';

export const CHAT_STICKERS = [
  { id: 'trophy_gold', emoji: '🏆', label: 'Champion!', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', ink: '#FFFFFF', anim: 'bounce' },
  { id: 'mind_blown', emoji: '🤯', label: 'Mind Blown', bg: 'linear-gradient(135deg, #6366F1, #4338CA)', ink: '#FFFFFF', anim: 'wiggle' },
  { id: 'mashallah', emoji: '🌟', label: 'ممتاز Bravo!', bg: 'linear-gradient(135deg, #0E9F6E, #047857)', ink: '#FFFFFF', anim: 'pulse' },
  { id: 'rocket_boost', emoji: '🚀', label: 'Rocket Speed', bg: 'linear-gradient(135deg, #0EA5E9, #2563EB)', ink: '#FFFFFF', anim: 'float' },
  { id: 'detective', emoji: '🕵️', label: 'Clue Cracked!', bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', ink: '#FFFFFF', anim: 'wiggle' },
  { id: 'fire_streak', emoji: '🔥', label: 'On Fire!', bg: 'linear-gradient(135deg, #EF4444, #EA580C)', ink: '#FFFFFF', anim: 'pulse' },
  { id: 'high_five', emoji: '🙌', label: 'Team High-5!', bg: 'linear-gradient(135deg, #EC4899, #BE185D)', ink: '#FFFFFF', anim: 'bounce' },
  { id: 'yalla', emoji: '⚡', label: 'يلا بينا Yalla!', bg: 'linear-gradient(135deg, #563AE4, #7C3AED)', ink: '#FFFFFF', anim: 'bounce' },
  { id: 'genius_bulb', emoji: '💡', label: 'Genius Idea', bg: 'linear-gradient(135deg, #FBBF24, #EA580C)', ink: '#171625', anim: 'float' },
  { id: 'shield_squad', emoji: '🛡️', label: 'Squad Power', bg: 'linear-gradient(135deg, #14B8A6, #0F766E)', ink: '#FFFFFF', anim: 'pulse' },
  { id: 'gg_crown', emoji: '👑', label: 'GG Legend', bg: 'linear-gradient(135deg, #A855F7, #6366F1)', ink: '#FFFFFF', anim: 'float' },
  { id: 'coffee_break', emoji: '☕', label: 'Study Vibes', bg: 'linear-gradient(135deg, #92400E, #78350F)', ink: '#FFFFFF', anim: 'wiggle' }
];

export function encodeStickerMessage(sticker) {
  const s = sticker || CHAT_STICKERS[0];
  return `[STICKER|${s.id}|${s.label}|${s.emoji}]`;
}

export function parseStickerMessage(rawText) {
  const txt = String(rawText || '').trim();
  if (!txt.startsWith('[STICKER|') || !txt.endsWith(']')) return null;
  const parts = txt.slice(9, -1).split('|');
  if (parts.length < 2) return null;
  const id = parts[0];
  const matched = CHAT_STICKERS.find((s) => s.id === id);
  return {
    id,
    label: parts[1] || matched?.label || 'Sticker',
    emoji: parts[2] || matched?.emoji || '✨',
    bg: matched?.bg || 'linear-gradient(135deg, #563AE4, #7C3AED)',
    ink: matched?.ink || '#FFFFFF',
    anim: matched?.anim || 'bounce'
  };
}

export function createStickerBubbleNode(parsed) {
  const rtl = /[\u0600-\u06FF]/.test(parsed.label);
  return el(
    'div',
    {
      className: `sticker-card sticker-anim-${parsed.anim || 'bounce'}`,
      style: { background: parsed.bg, color: parsed.ink }
    },
    el('span', { className: 'sticker-emoji', ariaHidden: 'true' }, parsed.emoji),
    el('span', { className: `sticker-label ${rtl ? 'arabic-text' : ''}`, dir: rtl ? 'rtl' : 'ltr' }, parsed.label)
  );
}

export function createStickerTray({ onPick }) {
  return el(
    'div',
    { className: 'sticker-tray' },
    ...CHAT_STICKERS.map((st) =>
      el(
        'button',
        {
          type: 'button',
          className: 'sticker-pick-btn',
          title: `Send ${st.label} sticker`,
          ariaLabel: `Send ${st.label} sticker`,
          onClick: () => {
            audioService.playClick();
            onPick?.(st, encodeStickerMessage(st));
          }
        },
        el('span', { className: 'sticker-pick-emoji' }, st.emoji),
        el('span', { className: 'sticker-pick-name' }, st.label)
      )
    )
  );
}
