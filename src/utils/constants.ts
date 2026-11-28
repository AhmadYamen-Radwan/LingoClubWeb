import { CefrLevel, DifficultyLevel, UserProfile } from '../types';

export const CEFR_LEVELS: CefrLevel[] = [
  CefrLevel.A1,
  CefrLevel.A2,
  CefrLevel.B1,
  CefrLevel.B2,
];

export const CEFR_LABELS: Record<string, string> = {
  A1: 'A1 · Beginner',
  A2: 'A2 · Elementary',
  B1: 'B1 · Intermediate',
  B2: 'B2 · Upper-Int',
};

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  DifficultyLevel.EASY,
  DifficultyLevel.MEDIUM,
  DifficultyLevel.HARD,
];

export interface ExtendedDifficultyConfig {
  id: DifficultyLevel;
  label: string;
  short: string;
  timeLimitSec: number;
  dashDurationSec: number;
  detectiveLives: number;
  vaultRows: number;
  duelDurationSec: number;
  xpMultiplier: number;
  maxAttempts: number;
  description: string;
}

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, ExtendedDifficultyConfig> = {
  [DifficultyLevel.EASY]: {
    id: DifficultyLevel.EASY,
    label: 'Easy',
    short: 'Easy',
    timeLimitSec: 30,
    dashDurationSec: 45,
    detectiveLives: 8,
    vaultRows: 6,
    duelDurationSec: 55,
    xpMultiplier: 1.0,
    maxAttempts: 6,
    description: 'Relaxed timer with generous lives and extra hints.',
  },
  [DifficultyLevel.MEDIUM]: {
    id: DifficultyLevel.MEDIUM,
    label: 'Medium',
    short: 'Medium',
    timeLimitSec: 20,
    dashDurationSec: 30,
    detectiveLives: 6,
    vaultRows: 5,
    duelDurationSec: 40,
    xpMultiplier: 1.25,
    maxAttempts: 5,
    description: 'Balanced club speed with +25% bonus XP.',
  },
  [DifficultyLevel.HARD]: {
    id: DifficultyLevel.HARD,
    label: 'Hard',
    short: 'Hard',
    timeLimitSec: 12,
    dashDurationSec: 20,
    detectiveLives: 4,
    vaultRows: 4,
    duelDurationSec: 25,
    xpMultiplier: 1.5,
    maxAttempts: 4,
    description: 'Rapid-fire blitz timing with +50% bonus XP.',
  },
};

export const ACTIVITY_LABELS: Record<string, string> = {
  QUIZ: 'Quiz Clash',
  PUZZLE: 'Word Forge',
  CARDS: 'Deck Studio',
  GUESSING: 'Taboo & Act',
  ROLEPLAY: 'Roleplay Stage',
  AUDIOBOOK: 'Audiobook',
  WEEKLY_SESSION: 'Weekly Quest',
  GAME: 'Arcade Game',
};

export const VOCAB_DOMAIN_LABELS: Record<string, string> = {
  EVERYDAY: 'Everyday & Home',
  WORK_TECH: 'Work & Tech',
  TRAVEL_FOOD: 'Travel & Café',
  STORY_EMOTION: 'Stories & Feelings',
  IDIOMS_ACTION: 'Idioms & Action',
  MEDICAL: 'Medical',
  ENGINEERING: 'Engineering',
  SOFTWARE: 'Software',
  BUSINESS: 'Business',
  ACADEMIC: 'Academic',
  LEGAL: 'Legal',
};

export interface LingoBadge {
  id: string;
  title: string;
  subtitle: string;
  criteria: string;
  category: 'WEEKLY' | 'QUIZ' | 'CLUB';
  icon: string;
}

