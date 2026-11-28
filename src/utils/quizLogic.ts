import {
  DifficultyLevel,
  QuizQuestion,
  RevealStandingEntry,
  RoomPlayer,
  ScoreRecord,
} from '../types';
import { DIFFICULTY_CONFIG } from './constants';

export function computeQuizPointsEarned(
  isCorrect: boolean,
  timeRemainingSec: number,
  totalLimitSec: number,
  currentStreak: number
): number {
  if (!isCorrect) return 0;
  const safeLimit = Math.max(totalLimitSec, 1);
  const ratio = Math.min(Math.max(timeRemainingSec / safeLimit, 0), 1);
  const speedBonus = Math.round(500 * ratio);
  const streakBonus = Math.min(Math.max(currentStreak, 0), 5) * 50;
  return 500 + speedBonus + streakBonus;
}

export function computeAdaptiveDifficulty(streak: number, accuracyPct: number): DifficultyLevel {
  if (streak >= 3 && accuracyPct >= 80) return DifficultyLevel.HARD;
  if (accuracyPct < 50) return DifficultyLevel.EASY;
  return DifficultyLevel.MEDIUM;
}

export function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function prepareDynamicQuizQuestions(questions: QuizQuestion[] = []): QuizQuestion[] {
  return shuffleArray(questions).map((q) => {
    const opts = q.options || [];
    if (opts.length <= 1) return { ...q };
    const indexed = shuffleArray(opts.map((opt, idx) => ({ idx, opt })));
    const newCorrect = Math.max(
      0,
      indexed.findIndex((item) => item.idx === Number(q.correctIndex))
    );
    return {
      ...q,
      options: indexed.map((item) => item.opt),
      correctIndex: newCorrect,
    };
  });
}

export function resolveQuestionLimitSec(
  question?: QuizQuestion | null,
  difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
): number {
  const raw = Number(question?.timeLimitSec || 0);
  if (raw >= 5 && raw <= 120) {
    if (difficulty === DifficultyLevel.EASY) return Math.max(raw, 25);
    if (difficulty === DifficultyLevel.HARD) return Math.min(raw, 14);
    return raw;
  }
  return DIFFICULTY_CONFIG[difficulty]?.timeLimitSec ?? 20;
}

export function buildRoomLeaderboardEntries(players: RoomPlayer[] = []): RoomPlayer[] {
  return [...players]
    .sort((a, b) => {
      const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      const deltaDiff = Number(b.lastPointsEarned || 0) - Number(a.lastPointsEarned || 0);
      if (deltaDiff !== 0) return deltaDiff;
      return String(a.nickname || '').localeCompare(String(b.nickname || ''));
    })
    .slice(0, 25);
}

/**
 * Builds ranked per-question standings immediately after a live question is revealed.
 * Merges live `players` docs with `room.leaderboard` snapshot so every participant's
 * rank, round delta (+points), streak, and correctness are visible cleanly.
 */
export function buildRevealLeaderboardStandings(
  players: RoomPlayer[] = [],
  leaderboardFallback: RoomPlayer[] = [],
  questionIndex: number,
  currentUid: string
): RevealStandingEntry[] {
  const byUid = new Map<string, RoomPlayer>();

  for (const entry of leaderboardFallback) {
    const uid = String(entry.playerUid || entry.uid || '').trim();
    if (!uid) continue;
    byUid.set(uid, { ...entry, uid, playerUid: uid });
  }

  for (const player of players) {
    const uid = String(player.playerUid || player.uid || '').trim();
    if (!uid) continue;
    byUid.set(uid, { ...player, uid, playerUid: uid });
  }

  const sorted = Array.from(byUid.values()).sort((a, b) => {
    const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const streakDiff = Number(b.streak || 0) - Number(a.streak || 0);
    if (streakDiff !== 0) return streakDiff;
    const deltaDiff = Number(b.lastPointsEarned || 0) - Number(a.lastPointsEarned || 0);
    if (deltaDiff !== 0) return deltaDiff;
    return String(a.nickname || '').localeCompare(String(b.nickname || ''));
  });

  return sorted.map((p, index) => {
    const uid = String(p.playerUid || p.uid || '');
    const answeredThisQuestion = Number(p.lastAnsweredQuestion ?? -1) === Number(questionIndex);
    return {
      playerUid: uid,
      nickname: p.nickname || 'Player',
      avatarColor: p.avatarColor || 'INDIGO',
      score: Number(p.score || 0),
      streak: Number(p.streak || 0),
      lastPointsEarned: answeredThisQuestion ? Number(p.lastPointsEarned || 0) : 0,
      lastAnswerCorrect: answeredThisQuestion ? Boolean(p.lastAnswerCorrect) : false,
      answeredThisQuestion,
      rank: index + 1,
      isCurrentUser: uid === currentUid,
    };
  });
}

