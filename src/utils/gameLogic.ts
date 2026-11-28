import { CefrLevel, QuizPack, QuizQuestion, StickerCategoryId, StickerItem } from '../types';

export type VaultCellState = 'exact' | 'present' | 'absent';

export function evaluateVaultGuess(target: string, guess: string, isArabic = false): VaultCellState[] {
  const cleanTarget = isArabic ? target.trim() : target.trim().toUpperCase();
  const cleanGuess = isArabic ? guess.trim() : guess.trim().toUpperCase();
  const targetChars = Array.from(cleanTarget);
  const guessChars = Array.from(cleanGuess);
  const result: VaultCellState[] = new Array(targetChars.length).fill('absent');
  const remainingCounts = new Map<string, number>();

  for (let i = 0; i < targetChars.length; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = 'exact';
    } else {
      const ch = targetChars[i];
      remainingCounts.set(ch, (remainingCounts.get(ch) || 0) + 1);
    }
  }

  for (let i = 0; i < targetChars.length; i++) {
    if (result[i] === 'exact') continue;
    const ch = guessChars[i];
    const count = remainingCounts.get(ch) || 0;
    if (ch && count > 0) {
      result[i] = 'present';
      remainingCounts.set(ch, count - 1);
    }
  }

  return result;
}

export function filterPlayablePool<T>(
  items: readonly T[],
  cefrFilter: string,
  getLevel: (item: T) => string
): T[] {
  if (!cefrFilter || cefrFilter === 'ALL') return [...items];
  const filtered = items.filter((item) => getLevel(item) === cefrFilter);
  return filtered.length > 0 ? filtered : [...items];
}