export const LINGO_BADGES: LingoBadge[] = [
  {
    id: 'FIRST_WEEKLY_SESSION',
    title: 'Quest Starter',
    subtitle: 'Completed your first weekly 200-word quest round',
    criteria: 'Complete 1 weekly quest round',
    category: 'WEEKLY',
    icon: '📅',
  },
  {
    id: 'THREE_WEEKLY_SESSIONS',
    title: 'Weekly Hat-Trick',
    subtitle: 'Finished all 3 rounds in a weekly 200-word quest',
    criteria: 'Complete 3 weekly rounds',
    category: 'WEEKLY',
    icon: '🏆',
  },
  {
    id: 'WEEKLY_WORDS_50',
    title: 'Word Builder',
    subtitle: 'Mastered 50+ vocabulary words across domains',
    criteria: 'Master 50 weekly words',
    category: 'WEEKLY',
    icon: '📚',
  },
  {
    id: 'WEEKLY_WORDS_200',
    title: '200-Word Champion',
    subtitle: 'Mastered 200+ weekly curriculum words',
    criteria: 'Master 200 weekly words',
    category: 'WEEKLY',
    icon: '👑',
  },
  {
    id: 'QUIZ_FIRST_CLASH',
    title: 'Quiz Challenger',
    subtitle: 'Completed your first interactive Quiz Clash',
    criteria: 'Complete 1 quiz',
    category: 'QUIZ',
    icon: '⚡',
  },
  {
    id: 'LIVE_QUIZ_HIGH_SCORE',
    title: 'Live Quiz Ace',
    subtitle: 'Hit 1,000+ points in a Live or Blitz Quiz Clash',
    criteria: 'Score 1,000+ quiz points',
    category: 'QUIZ',
    icon: '🌟',
  },
  {
    id: 'QUIZ_PERFECT_ROUND',
    title: 'Sharpshooter',
    subtitle: 'Achieved 90%+ accuracy in a quiz round',
    criteria: 'Reach 90%+ quiz accuracy',
    category: 'QUIZ',
    icon: '🎯',
  },
  {
    id: 'CLUB_HOST_PRO',
    title: 'Club Host',
    subtitle: 'Hosted a live Kahoot-style quiz room for friends',
    criteria: 'Host 1 live quiz room',
    category: 'QUIZ',
    icon: '🎙️',
  },
  {
    id: 'AUDIOBOOK_LISTENER',
    title: 'Story Listener',
    subtitle: 'Finished an interactive audiobook chapter',
    criteria: 'Complete 1 audiobook chapter',
    category: 'CLUB',
    icon: '🎧',
  },
  {
    id: 'STAGE_SPEAKER',
    title: 'Stage Speaker',
    subtitle: 'Performed on the Roleplay Stage or voice coach',
    criteria: 'Complete 1 roleplay or speech review',
    category: 'CLUB',
    icon: '🎭',
  },
  {
    id: 'ARCADE_CHALLENGER',
    title: 'Arcade Player',
    subtitle: 'Completed a game in the Interactive Arcade',
    criteria: 'Finish 1 Arcade game round',
    category: 'CLUB',
    icon: '🎮',
  },
  {
    id: 'COMBO_STREAKER',
    title: 'Combo Streak 5x',
    subtitle: 'Hit a 5+ word combo streak in an arcade game',
    criteria: 'Reach 5x combo in Arcade',
    category: 'QUIZ',
    icon: '🔥',
  },
];

export interface BadgeEvalInput {
  existingIds?: string[];
  sessionsCompleted?: number;
  weeklyWordsMastered?: number;
  quizzesPlayed?: number;
  quizzesHosted?: number;
  bestLiveQuizScore?: number;
  latestQuizAccuracyPct?: number;
  audiobooksFinished?: number;
  roleplayCompleted?: boolean;
  arcadePlayed?: boolean;
  highCombo?: number;
}

export const BadgeEngine = {
  computeNewBadges({
    existingIds = [],
    sessionsCompleted = 0,
    weeklyWordsMastered = 0,
    quizzesPlayed = 0,
    quizzesHosted = 0,
    bestLiveQuizScore = 0,
    latestQuizAccuracyPct = 0,
    audiobooksFinished = 0,
    roleplayCompleted = false,
    arcadePlayed = false,
    highCombo = 0,
  }: BadgeEvalInput): LingoBadge[] {
    const candidates: string[] = [];
    if (sessionsCompleted >= 1) candidates.push('FIRST_WEEKLY_SESSION');
    if (sessionsCompleted >= 3) candidates.push('THREE_WEEKLY_SESSIONS');
    if (weeklyWordsMastered >= 50) candidates.push('WEEKLY_WORDS_50');
    if (weeklyWordsMastered >= 200) candidates.push('WEEKLY_WORDS_200');
    if (quizzesPlayed >= 1) candidates.push('QUIZ_FIRST_CLASH');
    if (bestLiveQuizScore >= 1000) candidates.push('LIVE_QUIZ_HIGH_SCORE');
    if (quizzesPlayed >= 1 && latestQuizAccuracyPct >= 90) candidates.push('QUIZ_PERFECT_ROUND');
    if (quizzesHosted >= 1) candidates.push('CLUB_HOST_PRO');
    if (audiobooksFinished >= 1) candidates.push('AUDIOBOOK_LISTENER');
    if (roleplayCompleted) candidates.push('STAGE_SPEAKER');
    if (arcadePlayed) candidates.push('ARCADE_CHALLENGER');
    if (highCombo >= 5) candidates.push('COMBO_STREAKER');

    const existingSet = new Set(existingIds);
    return LINGO_BADGES.filter((b) => candidates.includes(b.id) && !existingSet.has(b.id));
  },
};

export const AVATAR_COLOR_HEX: Record<string, string> = {
  INDIGO: '#563AE4',
  CORAL: '#FF5A5F',
  AMBER: '#F59E0B',
  MINT: '#0E9F6E',
  BLUE: '#1368CE',
  PURPLE: '#7C3AED',
};