/**
 * Builds post-question reveal leaderboard for Solo Blitz using the active player's
 * live score alongside real recorded high scores from the club ledger (no synthetic bots).
 */
export function buildSoloBlitzStandings({
  currentUid,
  playerName,
  avatarColor,
  liveScore,
  lastPointsEarned,
  streak,
  isCorrect,
  recentRecords = [],
}: {
  currentUid: string;
  playerName: string;
  avatarColor: string;
  liveScore: number;
  lastPointsEarned: number;
  streak: number;
  isCorrect: boolean;
  recentRecords?: ScoreRecord[];
}): RevealStandingEntry[] {
  const currentEntry: RevealStandingEntry = {
    playerUid: currentUid,
    nickname: `${playerName || 'You'} (Live Run)`,
    avatarColor: avatarColor || 'INDIGO',
    score: liveScore,
    streak,
    lastPointsEarned,
    lastAnswerCorrect: isCorrect,
    answeredThisQuestion: true,
    rank: 1,
    isCurrentUser: true,
  };

  const peersByPlayer = new Map<string, RevealStandingEntry>();
  for (const rec of recentRecords) {
    if (!rec || !rec.playerName) continue;
    const recUid = String(rec.userId || rec.playerName);
    if (recUid === currentUid && Number(rec.score || 0) <= liveScore) continue;
    const existing = peersByPlayer.get(recUid);
    if (!existing || Number(rec.score || 0) > existing.score) {
      peersByPlayer.set(recUid, {
        playerUid: `rec_${recUid}`,
        nickname: `${rec.playerName} (Club Best)`,
        avatarColor: rec.avatarColor || 'BLUE',
        score: Number(rec.score || 0),
        streak: Number(rec.streak || 0),
        lastPointsEarned: 0,
        lastAnswerCorrect: true,
        answeredThisQuestion: false,
        rank: 0,
        isCurrentUser: false,
      });
    }
  }

  const combined = [currentEntry, ...Array.from(peersByPlayer.values())]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? -1 : 1;
      return a.nickname.localeCompare(b.nickname);
    })
    .slice(0, 6);

  return combined.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

/**
 * Host-only departure detector: compares previous player roster against next roster
 * and returns newly departed players ONLY when `isHost === true`.
 */
export function detectDepartedPlayers(
  prevPlayers: RoomPlayer[] = [],
  nextPlayers: RoomPlayer[] = [],
  isHost: boolean,
  hostUid = ''
): RoomPlayer[] {
  if (!isHost) return [];
  const nextIds = new Set(
    nextPlayers.map((p) => String(p.playerUid || p.uid || '').trim()).filter(Boolean)
  );
  return prevPlayers.filter((p) => {
    const uid = String(p.playerUid || p.uid || '').trim();
    if (!uid || (hostUid && uid === hostUid)) return false;
    return !nextIds.has(uid);
  });
}

/**
 * Computes per-option selection counts (for Kahoot-style post-question reveal bars)
 * from room players who answered the target question index.
 */
export function computeAnswerDistribution(
  players: RoomPlayer[] = [],
  questionIndex: number,
  optionCount = 4
): number[] {
  const safeLen = Math.max(1, Math.min(optionCount, 6));
  const counts = new Array<number>(safeLen).fill(0);
  for (const p of players) {
    if (Number(p.lastAnsweredQuestion ?? -1) !== Number(questionIndex)) continue;
    const idx = Number(p.lastAnswerIndex ?? -1);
    if (idx >= 0 && idx < safeLen) {
      counts[idx] += 1;
    }
  }
  return counts;
}

/**
 * Picks up to 2 incorrect option indices to eliminate for a 50/50 lifeline booster.
 */
export function pickFiftyFiftyEliminations(
  optionCount: number,
  correctIndex: number
): number[] {
  const wrongIndices: number[] = [];
  for (let i = 0; i < optionCount; i++) {
    if (i !== correctIndex) wrongIndices.push(i);
  }
  return shuffleArray(wrongIndices).slice(0, Math.min(2, Math.max(0, wrongIndices.length - 1)));
}
