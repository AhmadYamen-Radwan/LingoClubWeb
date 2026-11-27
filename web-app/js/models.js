// Core Enums, Models, Safe DOM Helpers, Scoring & BadgeEngine
// Direct 1:1 port of com.example.data.model.LingoModels.kt + GameViewModel scoring rules

export const CefrLevel = Object.freeze({
  A1: 'A1',
  A2: 'A2',
  B1: 'B1',
  B2: 'B2'
});
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'];

export const RoomStatus = Object.freeze({
  LOBBY: 'LOBBY',
  QUESTION: 'QUESTION',
  REVEAL: 'REVEAL',
  PODIUM: 'PODIUM'
});

export const ActivityType = Object.freeze({
  QUIZ: 'QUIZ',
  PUZZLE: 'PUZZLE',
  CARDS: 'CARDS',
  GUESSING: 'GUESSING',
  ROLEPLAY: 'ROLEPLAY',
  AUDIOBOOK: 'AUDIOBOOK',
  WEEKLY_SESSION: 'WEEKLY_SESSION',
  GAME: 'GAME'
});

export const ACTIVITY_LABELS = Object.freeze({
  QUIZ: 'Quiz Clash',
  PUZZLE: 'Word Forge',
  CARDS: 'Deck Studio',
  GUESSING: 'Taboo & Act',
  ROLEPLAY: 'Roleplay Stage',
  AUDIOBOOK: 'Audiobook',
  WEEKLY_SESSION: 'Weekly Session',
  GAME: 'Vocab Game'
});

export const VocabDomain = Object.freeze({
  EVERYDAY: 'EVERYDAY',
  WORK_TECH: 'WORK_TECH',
  TRAVEL_FOOD: 'TRAVEL_FOOD',
  STORY_EMOTION: 'STORY_EMOTION',
  IDIOMS_ACTION: 'IDIOMS_ACTION'
});

export const VOCAB_DOMAIN_LABELS = Object.freeze({
  EVERYDAY: 'Everyday & Home',
  WORK_TECH: 'Work & Tech',
  TRAVEL_FOOD: 'Travel & Café',
  STORY_EMOTION: 'Stories & Feelings',
  IDIOMS_ACTION: 'Idioms & Action'
});

export const BadgeCategory = Object.freeze({
  WEEKLY: 'Weekly Mastery',
  QUIZ: 'Live Quiz',
  CLUB: 'Club & Voice'
});

export const LINGO_BADGES = [
  {
    id: 'FIRST_WEEKLY_SESSION',
    title: 'Session Starter',
    subtitle: 'Completed your first weekly 200-word session',
    criteria: 'Complete 1 weekly session',
    category: 'WEEKLY',
    icon: '📅'
  },
  {
    id: 'THREE_WEEKLY_SESSIONS',
    title: 'Weekly Hat-Trick',
    subtitle: 'Finished all 3 sessions in a weekly study cycle',
    criteria: 'Complete 3 weekly sessions',
    category: 'WEEKLY',
    icon: '🏆'
  },
  {
    id: 'WEEKLY_WORDS_50',
    title: 'Word Builder',
    subtitle: 'Mastered 50+ vocabulary words across domains',
    criteria: 'Master 50 weekly words',
    category: 'WEEKLY',
    icon: '📚'
  },
  {
    id: 'WEEKLY_WORDS_200',
    title: '200-Word Champion',
    subtitle: 'Mastered 200+ weekly curriculum words',
    criteria: 'Master 200 weekly words',
    category: 'WEEKLY',
    icon: '👑'
  },
  {
    id: 'QUIZ_FIRST_CLASH',
    title: 'Quiz Challenger',
    subtitle: 'Completed your first interactive Quiz Clash',
    criteria: 'Complete 1 quiz',
    category: 'QUIZ',
    icon: '⚡'
  },
  {
    id: 'LIVE_QUIZ_HIGH_SCORE',
    title: 'Live Quiz Ace',
    subtitle: 'Hit 1,000+ points in a Live or Blitz Quiz Clash',
    criteria: 'Score 1,000+ quiz points',
    category: 'QUIZ',
    icon: '🌟'
  },
  {
    id: 'QUIZ_PERFECT_ROUND',
    title: 'Sharpshooter',
    subtitle: 'Achieved 90%+ accuracy in a quiz round',
    criteria: 'Reach 90%+ quiz accuracy',
    category: 'QUIZ',
    icon: '🎯'
  },
  {
    id: 'CLUB_HOST_PRO',
    title: 'Club Host',
    subtitle: 'Hosted a live Kahoot-style quiz room for friends',
    criteria: 'Host 1 live quiz room',
    category: 'QUIZ',
    icon: '🎙️'
  },
  {
    id: 'AUDIOBOOK_LISTENER',
    title: 'Story Listener',
    subtitle: 'Finished an interactive audiobook chapter',
    criteria: 'Complete 1 audiobook chapter',
    category: 'CLUB',
    icon: '🎧'
  },
  {
    id: 'STAGE_SPEAKER',
    title: 'Stage Speaker',
    subtitle: 'Performed on the Roleplay Stage or voice coach',
    criteria: 'Complete 1 roleplay or speech review',
    category: 'CLUB',
    icon: '🎭'
  },
  {
    id: 'ARCADE_CHALLENGER',
    title: 'Arcade Player',
    subtitle: 'Completed a game in the Interactive Arcade',
    criteria: 'Finish 1 Arcade game round',
    category: 'CLUB',
    icon: '🎮'
  },
  {
    id: 'COMBO_STREAKER',
    title: 'Combo Streak 5x',
    subtitle: 'Hit a 5+ word combo streak in an arcade game',
    criteria: 'Reach 5x combo in Arcade',
    category: 'QUIZ',
    icon: '🔥'
  }
];

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
    highCombo = 0
  }) {
    const candidates = [];
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
  }
};