export function splitLines(raw: string): string[] {
  return String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Filters out legacy or internal control markers such as [BUZZ|...] and [LEAVE|...]
 * so public chat never leaks host-only departure or buzzer state packets.
 */
export function isSystemControlMessage(text?: string | null): boolean {
  const trimmed = String(text || '').trim();
  return trimmed.startsWith('[BUZZ|') || trimmed.startsWith('[LEAVE|');
}

export const STICKER_CATEGORIES: Array<{ id: StickerCategoryId; label: string; icon: string }> = [
  { id: 'RECENTS', label: 'Recents', icon: '🕒' },
  { id: 'MASCOT', label: 'Mascot', icon: '🦉' },
  { id: 'REACTIONS', label: 'Reactions', icon: '🎉' },
  { id: 'VICTORY', label: 'Victory', icon: '🏆' },
  { id: 'ARABIC', label: 'Arabic', icon: '🌙' },
  { id: 'ARCADE', label: 'Arcade', icon: '🕵️' },
];

export const WHATSAPP_STICKERS: StickerItem[] = [
  {
    id: 'mascot_hi',
    category: 'MASCOT',
    emoji: '🦉',
    label: 'Ready to Learn!',
    keywords: ['owl', 'mascot', 'hello', 'hi', 'ready', 'welcome'],
    bg: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
    accent: '#563AE4',
    ink: '#312E81',
    anim: 'bounce',
    motif: 'owl',
  },
  {
    id: 'mascot_tea',
    category: 'MASCOT',
    emoji: '☕',
    label: 'Café Vibes',
    keywords: ['coffee', 'tea', 'cafe', 'morning', 'chill'],
    bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
    accent: '#D97706',
    ink: '#78350F',
    anim: 'float',
    motif: 'coffee',
  },
  {
    id: 'mascot_study',
    category: 'MASCOT',
    emoji: '📖',
    label: 'Word Wizard',
    keywords: ['book', 'study', 'read', 'vocab', 'wizard'],
    bg: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
    accent: '#0284C7',
    ink: '#0C4A6E',
    anim: 'wiggle',
    motif: 'book',
  },
  {
    id: 'mascot_rocket',
    category: 'MASCOT',
    emoji: '🚀',
    label: 'Level Up!',
    keywords: ['rocket', 'xp', 'level', 'fast', 'boost'],
    bg: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
    accent: '#7C3AED',
    ink: '#4C1D95',
    anim: 'float',
    motif: 'rocket',
  },
  {
    id: 'react_clap',
    category: 'REACTIONS',
    emoji: '👏',
    label: 'Bravo!',
    keywords: ['clap', 'bravo', 'nice', 'good', 'great'],
    bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
    accent: '#059669',
    ink: '#064E3B',
    anim: 'pulse',
    motif: 'sparkles',
  },
  {
    id: 'react_fire',
    category: 'REACTIONS',
    emoji: '🔥',
    label: 'On Fire!',
    keywords: ['fire', 'streak', 'hot', 'lit', 'combo'],
    bg: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)',
    accent: '#E11D48',
    ink: '#881337',
    anim: 'pulse',
    motif: 'flame',
  },
  {
    id: 'react_mindblown',
    category: 'REACTIONS',
    emoji: '⚡',
    label: 'Lightning Fast',
    keywords: ['bolt', 'fast', 'lightning', 'quick', 'wow'],
    bg: 'linear-gradient(135deg, #FEF9C3, #FEF08A)',
    accent: '#CA8A04',
    ink: '#713F12',
    anim: 'wiggle',
    motif: 'bolt',
  },
  {
    id: 'react_squad',
    category: 'REACTIONS',
    emoji: '🛡️',
    label: 'Got Your Back',
    keywords: ['team', 'squad', 'shield', 'help', 'together'],
    bg: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)',
    accent: '#4F46E5',
    ink: '#312E81',
    anim: 'bounce',
    motif: 'shield',
  },
  {
    id: 'victory_trophy',
    category: 'VICTORY',
    emoji: '🏆',
    label: 'Club Champion',
    keywords: ['trophy', 'win', 'winner', 'champ', 'podium'],
    bg: 'linear-gradient(135deg, #FEF3C7, #FCD34D)',
    accent: '#B45309',
    ink: '#78350F',
    anim: 'bounce',
    motif: 'trophy',
  },
  {
    id: 'victory_crown',
    category: 'VICTORY',
    emoji: '👑',
    label: 'Top Rank #1',
    keywords: ['crown', 'king', 'queen', 'first', 'rank'],
    bg: 'linear-gradient(135deg, #FDF2F8, #FBCFE8)',
    accent: '#DB2777',
    ink: '#831843',
    anim: 'float',
    motif: 'crown',
  },
  {
    id: 'victory_bullseye',
    category: 'VICTORY',
    emoji: '🎯',
    label: '100% Spot On',
    keywords: ['target', 'bullseye', 'perfect', 'accuracy', '100'],
    bg: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)',
    accent: '#0E9F6E',
    ink: '#064E3B',
    anim: 'pulse',
    motif: 'target',
  },
  {
    id: 'arabic_marhaba',
    category: 'ARABIC',
    emoji: '🌙',
    label: 'يا هلا بالجميع!',
    keywords: ['arabic', 'marhaba', 'hala', 'hello', 'اهلا', 'هلا'],
    bg: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
    accent: '#0369A1',
    ink: '#0C4A6E',
    anim: 'float',
    motif: 'sparkles',
  },
  {
    id: 'arabic_mubarak',
    category: 'ARABIC',
    emoji: '🌟',
    label: 'أحسنت يا بطل!',
    keywords: ['arabic', 'hero', 'ahsan', 'bravo', 'احسنت', 'بطل'],
    bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
    accent: '#D97706',
    ink: '#78350F',
    anim: 'bounce',
    motif: 'trophy',
  },
  {
    id: 'arabic_yalla',
    category: 'ARABIC',
    emoji: '⚡',
    label: 'يلا بينا!',
    keywords: ['arabic', 'yalla', 'go', 'start', 'يلا'],
    bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
    accent: '#6D28D9',
    ink: '#4C1D95',
    anim: 'wiggle',
    motif: 'rocket',
  },
  {
    id: 'arabic_shukran',
    category: 'ARABIC',
    emoji: '💐',
    label: 'شكراً جزيلاً',
    keywords: ['arabic', 'thanks', 'shukran', 'شكرا'],
    bg: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)',
    accent: '#BE185D',
    ink: '#831843',
    anim: 'pulse',
    motif: 'sparkles',
  },
  {
    id: 'arcade_detective',
    category: 'ARCADE',
    emoji: '🕵️',
    label: 'Case Solved!',
    keywords: ['detective', 'crime', 'clue', 'mystery', 'solved'],
    bg: 'linear-gradient(135deg, #F1F5F9, #CBD5E1)',
    accent: '#334155',
    ink: '#0F172A',
    anim: 'wiggle',
    motif: 'detective',
  },
  {
    id: 'arcade_buzzer',
    category: 'ARCADE',
    emoji: '🚨',
    label: 'Buzzed In First!',
    keywords: ['buzz', 'buzzer', 'fast', 'team', 'arcade'],
    bg: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
    accent: '#DC2626',
    ink: '#7F1D1D',
    anim: 'pulse',
    motif: 'bolt',
  },
  {
    id: 'arcade_vault',
    category: 'ARCADE',
    emoji: '🔐',
    label: 'Vault Cracked!',
    keywords: ['vault', 'lock', 'cipher', 'crack', 'heist'],
    bg: 'linear-gradient(135deg, #ECFDF5, #6EE7B7)',
    accent: '#047857',
    ink: '#064E3B',
    anim: 'bounce',
    motif: 'shield',
  },
];

const STICKER_MAP = new Map(WHATSAPP_STICKERS.map((s) => [s.id, s]));

export function getStickerById(id?: string | null): StickerItem | null {
  if (!id) return null;
  return STICKER_MAP.get(String(id).trim()) || null;
}

export function encodeStickerMessage(sticker: Pick<StickerItem, 'id' | 'label' | 'emoji'>): string {
  return `[STICKER|${sticker.id}|${sticker.label}|${sticker.emoji}]`;
}

export interface ParsedStickerPayload {
  id: string;
  label: string;
  emoji: string;
  sticker: StickerItem | null;
}

