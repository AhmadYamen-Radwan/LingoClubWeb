import {
  CefrLevel,
  ChatMessage,
  FlashcardDeck,
  QuizPack,
  RoleplayScenario,
  ScoreRecord,
  SessionRecord,
  Team,
  TeamContribution,
  TeamMember,
  UserProfile,
  WeeklyProgressRecord,
} from '../types';
import { createDefaultProfile } from '../utils/constants';

const KEYS = {
  theme: 'lingoclub_v1_theme',
  profile: 'lingoclub_v1_profile',
  sessions: 'lingoclub_v1_sessions',
  weekly: 'lingoclub_v1_weekly',
  customDecks: 'lingoclub_v1_custom_decks',
  customQuizzes: 'lingoclub_v1_custom_quizzes',
  customRoleplays: 'lingoclub_v1_custom_roleplays',
  leaderboard: 'lingoclub_v1_leaderboard',
  teams: 'lingoclub_v1_teams',
  teamMessages: 'lingoclub_v1_team_messages',
  teamMembers: 'lingoclub_v1_team_members',
  teamContributions: 'lingoclub_v1_team_contribs',
  activeTeamId: 'lingoclub_v1_active_team',
  recentStickers: 'lingoclub_v1_recent_stickers',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private mode issues
  }
}