export const AVATAR_COLOR_HEX = Object.freeze({
  INDIGO: '#563AE4',
  CORAL: '#FF5A5F',
  AMBER: '#F59E0B',
  MINT: '#0E9F6E',
  BLUE: '#1368CE',
  PURPLE: '#7C3AED'
});

export function avatarColorForTag(tag) {
  return AVATAR_COLOR_HEX[String(tag || '').toUpperCase()] || AVATAR_COLOR_HEX.INDIGO;
}

// GameViewModel.kt pure formula parity
export function computeQuizPointsEarned(isCorrect, timeRemainingSec, totalLimitSec, currentStreak) {
  if (!isCorrect) return 0;
  const safeLimit = Math.max(totalLimitSec, 1);
  const ratio = Math.min(Math.max(timeRemainingSec / safeLimit, 0), 1);
  const speedBonus = Math.round(500 * ratio);
  const streakBonus = Math.min(Math.max(currentStreak, 0), 5) * 50;
  return 500 + speedBonus + streakBonus;
}

export function computeAdaptiveDifficulty(streak, accuracyPct) {
  if (streak >= 3 && accuracyPct >= 80) return 'HARD';
  if (accuracyPct < 50) return 'EASY';
  return 'MEDIUM';
}

export function sanitizeId(raw) {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128) || 'item_0';
}

export function epochDayNow() {
  return Math.floor(Date.now() / 86400000);
}

export function generatePin6() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function prepareDynamicQuizQuestions(questions) {
  return shuffleArray(questions || []).map((q) => {
    const opts = q.options || [];
    if (opts.length <= 1) return { ...q };
    const indexed = shuffleArray(opts.map((opt, idx) => ({ idx, opt })));
    const newCorrect = Math.max(0, indexed.findIndex((item) => item.idx === Number(q.correctIndex)));
    return {
      ...q,
      options: indexed.map((item) => item.opt),
      correctIndex: newCorrect
    };
  });
}

// Safe DOM Builder helpers (zero unescaped HTML injection)
export function clearEl(node) {
  while (node && node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'className' || key === 'class') {
        node.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(node.style, value);
      } else if (key === 'dataset' && typeof value === 'object') {
        for (const [dk, dv] of Object.entries(value)) {
          node.dataset[dk] = dv;
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'checked' || key === 'disabled' || key === 'selected' || key === 'readOnly') {
        node[key] = Boolean(value);
      } else if (key === 'value') {
        node.value = value;
      } else {
        node.setAttribute(key, value === true ? '' : String(value));
      }
    }
  }
  const appendChild = (child) => {
    if (child === undefined || child === null || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(appendChild);
    } else if (child instanceof Node) {
      node.appendChild(child);
    } else {
      node.appendChild(document.createTextNode(String(child)));
    }
  };
  children.forEach(appendChild);
  return node;
}

export function createDefaultProfile({
  userId = 'offline_explorer',
  displayName = 'Offline Explorer',
  learningLevel = 'B2',
  accountRole = 'STUDENT'
} = {}) {
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
    accountRole,
    tutorUid: '',
    tutorName: '',
    lastActiveEpochDay: epochDayNow()
  };
}