export function parseStickerMessage(text?: string | null): ParsedStickerPayload | null {
  const raw = String(text || '').trim();
  if (!raw.startsWith('[STICKER|') || !raw.endsWith(']')) return null;
  const parts = raw.slice(1, -1).split('|');
  if (parts.length < 3) return null;
  const id = parts[1]?.trim() || 'mascot_hi';
  const sticker = getStickerById(id);
  const label = parts[2]?.trim() || sticker?.label || 'Sticker';
  const emoji = parts[3]?.trim() || sticker?.emoji || '✨';
  return { id, label, emoji, sticker };
}

export function filterStickers(
  category: StickerCategoryId,
  query: string,
  recentIds: string[] = []
): StickerItem[] {
  const q = query.trim().toLowerCase();
  let pool: StickerItem[];
  if (q) {
    pool = WHATSAPP_STICKERS;
  } else if (category === 'RECENTS') {
    const recents = recentIds
      .map((id) => getStickerById(id))
      .filter((s): s is StickerItem => Boolean(s));
    pool = recents.length > 0 ? recents : WHATSAPP_STICKERS.slice(0, 6);
  } else {
    pool = WHATSAPP_STICKERS.filter((s) => s.category === category);
  }

  if (!q) return pool;
  return pool.filter((s) => {
    const hay = `${s.label} ${s.emoji} ${s.category} ${s.keywords.join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
}

// Pure Kahoot CSV parsing & escaping (shared between csvQuiz service & Node unit tests)
function csvEscapeCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function quizToKahootCsv(quiz: Partial<QuizPack> | { questions?: QuizQuestion[] }): string {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const rows: string[][] = [
    ['Question', 'Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Time limit (sec)', 'Correct answer(s)', 'Tip'],
  ];

  for (const q of questions) {
    const opts = Array.isArray(q?.options) ? q.options : [];
    const timeLimit = Math.max(5, Math.min(240, Number(q?.timeLimitSec) || 20));
    const correct1Based = Math.min(Math.max((Number(q?.correctIndex) || 0) + 1, 1), 4);
    rows.push([
      String(q?.prompt || '').trim(),
      String(opts[0] ?? '').trim(),
      String(opts[1] ?? '').trim(),
      String(opts[2] ?? '').trim(),
      String(opts[3] ?? '').trim(),
      String(timeLimit),
      String(correct1Based),
      String(q?.tip ?? '').trim(),
    ]);
  }

  return '\uFEFF' + rows.map((r) => r.map(csvEscapeCell).join(',')).join('\r\n');
}

export function parseCsvRows(csvText: string): string[][] {
  const clean = String(csvText || '').replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r') {
      if (clean[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export function parseKahootCsv(
  csvText: string,
  {
    title = 'Imported Kahoot Quiz',
    topic = 'CSV Import',
    cefrLevel = CefrLevel.B1,
  }: { title?: string; topic?: string; cefrLevel?: CefrLevel | string } = {}
): Omit<QuizPack, 'id'> {
  const rows = parseCsvRows(csvText);
  if (!rows.length) {
    throw new Error('The CSV file is empty.');
  }

  const firstLower = rows[0].map((c) => c.trim().toLowerCase());
  const looksLikeHeader =
    firstLower[0]?.includes('question') ||
    firstLower[1]?.includes('answer') ||
    firstLower[0]?.includes('prompt');

  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const questions: QuizQuestion[] = [];

  for (const r of dataRows) {
    if (questions.length >= 60) break;
    const prompt = String(r[0] || '').trim();
    const rawOpts = [r[1], r[2], r[3], r[4]].map((v) => String(v || '').trim());
    const validOpts = rawOpts.filter(Boolean);
    if (!prompt || validOpts.length < 2) continue;
    while (validOpts.length < 4) validOpts.push('None of the above');

    const timeLimit = Math.max(5, Math.min(120, Number(r[5]) || 20));
    const rawCorrect = String(r[6] || '1').split(/[,;|/\s]+/)[0];
    const parsedNum = Number(rawCorrect);
    let correctIndex = 0;
    if (Number.isFinite(parsedNum)) {
      correctIndex = parsedNum === 0 ? 0 : Math.min(Math.max(parsedNum - 1, 0), 3);
    }
    const tip = String(r[7] || '').trim();
    questions.push({
      prompt,
      options: validOpts.slice(0, 4),
      correctIndex,
      timeLimitSec: timeLimit,
      tip,
    });
  }

  if (!questions.length) {
    throw new Error(
      'No valid questions found. Use columns: Question, Answer 1, Answer 2, Answer 3, Answer 4, Time limit (sec), Correct answer(s).'
    );
  }

  const hasArabic = questions.some((q) =>
    /[\u0600-\u06FF]/.test(`${q.prompt} ${q.options.join(' ')}`)
  );
  return {
    title: String(title || 'Imported Quiz').trim().slice(0, 80),
    topic: String(topic || 'CSV Import').trim().slice(0, 40),
    cefrLevel,
    language: hasArabic ? 'AR' : 'EN',
    questions,
    source: 'CSV',
  };
}