export function avatarColorForTag(tag?: string): string {
  return AVATAR_COLOR_HEX[String(tag || '').toUpperCase()] || AVATAR_COLOR_HEX.INDIGO;
}

export const DEFAULT_CLUB_LOUNGE_ID = 'club_general_lounge';

export const DEFAULT_BATTLE_TEAMS = [
  { id: 'team_falcon', name: 'Falcon Squad', motto: 'Fast clues & sharp banter', accentColor: 'INDIGO' as const },
  { id: 'team_aurora', name: 'Aurora Circle', motto: 'Party trivia & quick vocabulary', accentColor: 'MINT' as const },
  { id: 'team_nova', name: 'Nova Detectives', motto: 'Crack every mystery first', accentColor: 'CORAL' as const },
  { id: 'team_cedar', name: 'Cedar Legends', motto: 'Daily streaks & arcade wins', accentColor: 'AMBER' as const },
];

export function isArabicText(text?: string | null): boolean {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

export function sanitizeId(raw?: string | null): string {
  return (
    String(raw || '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 128) || 'item_0'
  );
}

export function epochDayNow(): number {
  return Math.floor(Date.now() / 86400000);
}

export function generatePin6(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function createDefaultProfile({
  userId = 'offline_explorer',
  displayName = 'Offline Explorer',
  learningLevel = CefrLevel.B1,
}: {
  userId?: string;
  displayName?: string;
  learningLevel?: CefrLevel | string;
} = {}): UserProfile {
  return {
    userId,
    displayName,
    learningLevel,
    xp: 0,
    streak: 1,
    quizzesHosted: 0,
    quizzesPlayed: 0,
    cardsMastered: 0,
    sessionsCompleted: 0,
    audiobooksFinished: 0,
    weeklyWordsMastered: 0,
    bestLiveQuizScore: 0,
    earnedBadges: [],
    pinnedEvidenceIds: [],
    teamId: '',
    teamName: '',
    sfxMuted: false,
    sfxVolume: 85,
    lastActiveEpochDay: epochDayNow(),
  };
}

export interface PlayerRankInfo {
  level: number;
  title: string;
  icon: string;
  currentXp: number;
  nextRankXp: number | null;
  progressPct: number;
}

const PLAYER_RANK_TIERS = [
  { level: 1, minXp: 0, title: 'Rookie Explorer', icon: '🌱' },
  { level: 2, minXp: 250, title: 'Word Scout', icon: '🧭' },
  { level: 3, minXp: 750, title: 'Quiz Contender', icon: '⚡' },
  { level: 4, minXp: 1500, title: 'Squad Ace', icon: '🛡️' },
  { level: 5, minXp: 3000, title: 'Club Champion', icon: '🏆' },
  { level: 6, minXp: 6000, title: 'Grandmaster', icon: '👑' },
];

export function computePlayerRank(xp: number): PlayerRankInfo {
  const safeXp = Math.max(0, Math.round(Number(xp) || 0));
  let idx = 0;
  for (let i = PLAYER_RANK_TIERS.length - 1; i >= 0; i--) {
    if (safeXp >= PLAYER_RANK_TIERS[i].minXp) {
      idx = i;
      break;
    }
  }
  const tier = PLAYER_RANK_TIERS[idx];
  const next = PLAYER_RANK_TIERS[idx + 1] || null;
  if (!next) {
    return {
      level: tier.level,
      title: tier.title,
      icon: tier.icon,
      currentXp: safeXp,
      nextRankXp: null,
      progressPct: 100,
    };
  }
  const span = Math.max(1, next.minXp - tier.minXp);
  const progressPct = Math.min(100, Math.max(0, Math.round(((safeXp - tier.minXp) / span) * 100)));
  return {
    level: tier.level,
    title: tier.title,
    icon: tier.icon,
    currentXp: safeXp,
    nextRankXp: next.minXp,
    progressPct,
  };
}

const NICK_ADJECTIVES = ['Swift', 'Neon', 'Clever', 'Cosmic', 'Bold', 'Lucky', 'Turbo', 'Sunny'];
const NICK_NOUNS = ['Falcon', 'Owl', 'Fox', 'Spark', 'Tiger', 'Comet', 'Panda', 'Lynx'];

export function generateRandomNickname(): string {
  const adj = NICK_ADJECTIVES[Math.floor(Math.random() * NICK_ADJECTIVES.length)];
  const noun = NICK_NOUNS[Math.floor(Math.random() * NICK_NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 89);
  return `${adj}${noun}${num}`;
}

export function formatRelTime(ts?: number): string {
  const value = Number(ts || 0);
  if (!value) return 'just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - value) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