export const offlineStore = {
  getTheme(): 'light' | 'dark' {
    try {
      const val = localStorage.getItem(KEYS.theme);
      return val === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(KEYS.theme, theme === 'dark' ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  },

  getProfile(fallbackName = 'Offline Explorer'): UserProfile {
    const saved = safeGet<Partial<UserProfile> | null>(KEYS.profile, null);
    if (!saved) return createDefaultProfile({ displayName: fallbackName });
    return {
      ...createDefaultProfile({ displayName: fallbackName }),
      ...saved,
      earnedBadges: Array.isArray(saved.earnedBadges) ? saved.earnedBadges : [],
      pinnedEvidenceIds: Array.isArray(saved.pinnedEvidenceIds) ? saved.pinnedEvidenceIds : [],
    };
  },

  saveProfile(profile: UserProfile): UserProfile {
    safeSet(KEYS.profile, profile);
    return profile;
  },

  getSessions(): SessionRecord[] {
    return safeGet<SessionRecord[]>(KEYS.sessions, []);
  },

  saveSession(session: SessionRecord): SessionRecord[] {
    const next = [session, ...this.getSessions()].slice(0, 60);
    safeSet(KEYS.sessions, next);
    return next;
  },

  getAllWeeklyProgress(): Record<string, WeeklyProgressRecord> {
    return safeGet<Record<string, WeeklyProgressRecord>>(KEYS.weekly, {});
  },

  getWeeklyProgress(weekNumber: number): WeeklyProgressRecord {
    const all = this.getAllWeeklyProgress();
    const key = String(weekNumber);
    return (
      all[key] || {
        weekNumber,
        masteredWordIds: [],
        completedSessions: [],
        gamesPlayed: 0,
      }
    );
  },

  saveWeeklyProgress(weekNumber: number, progress: WeeklyProgressRecord): WeeklyProgressRecord {
    const all = this.getAllWeeklyProgress();
    all[String(weekNumber)] = {
      weekNumber,
      masteredWordIds: Array.isArray(progress.masteredWordIds) ? progress.masteredWordIds : [],
      completedSessions: Array.isArray(progress.completedSessions) ? progress.completedSessions : [],
      gamesPlayed: Number(progress.gamesPlayed || 0),
    };
    safeSet(KEYS.weekly, all);
    return all[String(weekNumber)];
  },

  getCustomDecks(): FlashcardDeck[] {
    return safeGet<FlashcardDeck[]>(KEYS.customDecks, []);
  },

  saveCustomDeck(deck: FlashcardDeck): FlashcardDeck[] {
    const current = this.getCustomDecks().filter((d) => d.id !== deck.id);
    const next = [deck, ...current].slice(0, 50);
    safeSet(KEYS.customDecks, next);
    return next;
  },

  deleteCustomDeck(deckId: string): FlashcardDeck[] {
    const next = this.getCustomDecks().filter((d) => d.id !== deckId);
    safeSet(KEYS.customDecks, next);
    return next;
  },

  getCustomQuizzes(): QuizPack[] {
    return safeGet<QuizPack[]>(KEYS.customQuizzes, []);
  },

  saveCustomQuiz(quiz: QuizPack): QuizPack[] {
    const current = this.getCustomQuizzes().filter((q) => q.id !== quiz.id);
    const next = [quiz, ...current].slice(0, 50);
    safeSet(KEYS.customQuizzes, next);
    return next;
  },

  deleteCustomQuiz(quizId: string): QuizPack[] {
    const next = this.getCustomQuizzes().filter((q) => q.id !== quizId);
    safeSet(KEYS.customQuizzes, next);
    return next;
  },

  getCustomRoleplays(): RoleplayScenario[] {
    return safeGet<RoleplayScenario[]>(KEYS.customRoleplays, []);
  },

  saveCustomRoleplay(rp: RoleplayScenario): RoleplayScenario[] {
    const current = this.getCustomRoleplays().filter((r) => r.id !== rp.id);
    const next = [rp, ...current].slice(0, 40);
    safeSet(KEYS.customRoleplays, next);
    return next;
  },

  getLocalLeaderboard(): ScoreRecord[] {
    return safeGet<ScoreRecord[]>(KEYS.leaderboard, []);
  },

  addLocalLeaderboardScore(entry: ScoreRecord): ScoreRecord[] {
    const next = [entry, ...this.getLocalLeaderboard()]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 60);
    safeSet(KEYS.leaderboard, next);
    return next;
  },

  getLocalTeams(): Team[] {
    const existing = safeGet<Team[] | null>(KEYS.teams, null);
    if (existing && existing.length > 0) {
      let migrated = false;
      const cleaned = existing.map((t) => {
        if (t.id === 'teacher_hub_club' || t.channelKind === 'TEACHER_HUB') {
          migrated = true;
          return {
            ...t,
            id: 'club_general_lounge',
            name: 'Club Lounge — All Players',
            motto: 'Party rooms, word challenges, stickers & hangout chat!',
            leaderUid: 'club_lounge',
            leaderName: 'Club Lounge',
            channelKind: 'CLUB',
          };
        }
        return t;
      });
      if (migrated) safeSet(KEYS.teams, cleaned);
      return cleaned;
    }
    const defaults: Team[] = [
      {
        id: 'club_general_lounge',
        visibility: 'CLUB',
        name: 'Club Lounge — All Players',
        cefrLevel: CefrLevel.B1,
        motto: 'Party rooms, word challenges, stickers & hangout chat!',
        accentColor: 'INDIGO',
        leaderUid: 'club_lounge',
        leaderName: 'Club Lounge',
        channelKind: 'CLUB',
        memberCount: 1,
        createdAtMs: Date.now() - 86400000,
      },
      {
        id: 'team_falcon',
        visibility: 'CLUB',
        name: 'Falcon Squad',
        cefrLevel: CefrLevel.B1,
        motto: 'Fast clues, bold guesses, zero hesitation!',
        accentColor: 'MINT',
        leaderUid: 'club_falcon',
        leaderName: 'Falcon Lead',
        channelKind: 'TEAM',
        memberCount: 4,
        createdAtMs: Date.now() - 43200000,
      },
      {
        id: 'team_aurora',
        visibility: 'CLUB',
        name: 'Aurora Circle',
        cefrLevel: CefrLevel.B2,
        motto: 'Sharp idioms and smooth conversations.',
        accentColor: 'CORAL',
        leaderUid: 'club_aurora',
        leaderName: 'Aurora Lead',
        channelKind: 'TEAM',
        memberCount: 3,
        createdAtMs: Date.now() - 21600000,
      },
    ];
    safeSet(KEYS.teams, defaults);
    return defaults;
  },

  saveLocalTeams(teams: Team[]): Team[] {
    safeSet(KEYS.teams, teams);
    return teams;
  },

  getLocalMessages(teamId: string): ChatMessage[] {
    const all = safeGet<Record<string, ChatMessage[]>>(KEYS.teamMessages, {});
    return all[teamId] || [];
  },

  addLocalMessage(teamId: string, message: ChatMessage): ChatMessage[] {
    const all = safeGet<Record<string, ChatMessage[]>>(KEYS.teamMessages, {});
    const list = all[teamId] || [];
    if (!list.some((m) => m.id === message.id)) {
      all[teamId] = [...list, message].slice(-120);
      safeSet(KEYS.teamMessages, all);
    }
    return all[teamId];
  },

  getActiveTeamId(): string {
    const saved = safeGet<string>(KEYS.activeTeamId, 'club_general_lounge');
    return saved === 'teacher_hub_club' ? 'club_general_lounge' : saved;
  },

  setActiveTeamId(teamId: string): void {
    safeSet(KEYS.activeTeamId, teamId);
  },

  getTeamContributions(): TeamContribution[] {
    return safeGet<TeamContribution[]>(KEYS.teamContributions, []);
  },

  addTeamContribution(entry: TeamContribution): TeamContribution[] {
    const list = this.getTeamContributions();
    const next = [entry, ...list].slice(0, 120);
    safeSet(KEYS.teamContributions, next);
    return next;
  },

  getTeamMembers(teamId: string): TeamMember[] {
    const all = safeGet<Record<string, TeamMember[]> | null>(KEYS.teamMembers, null);
    if (!all) {
      const now = Date.now();
      const seeded: Record<string, TeamMember[]> = {
        team_falcon: [
          { id: 'mem_falcon_1', teamId: 'team_falcon', displayName: 'Falcon Lead', avatarColor: 'MINT', role: 'CAPTAIN', addedByUid: 'seed', createdAtMs: now - 400000 },
          { id: 'mem_falcon_2', teamId: 'team_falcon', displayName: 'Lina', avatarColor: 'INDIGO', role: 'PLAYER', addedByUid: 'seed', createdAtMs: now - 300000 },
          { id: 'mem_falcon_3', teamId: 'team_falcon', displayName: 'Zaid', avatarColor: 'AMBER', role: 'PLAYER', addedByUid: 'seed', createdAtMs: now - 200000 },
        ],
        team_aurora: [
          { id: 'mem_aurora_1', teamId: 'team_aurora', displayName: 'Aurora Lead', avatarColor: 'CORAL', role: 'CAPTAIN', addedByUid: 'seed', createdAtMs: now - 400000 },
          { id: 'mem_aurora_2', teamId: 'team_aurora', displayName: 'Nadia', avatarColor: 'PURPLE', role: 'PLAYER', addedByUid: 'seed', createdAtMs: now - 250000 },
        ],
      };
      safeSet(KEYS.teamMembers, seeded);
      return seeded[teamId] || [];
    }
    return all[teamId] || [];
  },

  getAllLocalTeamMembers(): Record<string, TeamMember[]> {
    this.getTeamMembers('team_falcon');
    return safeGet<Record<string, TeamMember[]>>(KEYS.teamMembers, {});
  },

  addTeamMember(teamId: string, member: TeamMember): TeamMember[] {
    const all = this.getAllLocalTeamMembers();
    const current = all[teamId] || [];
    const next = [...current.filter((m) => m.id !== member.id), member].slice(0, 40);
    all[teamId] = next;
    safeSet(KEYS.teamMembers, all);
    return next;
  },

  removeTeamMember(teamId: string, memberId: string): TeamMember[] {
    const all = this.getAllLocalTeamMembers();
    const current = all[teamId] || [];
    const next = current.filter((m) => m.id !== memberId);
    all[teamId] = next;
    safeSet(KEYS.teamMembers, all);
    return next;
  },

  getRecentStickers(): string[] {
    return safeGet<string[]>(KEYS.recentStickers, []);
  },

  pushRecentSticker(stickerId: string): string[] {
    const prev = this.getRecentStickers().filter((id) => id !== stickerId);
    const next = [stickerId, ...prev].slice(0, 12);
    safeSet(KEYS.recentStickers, next);
    return next;
  },
};
