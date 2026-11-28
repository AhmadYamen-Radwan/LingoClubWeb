import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { User } from 'firebase/auth';
import {
  ActivityType,
  AppRoute,
  CefrLevel,
  ChatMessage,
  FlashcardDeck,
  GlobalTeamEntry,
  HostAlert,
  QuizPack,
  QuizQuestion,
  RoleplayScenario,
  RoomPlayer,
  RoomSession,
  RoomStatus,
  ScoreRecord,
  SessionRecord,
  Team,
  TeamBuzzerState,
  TeamContribution,
  ToastItem,
  UserProfile,
  WeeklyProgressRecord,
} from '../types';
import { SoundEffectsApi, useSoundEffects } from '../hooks/useSoundEffects';
import { firebaseClient } from '../services/firebaseClient';
import { LocalArcadeRoom, nearbySync } from '../services/nearbySync';
import { offlineStore } from '../services/offlineStore';
import { loadFullDictionary } from '../data/dictionary';
import {
  BadgeEngine,
  DEFAULT_BATTLE_TEAMS,
  avatarColorForTag,
  epochDayNow,
} from '../utils/constants';
import { buildRoomLeaderboardEntries, detectDepartedPlayers } from '../utils/quizLogic';
import { isSystemControlMessage } from '../utils/gameLogic';

const VALID_ROUTES = new Set<AppRoute>([
  'auth',
  'home',
  'quiz',
  'arcade',
  'leaderboard',
  'teams',
  'curriculum',
  'audiobooks',
  'chat',
  'profile',
  'puzzles',
  'cards',
  'guessing',
  'roleplay',
  'dictionary',
]);

function readInitialRoute(): { route: AppRoute; autostart: boolean } {
  if (typeof window === 'undefined') return { route: 'home', autostart: false };
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view') as AppRoute | null;
  const autostart = params.get('autostart') === '1';
  if (viewParam && VALID_ROUTES.has(viewParam)) {
    return { route: viewParam, autostart };
  }
  return { route: 'home', autostart };
}

export interface AppContextValue {
  route: AppRoute;
  autostart: boolean;
  navigate: (next: AppRoute) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sfx: SoundEffectsApi;
  authReady: boolean;
  user: User | null;
  isOfflineMode: boolean;
  currentUid: string;
  profile: UserProfile;
  sessions: SessionRecord[];
  weeklyProgress: Record<string, WeeklyProgressRecord>;
  customQuizzes: QuizPack[];
  customDecks: FlashcardDeck[];
  customRoleplays: RoleplayScenario[];
  teams: Team[];
  activeTeamId: string;
  setActiveTeamId: (teamId: string) => void;
  messagesByTeam: Record<string, ChatMessage[]>;
  globalScores: ScoreRecord[];
  teamContributions: TeamContribution[];
  activeArcadeRooms: LocalArcadeRoom[];
  globalTeamLeaderboard: GlobalTeamEntry[];
  hostedSquad: Team | null;
  roomSession: RoomSession | null;
  hostAlerts: HostAlert[];
  dismissHostAlert: (id: string) => void;
  teamBuzzer: TeamBuzzerState;
  recentStickers: string[];
  recordStickerUsed: (stickerId: string) => void;
  toasts: ToastItem[];
  toast: (message: string, kind?: ToastItem['kind']) => void;
  confettiVersion: number;
  triggerConfetti: () => void;
  signInWithGoogle: () => Promise<void>;
  enterOfflineMode: (name?: string) => void;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => void;
  setLearningLevel: (level: CefrLevel | string) => Promise<void>;
  awardActivity: (params: {
    activityType: ActivityType | string;
    title: string;
    cefrLevel: CefrLevel | string;
    score?: number;
    xpDelta?: number;
    accuracyPct?: number;
    wordsPracticed?: number;
    durationMinutes?: number;
    quizzesHostedDelta?: number;
    quizzesPlayedDelta?: number;
    cardsMasteredDelta?: number;
    sessionsCompletedDelta?: number;
    audiobooksFinishedDelta?: number;
    weeklyWordsMasteredDelta?: number;
    bestLiveQuizScoreCandidate?: number;
    roleplayCompleted?: boolean;
    arcadePlayed?: boolean;
    highCombo?: number;
    publishLeaderboard?: boolean;
    gameMode?: string;
    teamId?: string;
    teamName?: string;
  }) => Promise<void>;
  togglePinEvidence: (cardId: string) => Promise<void>;
  toggleWeeklyWordMastered: (weekNumber: number, wordId: string) => Promise<void>;
  completeWeeklySession: (weekNumber: number, sessionNumber: number, wordIds: string[]) => Promise<void>;
  recordWeeklyGamePlayed: (weekNumber: number) => Promise<void>;
  saveCustomQuiz: (quiz: Omit<QuizPack, 'id'>) => Promise<void>;
  deleteCustomQuiz: (quizId: string) => Promise<void>;
  saveCustomDeck: (deck: Omit<FlashcardDeck, 'id'>) => Promise<void>;
  updateCustomDeck: (deckId: string, deck: Omit<FlashcardDeck, 'id'>) => Promise<void>;
  deleteCustomDeck: (deckId: string) => Promise<void>;
  saveCustomRoleplay: (rp: Omit<RoleplayScenario, 'id'>) => Promise<void>;
  deleteCustomRoleplay: (id: string) => Promise<void>;
  createTeam: (input: { name: string; cefrLevel: string; motto: string; accentColor: string }) => Promise<void>;
  joinTeam: (team: Team) => Promise<void>;
  leaveTeam: () => Promise<void>;
  sendTeamMessage: (teamId: string, text: string, pinned?: boolean) => Promise<void>;
  toggleTeamMessagePin: (teamId: string, messageId: string, pinned: boolean) => Promise<void>;
  deleteTeamMessage: (teamId: string, messageId: string) => Promise<void>;
  hostLocalSquad: (team: Team) => void;
  stopHostingLocalSquad: () => void;
  // Live Quiz Rooms
  hostRoom: (params: {
    mode: 'LOCAL' | 'CLOUD';
    quizTitle: string;
    cefrLevel: CefrLevel | string;
    questions: QuizQuestion[];
  }) => Promise<string>;
  joinRoomByPin: (params: {
    roomCode: string;
    nickname: string;
    avatarColor: string;
    preferredMode?: 'AUTO' | 'LOCAL' | 'CLOUD';
  }) => Promise<void>;
  leaveRoom: () => Promise<void>;
  advanceRoomPhase: (newStatus: RoomStatus | string, nextQuestionIndex?: number) => Promise<void>;
  submitRoomAnswer: (selectedIndex: number, isCorrect: boolean, pointsEarned: number, newStreak: number) => Promise<void>;
  sendRoomChatMessage: (text: string, messageType?: 'TEXT' | 'REACTION') => Promise<void>;
  deleteRoomChatMessage: (messageId: string) => Promise<void>;
  // Team Buzzer & Global Teams
  openTeamBuzzer: (params: {
    contextKey: string;
    title: string;
    prompt: string;
    teams?: Team[];
    sessionScores?: Record<string, number>;
  }) => void;
  closeTeamBuzzer: () => void;
  triggerTeamBuzz: (team: Team) => void;
  resolveTeamBuzz: (outcome: 'AWARDED' | 'WRONG', pointsDelta?: number) => void;
  resetTeamBuzzLock: () => void;
  upsertArcadeRoomScore: (params: {
    roomId: string;
    gameMode: string;
    gameTitle: string;
    teamScores: Record<string, number>;
    teamMeta?: Record<string, { name?: string; motto?: string; accentColor?: string }>;
    activeTeamName?: string;
  }) => void;
  removeArcadeRoomScore: (roomId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(() => readInitialRoute(), []);
  const sfx = useSoundEffects();

  const [route, setRoute] = useState<AppRoute>(initial.route);
  const [autostart] = useState<boolean>(initial.autostart);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => offlineStore.getTheme());

  const [authReady, setAuthReady] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(true);

  const [profile, setProfile] = useState<UserProfile>(() => offlineStore.getProfile());
  const [sessions, setSessions] = useState<SessionRecord[]>(() => offlineStore.getSessions());
  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, WeeklyProgressRecord>>(() =>
    offlineStore.getAllWeeklyProgress()
  );
  const [customQuizzes, setCustomQuizzes] = useState<QuizPack[]>(() => offlineStore.getCustomQuizzes());
  const [customDecks, setCustomDecks] = useState<FlashcardDeck[]>(() => offlineStore.getCustomDecks());
  const [customRoleplays, setCustomRoleplays] = useState<RoleplayScenario[]>(() =>
    offlineStore.getCustomRoleplays()
  );

  const [teams, setTeams] = useState<Team[]>(() => offlineStore.getLocalTeams());
  const [activeTeamId, setActiveTeamIdState] = useState<string>(() => offlineStore.getActiveTeamId());
  const [messagesByTeam, setMessagesByTeam] = useState<Record<string, ChatMessage[]>>({});
  const [globalScores, setGlobalScores] = useState<ScoreRecord[]>(() => offlineStore.getLocalLeaderboard());
  const [teamContributions, setTeamContributions] = useState<TeamContribution[]>(() =>
    offlineStore.getTeamContributions()
  );
  const [activeArcadeRooms, setActiveArcadeRooms] = useState<LocalArcadeRoom[]>(() =>
    Object.values(nearbySync.getSnapshot().arcadeRooms)
  );
  const [hostedSquad, setHostedSquad] = useState<Team | null>(null);

  const [roomSession, setRoomSession] = useState<RoomSession | null>(null);
  const [hostAlerts, setHostAlerts] = useState<HostAlert[]>([]);
  const prevPlayersByRoomRef = useRef<Record<string, RoomPlayer[]>>({});
  const seenDeparturesRef = useRef<Set<string>>(new Set());

  const [teamBuzzer, setTeamBuzzer] = useState<TeamBuzzerState>(() => ({
    open: false,
    contextKey: 'global',
    title: 'Team Fast-Buzz Arena',
    prompt: 'Buzz in first to lock the floor for 5 seconds!',
    teams: DEFAULT_BATTLE_TEAMS.map((t) => ({
      id: t.id,
      name: t.name,
      cefrLevel: CefrLevel.B1,
      motto: t.motto,
      accentColor: t.accentColor,
      leaderUid: 'club',
      leaderName: 'Squad Lead',
      channelKind: 'TEAM',
      memberCount: 4,
    })),
    activeBuzz: null,
    sessionScores: {},
    buzzHistory: [],
  }));

  const [recentStickers, setRecentStickers] = useState<string[]>(() => offlineStore.getRecentStickers());

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confettiVersion, setConfettiVersion] = useState<number>(0);

  const currentUid = user?.uid && !isOfflineMode ? user.uid : profile.userId || 'offline_explorer';

  // Sync theme to document attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    offlineStore.setTheme(theme);
  }, [theme]);

  // Preload 18.6K TSV dictionary in background
  useEffect(() => {
    void loadFullDictionary();
  }, []);

  const toast = useCallback((message: string, kind: ToastItem['kind'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const triggerConfetti = useCallback(() => {
    setConfettiVersion((v) => v + 1);
  }, []);

  const dismissHostAlert = useCallback((id: string) => {
    setHostAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const pushHostDepartures = useCallback(
    (departed: RoomPlayer[], roomCode: string) => {
      if (!departed.length) return;
      const newAlerts: HostAlert[] = [];
      for (const p of departed) {
        const key = `${roomCode}:${p.playerUid || p.uid}:${Math.floor(Date.now() / 3000)}`;
        if (seenDeparturesRef.current.has(key)) continue;
        seenDeparturesRef.current.add(key);
        const nick = p.nickname || 'A player';
        newAlerts.push({
          id: `halert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          playerUid: p.playerUid || p.uid,
          nickname: nick,
          roomCode,
          message: `${nick} left room ${roomCode}`,
          createdAtMs: Date.now(),
        });
      }
      if (newAlerts.length > 0) {
        sfx.playHostAlert();
        setHostAlerts((prev) => [...newAlerts, ...prev].slice(0, 4));
        newAlerts.forEach((a) => {
          setTimeout(() => {
            setHostAlerts((prev) => prev.filter((item) => item.id !== a.id));
          }, 7000);
        });
      }
    },
    [sfx]
  );

  const navigate = useCallback(
    (next: AppRoute) => {
      setRoute(next);
      sfx.playClick();
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('view', next);
        window.history.replaceState({}, '', url.toString());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [sfx]
  );

  const toggleTheme = useCallback(() => {
    sfx.playClick();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [sfx]);

  // Firebase Auth initialization + live Firestore listeners
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubSessions: (() => void) | undefined;
    let unsubWeekly: (() => void) | undefined;
    let unsubQuizzes: (() => void) | undefined;
    let unsubDecks: (() => void) | undefined;
    let unsubRoleplays: (() => void) | undefined;
    let unsubTeams: (() => void) | undefined;
    let unsubScores: (() => void) | undefined;

    const cleanupCloudSubs = () => {
      unsubProfile?.();
      unsubSessions?.();
      unsubWeekly?.();
      unsubQuizzes?.();
      unsubDecks?.();
      unsubRoleplays?.();
      unsubTeams?.();
      unsubScores?.();
    };

    const unsubAuth = firebaseClient.init((authUser) => {
      cleanupCloudSubs();
      setUser(authUser);
      setAuthReady(true);

      if (authUser) {
        setIsOfflineMode(false);
        void firebaseClient
          .ensureUserProfile(authUser.displayName || 'Lingo Member')
          .catch(() => {});
        void firebaseClient
          .ensureDefaultClubLounge(authUser.displayName || 'Club Lounge')
          .catch(() => {});

        unsubProfile = firebaseClient.observeUserProfile(authUser.uid, (cloudProf) => {
          if (cloudProf) setProfile(cloudProf);
        });
        unsubSessions = firebaseClient.observeSessionHistory(authUser.uid, setSessions);
        unsubWeekly = firebaseClient.observeWeeklyProgress(authUser.uid, setWeeklyProgress);
        unsubQuizzes = firebaseClient.observeCustomQuizzes(authUser.uid, setCustomQuizzes);
        unsubDecks = firebaseClient.observeCustomDecks(authUser.uid, setCustomDecks);
        unsubRoleplays = firebaseClient.observeCustomRoleplays(authUser.uid, setCustomRoleplays);
        unsubTeams = firebaseClient.observeTeams((cloudTeams) => {
          if (cloudTeams.length > 0) setTeams(cloudTeams);
        });
        unsubScores = firebaseClient.observeGlobalScores(setGlobalScores);
      } else {
        setIsOfflineMode(true);
        setProfile(offlineStore.getProfile());
        setSessions(offlineStore.getSessions());
        setWeeklyProgress(offlineStore.getAllWeeklyProgress());
        setCustomQuizzes(offlineStore.getCustomQuizzes());
        setCustomDecks(offlineStore.getCustomDecks());
        setCustomRoleplays(offlineStore.getCustomRoleplays());
        setTeams(offlineStore.getLocalTeams());
        setGlobalScores(offlineStore.getLocalLeaderboard());
      }
    });

    return () => {
      cleanupCloudSubs();
      unsubAuth();
    };
  }, []);

  // Cross-tab BroadcastChannel & Storage listener for local rooms, squads, buzzer, & active arcade rooms
  useEffect(() => {
    const syncLocalRoomsAndSquads = () => {
      const snap = nearbySync.getSnapshot();
      setActiveArcadeRooms(Object.values(snap.arcadeRooms));
      if (snap.squads.length > 0 && isOfflineMode) {
        setTeams((prev) => {
          const map = new Map(prev.map((t) => [t.id, t]));
          snap.squads.forEach((sq) => map.set(sq.id, sq));
          return Array.from(map.values());
        });
      }
      if (snap.buzzer) {
        setTeamBuzzer((prev) => {
          if (!prev.open && prev.contextKey !== snap.buzzer?.contextKey) return prev;
          return {
            ...prev,
            activeBuzz:
              snap.buzzer && snap.buzzer.lockUntilMs > Date.now()
                ? {
                    teamId: snap.buzzer.teamId,
                    teamName: snap.buzzer.teamName,
                    playerUid: snap.buzzer.playerUid,
                    playerName: snap.buzzer.playerName,
                    avatarColor: snap.buzzer.avatarColor,
                    lockUntilMs: snap.buzzer.lockUntilMs,
                  }
                : null,
          };
        });
      } else {
        setTeamBuzzer((prev) => (prev.activeBuzz ? { ...prev, activeBuzz: null } : prev));
      }

      setRoomSession((prev) => {
        if (!prev || prev.mode !== 'LOCAL') return prev;
        const localRoom = snap.rooms[prev.roomCode];
        if (!localRoom) {
          toast('Host closed the local quiz room.', 'info');
          delete prevPlayersByRoomRef.current[prev.roomCode];
          return null;
        }
        const nextPlayers = Object.values(localRoom.players || {}).sort(
          (a, b) => (b.score || 0) - (a.score || 0)
        );
        const prevPlayers = prevPlayersByRoomRef.current[prev.roomCode] || [];
        const departed = detectDepartedPlayers(
          prevPlayers,
          nextPlayers,
          prev.isHost,
          localRoom.hostUid
        );
        prevPlayersByRoomRef.current[prev.roomCode] = nextPlayers;
        if (departed.length > 0) {
          pushHostDepartures(departed, prev.roomCode);
        }
        return {
          ...prev,
          room: localRoom,
          players: nextPlayers,
          roomMessages: (localRoom.messages || []).filter((m) => !isSystemControlMessage(m.text)),
        };
      });
    };

    const unsub = nearbySync.subscribe((ev) => {
      if (ev.type === 'SQUAD_MESSAGE' && ev.message) {
        const msg = ev.message;
        if (!isSystemControlMessage(msg.text)) {
          offlineStore.addLocalMessage(msg.teamId, msg);
          setMessagesByTeam((prev) => {
            const list = prev[msg.teamId] || offlineStore.getLocalMessages(msg.teamId);
            if (list.some((m) => m.id === msg.id)) return prev;
            return { ...prev, [msg.teamId]: [...list, msg].slice(-120) };
          });
        }
      }
      if (ev.type === 'TEAM_BUZZER' && ev.buzz && ev.fromTab !== nearbySync.tabId) {
        sfx.playBuzzer();
      }
      syncLocalRoomsAndSquads();
    });

    return unsub;
  }, [isOfflineMode, pushHostDepartures, sfx, toast]);

  // Observe active team messages
  useEffect(() => {
    if (!activeTeamId) return;
    if (isOfflineMode) {
      const localMsgs = offlineStore
        .getLocalMessages(activeTeamId)
        .filter((m) => !isSystemControlMessage(m.text));
      setMessagesByTeam((prev) => ({ ...prev, [activeTeamId]: localMsgs }));
      return;
    }
    const unsub = firebaseClient.observeTeamMessages(activeTeamId, (msgs) => {
      setMessagesByTeam((prev) => ({
        ...prev,
        [activeTeamId]: msgs.filter((m) => !isSystemControlMessage(m.text)),
      }));
    });
    return unsub;
  }, [activeTeamId, isOfflineMode]);

  // Observe Cloud quiz room snapshots when roomSession.mode === 'CLOUD'
  const cloudRoomCode = roomSession?.mode === 'CLOUD' ? roomSession.roomCode : null;
  const cloudHostUid = roomSession?.mode === 'CLOUD' ? roomSession.room?.hostUid : null;
  const cloudIsHost = Boolean(roomSession?.isHost);

  useEffect(() => {
    if (!cloudRoomCode) return;
    const unsubRoom = firebaseClient.observeRoom(cloudRoomCode, (room) => {
      if (!room) {
        toast('Host closed the quiz room.', 'info');
        delete prevPlayersByRoomRef.current[cloudRoomCode];
        setRoomSession(null);
        return;
      }
      setRoomSession((prev) => (prev && prev.roomCode === cloudRoomCode ? { ...prev, room } : prev));
    });

    const unsubMsgs = firebaseClient.observeRoomMessages(cloudRoomCode, (msgs) => {
      setRoomSession((prev) =>
        prev && prev.roomCode === cloudRoomCode
          ? { ...prev, roomMessages: msgs.filter((m) => !isSystemControlMessage(m.text)) }
          : prev
      );
    });

    let unsubPlayers: (() => void) | undefined;
    if (cloudHostUid) {
      unsubPlayers = firebaseClient.observeRoomPlayers(cloudRoomCode, cloudHostUid, (players) => {
        const prevPlayers = prevPlayersByRoomRef.current[cloudRoomCode] || [];
        const departed = detectDepartedPlayers(prevPlayers, players, cloudIsHost, cloudHostUid);
        prevPlayersByRoomRef.current[cloudRoomCode] = players;
        if (departed.length > 0) {
          pushHostDepartures(departed, cloudRoomCode);
        }
        setRoomSession((prev) =>
          prev && prev.roomCode === cloudRoomCode ? { ...prev, players } : prev
        );
      });
    }

    return () => {
      unsubRoom();
      unsubMsgs();
      unsubPlayers?.();
    };
  }, [cloudRoomCode, cloudHostUid, cloudIsHost, pushHostDepartures, toast]);

  const setActiveTeamId = useCallback((teamId: string) => {
    setActiveTeamIdState(teamId);
    offlineStore.setActiveTeamId(teamId);
  }, []);

  const recordStickerUsed = useCallback((stickerId: string) => {
    const updated = offlineStore.pushRecentSticker(stickerId);
    setRecentStickers(updated);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await firebaseClient.signInWithGoogle();
    toast('Signed in with Google!', 'info');
    navigate('home');
  }, [navigate, toast]);

  const enterOfflineMode = useCallback(
    (name?: string) => {
      const cleanName = (name || '').trim().slice(0, 40) || profile.displayName || 'Offline Explorer';
      const next = { ...offlineStore.getProfile(cleanName), displayName: cleanName };
      offlineStore.saveProfile(next);
      setProfile(next);
      setIsOfflineMode(true);
      toast(`Welcome, ${cleanName}! Offline Club ready.`, 'info');
      navigate('home');
    },
    [navigate, profile.displayName, toast]
  );

  const signOut = useCallback(async () => {
    if (!isOfflineMode) {
      await firebaseClient.signOut();
    }
    setIsOfflineMode(true);
    setRoomSession(null);
    toast('Signed out cleanly.', 'info');
    navigate('auth');
  }, [isOfflineMode, navigate, toast]);

  const updateDisplayName = useCallback(
    (name: string) => {
      const clean = name.trim().slice(0, 40) || 'Offline Explorer';
      setProfile((prev) => {
        const next = { ...prev, displayName: clean };
        if (isOfflineMode) offlineStore.saveProfile(next);
        return next;
      });
      toast(`Display name updated to ${clean}`, 'info');
    },
    [isOfflineMode, toast]
  );

  const setLearningLevel = useCallback(
    async (level: CefrLevel | string) => {
      if (isOfflineMode) {
        const next = { ...profile, learningLevel: level };
        offlineStore.saveProfile(next);
        setProfile(next);
      } else {
        setProfile((prev) => ({ ...prev, learningLevel: level }));
        await firebaseClient.updateLearningLevel(level);
      }
      toast(`Active CEFR Level switched to ${level}`, 'info');
    },
    [isOfflineMode, profile, toast]
  );

  const awardActivity = useCallback<AppContextValue['awardActivity']>(
    async ({
      activityType,
      title,
      cefrLevel,
      score = 0,
      xpDelta = 0,
      accuracyPct = 100,
      wordsPracticed = 0,
      durationMinutes = 2,
      quizzesHostedDelta = 0,
      quizzesPlayedDelta = 0,
      cardsMasteredDelta = 0,
      sessionsCompletedDelta = 0,
      audiobooksFinishedDelta = 0,
      weeklyWordsMasteredDelta = 0,
      bestLiveQuizScoreCandidate = 0,
      roleplayCompleted = false,
      arcadePlayed = false,
      highCombo = 0,
      publishLeaderboard = false,
      gameMode = 'LIVE_QUIZ',
      teamId = '',
      teamName = '',
    }) => {
      const resolvedTeamId = teamId || profile.teamId || '';
      const resolvedTeamName = teamName || profile.teamName || '';

      const nextCounts = {
        sessionsCompleted: profile.sessionsCompleted + sessionsCompletedDelta,
        weeklyWordsMastered: profile.weeklyWordsMastered + weeklyWordsMasteredDelta,
        quizzesPlayed: profile.quizzesPlayed + quizzesPlayedDelta,
        quizzesHosted: profile.quizzesHosted + quizzesHostedDelta,
        bestLiveQuizScore: Math.max(profile.bestLiveQuizScore, bestLiveQuizScoreCandidate),
        latestQuizAccuracyPct: accuracyPct,
        audiobooksFinished: profile.audiobooksFinished + audiobooksFinishedDelta,
        roleplayCompleted: roleplayCompleted || activityType === ActivityType.ROLEPLAY,
        arcadePlayed: arcadePlayed || activityType === ActivityType.GAME,
        highCombo,
      };

      const unlocked = BadgeEngine.computeNewBadges({
        existingIds: profile.earnedBadges,
        ...nextCounts,
      });
      const newBadgeIds = unlocked.map((b) => b.id);

      const sessionEntry: SessionRecord = {
        id: `sess_${Date.now()}`,
        activityType,
        title,
        cefrLevel,
        score,
        accuracyPct,
        wordsPracticed,
        durationMinutes,
        createdAtMs: Date.now(),
      };

      if (resolvedTeamId && score > 0) {
        const contrib: TeamContribution = {
          teamId: resolvedTeamId,
          teamName: resolvedTeamName || resolvedTeamId,
          playerName: profile.displayName,
          avatarColor: 'INDIGO',
          points: score,
          title,
          gameMode,
          cefrLevel: String(cefrLevel),
          accuracyPct,
          createdAtMs: Date.now(),
        };
        const updatedContribs = offlineStore.addTeamContribution(contrib);
        setTeamContributions(updatedContribs);
      }

      if (isOfflineMode) {
        const nextProfile: UserProfile = {
          ...profile,
          xp: profile.xp + xpDelta,
          quizzesHosted: nextCounts.quizzesHosted,
          quizzesPlayed: nextCounts.quizzesPlayed,
          cardsMastered: Math.max(0, profile.cardsMastered + cardsMasteredDelta),
          sessionsCompleted: nextCounts.sessionsCompleted,
          audiobooksFinished: nextCounts.audiobooksFinished,
          weeklyWordsMastered: Math.max(0, nextCounts.weeklyWordsMastered),
          bestLiveQuizScore: nextCounts.bestLiveQuizScore,
          earnedBadges: [...profile.earnedBadges, ...newBadgeIds],
          lastActiveEpochDay: epochDayNow(),
        };
        offlineStore.saveProfile(nextProfile);
        setProfile(nextProfile);
        setSessions(offlineStore.saveSession(sessionEntry));
        if (publishLeaderboard && score > 0) {
          setGlobalScores(
            offlineStore.addLocalLeaderboardScore({
              id: `sc_${Date.now()}`,
              userId: currentUid,
              playerName: profile.displayName,
              avatarColor: 'INDIGO',
              teamId: resolvedTeamId,
              teamName: resolvedTeamName,
              quizTitle: title,
              cefrLevel: String(cefrLevel),
              score,
              accuracyPct,
              streak: profile.streak,
              gameMode,
              createdAtMs: Date.now(),
            })
          );
        }
      } else {
        await firebaseClient.awardProgress({
          xpDelta,
          quizzesHostedDelta,
          quizzesPlayedDelta,
          cardsMasteredDelta,
          sessionsCompletedDelta,
          audiobooksFinishedDelta,
          weeklyWordsMasteredDelta,
          bestLiveQuizScoreCandidate,
          newEarnedBadgeIds: newBadgeIds,
        });
        await firebaseClient.logSessionRecord(sessionEntry);
        if (publishLeaderboard && score > 0) {
          await firebaseClient.publishScoreRecord({
            quizTitle: title,
            cefrLevel,
            score,
            accuracyPct,
            streak: profile.streak,
            gameMode,
            teamId: resolvedTeamId,
            teamName: resolvedTeamName,
          });
        }
      }

      if (unlocked.length > 0) {
        sfx.playBadgeUnlock();
        triggerConfetti();
        unlocked.forEach((b) => toast(`Badge Unlocked: ${b.icon} ${b.title}!`, 'badge'));
      }
    },
    [currentUid, isOfflineMode, profile, sfx, toast, triggerConfetti]
  );

  const togglePinEvidence = useCallback(
    async (cardId: string) => {
      const pinned = !profile.pinnedEvidenceIds.includes(cardId);
      const nextIds = pinned
        ? [...profile.pinnedEvidenceIds, cardId]
        : profile.pinnedEvidenceIds.filter((id) => id !== cardId);
      setProfile((prev) => {
        const next = { ...prev, pinnedEvidenceIds: nextIds };
        if (isOfflineMode) offlineStore.saveProfile(next);
        return next;
      });
      if (!isOfflineMode) {
        await firebaseClient.togglePinEvidence(cardId, pinned);
      }
      sfx.playClick();
    },
    [isOfflineMode, profile.pinnedEvidenceIds, sfx]
  );

  const toggleWeeklyWordMastered = useCallback(
    async (weekNumber: number, wordId: string) => {
      const cur = weeklyProgress[String(weekNumber)] || {
        weekNumber,
        masteredWordIds: [],
        completedSessions: [],
        gamesPlayed: 0,
      };
      const exists = cur.masteredWordIds.includes(wordId);
      const nextIds = exists
        ? cur.masteredWordIds.filter((id) => id !== wordId)
        : [...cur.masteredWordIds, wordId];
      const nextRec: WeeklyProgressRecord = { ...cur, masteredWordIds: nextIds };
      setWeeklyProgress((prev) => ({ ...prev, [String(weekNumber)]: nextRec }));
      if (isOfflineMode) {
        offlineStore.saveWeeklyProgress(weekNumber, nextRec);
        const totalMastered = Object.values({
          ...weeklyProgress,
          [String(weekNumber)]: nextRec,
        }).reduce((sum, w) => sum + w.masteredWordIds.length, 0);
        const nextProf = { ...profile, weeklyWordsMastered: totalMastered };
        offlineStore.saveProfile(nextProf);
        setProfile(nextProf);
      } else {
        await firebaseClient.updateWeeklyWordMastery(weekNumber, nextIds);
        await firebaseClient.awardProgress({ weeklyWordsMasteredDelta: exists ? -1 : 1 });
      }
      sfx.playClick();
    },
    [isOfflineMode, profile, sfx, weeklyProgress]
  );

  const completeWeeklySession = useCallback(
    async (weekNumber: number, sessionNumber: number, wordIds: string[]) => {
      const cur = weeklyProgress[String(weekNumber)] || {
        weekNumber,
        masteredWordIds: [],
        completedSessions: [],
        gamesPlayed: 0,
      };
      const mergedWords = [...new Set([...cur.masteredWordIds, ...wordIds])];
      const mergedSessions = [...new Set([...cur.completedSessions, sessionNumber])].sort((a, b) => a - b);
      const newlyCompleted = !cur.completedSessions.includes(sessionNumber);
      const nextRec: WeeklyProgressRecord = {
        ...cur,
        masteredWordIds: mergedWords,
        completedSessions: mergedSessions,
      };
      setWeeklyProgress((prev) => ({ ...prev, [String(weekNumber)]: nextRec }));
      if (isOfflineMode) {
        offlineStore.saveWeeklyProgress(weekNumber, nextRec);
      } else {
        await firebaseClient.updateWeeklyWordMastery(weekNumber, mergedWords);
        await firebaseClient.markWeeklySessionComplete(weekNumber, sessionNumber, false);
      }
      await awardActivity({
        activityType: ActivityType.WEEKLY_SESSION,
        title: `Week ${weekNumber} · Session ${sessionNumber}`,
        cefrLevel: profile.learningLevel,
        score: 120,
        xpDelta: 80,
        wordsPracticed: wordIds.length,
        sessionsCompletedDelta: newlyCompleted ? 1 : 0,
      });
      sfx.playSuccess();
      triggerConfetti();
      toast(`Session ${sessionNumber} completed! +80 XP`, 'info');
    },
    [awardActivity, isOfflineMode, profile.learningLevel, sfx, toast, triggerConfetti, weeklyProgress]
  );

  const recordWeeklyGamePlayed = useCallback(
    async (weekNumber: number) => {
      const cur = weeklyProgress[String(weekNumber)] || {
        weekNumber,
        masteredWordIds: [],
        completedSessions: [],
        gamesPlayed: 0,
      };
      const nextRec = { ...cur, gamesPlayed: cur.gamesPlayed + 1 };
      setWeeklyProgress((prev) => ({ ...prev, [String(weekNumber)]: nextRec }));
      if (isOfflineMode) {
        offlineStore.saveWeeklyProgress(weekNumber, nextRec);
      } else {
        await firebaseClient.recordWeeklyGamePlayed(weekNumber);
      }
    },
    [isOfflineMode, weeklyProgress]
  );

  const saveCustomQuiz = useCallback(
    async (quiz: Omit<QuizPack, 'id'>) => {
      if (isOfflineMode) {
        const entry: QuizPack = { ...quiz, id: `cquiz_${Date.now()}`, createdAtMs: Date.now() };
        setCustomQuizzes(offlineStore.saveCustomQuiz(entry));
      } else {
        await firebaseClient.saveCustomQuiz(quiz);
      }
      toast('Saved quiz to your library!', 'info');
    },
    [isOfflineMode, toast]
  );

  const deleteCustomQuiz = useCallback(
    async (quizId: string) => {
      if (isOfflineMode) {
        setCustomQuizzes(offlineStore.deleteCustomQuiz(quizId));
      } else {
        await firebaseClient.deleteCustomQuiz(quizId);
      }
      toast('Deleted quiz.', 'info');
    },
    [isOfflineMode, toast]
  );

  const saveCustomDeck = useCallback(
    async (deck: Omit<FlashcardDeck, 'id'>) => {
      if (isOfflineMode) {
        const entry: FlashcardDeck = { ...deck, id: `deck_${Date.now()}`, createdAtMs: Date.now() };
        setCustomDecks(offlineStore.saveCustomDeck(entry));
      } else {
        await firebaseClient.saveCustomDeck(deck);
      }
      toast('Deck saved!', 'info');
    },
    [isOfflineMode, toast]
  );

  const updateCustomDeck = useCallback(
    async (deckId: string, deck: Omit<FlashcardDeck, 'id'>) => {
      if (isOfflineMode) {
        setCustomDecks(offlineStore.saveCustomDeck({ ...deck, id: deckId, createdAtMs: Date.now() }));
      } else {
        await firebaseClient.updateCustomDeck(deckId, deck);
      }
      toast('Deck updated!', 'info');
    },
    [isOfflineMode, toast]
  );

  const deleteCustomDeck = useCallback(
    async (deckId: string) => {
      if (isOfflineMode) {
        setCustomDecks(offlineStore.deleteCustomDeck(deckId));
      } else {
        await firebaseClient.deleteCustomDeck(deckId);
      }
      toast('Deck removed.', 'info');
    },
    [isOfflineMode, toast]
  );

  const saveCustomRoleplay = useCallback(
    async (rp: Omit<RoleplayScenario, 'id'>) => {
      if (isOfflineMode) {
        const entry: RoleplayScenario = { ...rp, id: `rp_${Date.now()}`, createdAtMs: Date.now() };
        setCustomRoleplays(offlineStore.saveCustomRoleplay(entry));
      } else {
        await firebaseClient.saveCustomRoleplay(rp);
      }
      toast('Roleplay saved!', 'info');
    },
    [isOfflineMode, toast]
  );

  const deleteCustomRoleplay = useCallback(
    async (id: string) => {
      if (isOfflineMode) {
        const next = customRoleplays.filter((r) => r.id !== id);
        localStorage.setItem('lingoclub_v1_custom_roleplays', JSON.stringify(next));
        setCustomRoleplays(next);
      } else {
        await firebaseClient.deleteCustomRoleplay(id);
      }
      toast('Roleplay removed.', 'info');
    },
    [customRoleplays, isOfflineMode, toast]
  );

  const createTeam = useCallback(
    async ({ name, cefrLevel, motto, accentColor }: { name: string; cefrLevel: string; motto: string; accentColor: string }) => {
      if (isOfflineMode) {
        const id = `team_${Date.now()}`;
        const created: Team = {
          id,
          visibility: 'CLUB',
          name: name.trim().slice(0, 50),
          cefrLevel,
          motto: motto.trim().slice(0, 120),
          accentColor,
          leaderUid: currentUid,
          leaderName: profile.displayName,
          channelKind: 'TEAM',
          memberCount: 1,
          createdAtMs: Date.now(),
        };
        const nextTeams = offlineStore.saveLocalTeams([created, ...teams]);
        setTeams(nextTeams);
        const nextProf = { ...profile, teamId: id, teamName: created.name };
        offlineStore.saveProfile(nextProf);
        setProfile(nextProf);
        setActiveTeamId(id);
        toast(`Created ${created.name}!`, 'info');
      } else {
        const newId = await firebaseClient.createTeam({
          name,
          cefrLevel,
          motto,
          accentColor,
          creatorName: profile.displayName,
        });
        setActiveTeamId(newId);
        toast(`Created ${name}!`, 'info');
      }
    },
    [currentUid, isOfflineMode, profile, setActiveTeamId, teams, toast]
  );

  const joinTeam = useCallback(
    async (team: Team) => {
      if (isOfflineMode) {
        const nextTeams = teams.map((t) =>
          t.id === team.id
            ? { ...t, memberCount: (t.memberCount || 0) + 1 }
            : t.id === profile.teamId
            ? { ...t, memberCount: Math.max(0, (t.memberCount || 1) - 1) }
            : t
        );
        offlineStore.saveLocalTeams(nextTeams);
        setTeams(nextTeams);
        const nextProf = { ...profile, teamId: team.id, teamName: team.name };
        offlineStore.saveProfile(nextProf);
        setProfile(nextProf);
      } else {
        await firebaseClient.joinTeam(team, profile.teamId);
      }
      setActiveTeamId(team.id);
      sfx.playSuccess();
      toast(`Joined ${team.name}!`, 'info');
    },
    [isOfflineMode, profile, setActiveTeamId, sfx, teams, toast]
  );

  const leaveTeam = useCallback(async () => {
    if (!profile.teamId) return;
    if (isOfflineMode) {
      const nextTeams = teams.map((t) =>
        t.id === profile.teamId ? { ...t, memberCount: Math.max(0, (t.memberCount || 1) - 1) } : t
      );
      offlineStore.saveLocalTeams(nextTeams);
      setTeams(nextTeams);
      const nextProf = { ...profile, teamId: '', teamName: '' };
      offlineStore.saveProfile(nextProf);
      setProfile(nextProf);
    } else {
      await firebaseClient.leaveTeam(profile.teamId);
    }
    toast('Left current squad.', 'info');
  }, [isOfflineMode, profile, teams, toast]);

  const sendTeamMessage = useCallback(
    async (teamId: string, text: string, pinned = false) => {
      const clean = text.trim();
      if (!clean) return;
      if (isOfflineMode) {
        const msg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          teamId,
          senderUid: currentUid,
          senderName: profile.displayName,
          senderTeamName: profile.teamName || '',
          senderRole: 'PLAYER',
          text: clean,
          pinned,
          createdAtMs: Date.now(),
        };
        const updated = offlineStore.addLocalMessage(teamId, msg);
        setMessagesByTeam((prev) => ({ ...prev, [teamId]: updated }));
        nearbySync.sendSquadMessage(msg);
      } else {
        await firebaseClient.sendTeamMessage({
          teamId,
          senderName: profile.displayName,
          senderTeamName: profile.teamName || '',
          text: clean,
          pinned,
        });
      }
    },
    [currentUid, isOfflineMode, profile.displayName, profile.teamName]
  );

  const toggleTeamMessagePin = useCallback(
    async (teamId: string, messageId: string, pinned: boolean) => {
      if (isOfflineMode) {
        const updated = offlineStore
          .getLocalMessages(teamId)
          .map((m) => (m.id === messageId ? { ...m, pinned } : m))
          .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.createdAtMs - b.createdAtMs);
        const all = JSON.parse(localStorage.getItem('lingoclub_v1_team_messages') || '{}');
        all[teamId] = updated;
        localStorage.setItem('lingoclub_v1_team_messages', JSON.stringify(all));
        setMessagesByTeam((prev) => ({ ...prev, [teamId]: updated }));
      } else {
        await firebaseClient.toggleMessagePin(teamId, messageId, pinned);
      }
    },
    [isOfflineMode]
  );

  const deleteTeamMessage = useCallback(
    async (teamId: string, messageId: string) => {
      if (isOfflineMode) {
        const updated = offlineStore.getLocalMessages(teamId).filter((m) => m.id !== messageId);
        const all = JSON.parse(localStorage.getItem('lingoclub_v1_team_messages') || '{}');
        all[teamId] = updated;
        localStorage.setItem('lingoclub_v1_team_messages', JSON.stringify(all));
        setMessagesByTeam((prev) => ({ ...prev, [teamId]: updated }));
      } else {
        await firebaseClient.deleteTeamMessage(teamId, messageId);
      }
    },
    [isOfflineMode]
  );

  const hostLocalSquad = useCallback(
    (team: Team) => {
      nearbySync.hostSquad({ team, hostName: profile.displayName });
      setHostedSquad(team);
      toast(`Hosting "${team.name}" on local nearby radar.`, 'info');
    },
    [profile.displayName, toast]
  );

  const stopHostingLocalSquad = useCallback(() => {
    nearbySync.stopHostingSquad();
    setHostedSquad(null);
    toast('Stopped hosting local squad.', 'info');
  }, [toast]);

  // Live Quiz Rooms
  const hostRoom = useCallback<AppContextValue['hostRoom']>(
    async ({ mode, quizTitle, cefrLevel, questions }) => {
      const effectiveMode = mode === 'CLOUD' && !isOfflineMode ? 'CLOUD' : 'LOCAL';
      if (effectiveMode === 'CLOUD') {
        const code = await firebaseClient.createQuizRoom({
          hostName: profile.displayName,
          quizTitle,
          cefrLevel,
          questions,
        });
        prevPlayersByRoomRef.current[code] = [];
        setRoomSession({
          mode: 'CLOUD',
          roomCode: code,
          isHost: true,
          nickname: profile.displayName,
          avatarColor: 'INDIGO',
          room: {
            roomCode: code,
            hostUid: currentUid,
            hostName: profile.displayName,
            quizTitle,
            cefrLevel,
            status: RoomStatus.LOBBY,
            currentQuestionIndex: 0,
            questionStartedAtMs: 0,
            questions,
            leaderboard: [],
          },
          players: [],
          roomMessages: [],
          answeredQuestionIndex: -1,
          selectedOptionIndex: null,
        });
        void awardActivity({
          activityType: ActivityType.QUIZ,
          title: `Hosted: ${quizTitle}`,
          cefrLevel,
          xpDelta: 30,
          quizzesHostedDelta: 1,
        });
        return code;
      }

      const created = nearbySync.createLocalQuizRoom({
        hostUid: currentUid,
        hostName: profile.displayName,
        quizTitle,
        cefrLevel,
        questions,
      });
      prevPlayersByRoomRef.current[created.roomCode] = [];
      setRoomSession({
        mode: 'LOCAL',
        roomCode: created.roomCode,
        isHost: true,
        nickname: profile.displayName,
        avatarColor: 'INDIGO',
        room: created,
        players: [],
        roomMessages: [],
        answeredQuestionIndex: -1,
        selectedOptionIndex: null,
      });
      void awardActivity({
        activityType: ActivityType.QUIZ,
        title: `Hosted: ${quizTitle}`,
        cefrLevel,
        xpDelta: 30,
        quizzesHostedDelta: 1,
      });
      return created.roomCode;
    },
    [awardActivity, currentUid, isOfflineMode, profile.displayName]
  );

  const joinRoomByPin = useCallback<AppContextValue['joinRoomByPin']>(
    async ({ roomCode, nickname, avatarColor, preferredMode = 'AUTO' }) => {
      const clean = roomCode.trim().toUpperCase();
      const nick = nickname.trim().slice(0, 24) || profile.displayName || 'Friend';

      const tryLocal = () => {
        const local = nearbySync.joinLocalQuizRoom({
          roomCode: clean,
          playerUid: currentUid,
          nickname: nick,
          avatarColor,
          teamId: profile.teamId,
          teamName: profile.teamName,
        });
        const players = Object.values(local.players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
        prevPlayersByRoomRef.current[clean] = players;
        setRoomSession({
          mode: 'LOCAL',
          roomCode: clean,
          isHost: local.hostUid === currentUid,
          nickname: nick,
          avatarColor,
          room: local,
          players,
          roomMessages: (local.messages || []).filter((m) => !isSystemControlMessage(m.text)),
          answeredQuestionIndex: -1,
          selectedOptionIndex: null,
        });
      };

      if (preferredMode === 'LOCAL' || isOfflineMode) {
        tryLocal();
        return;
      }

      const localCheck = nearbySync.getLocalQuizRoom(clean);
      if (preferredMode === 'AUTO' && localCheck) {
        tryLocal();
        return;
      }

      const room = await firebaseClient.joinRoom({
        roomCode: clean,
        nickname: nick,
        avatarColor,
        teamId: profile.teamId,
        teamName: profile.teamName,
      });
      prevPlayersByRoomRef.current[clean] = [];
      setRoomSession({
        mode: 'CLOUD',
        roomCode: clean,
        isHost: room.hostUid === currentUid,
        nickname: nick,
        avatarColor,
        room,
        players: [],
        roomMessages: [],
        answeredQuestionIndex: -1,
        selectedOptionIndex: null,
      });
    },
    [currentUid, isOfflineMode, profile.displayName, profile.teamId, profile.teamName]
  );

  const leaveRoom = useCallback(async () => {
    if (!roomSession) return;
    const { mode, roomCode, isHost } = roomSession;
    delete prevPlayersByRoomRef.current[roomCode];
    if (mode === 'LOCAL') {
      if (isHost) nearbySync.closeLocalQuizRoom(roomCode);
      else nearbySync.leaveLocalQuizRoom({ roomCode, playerUid: currentUid });
    } else {
      if (isHost) await firebaseClient.deleteQuizRoom(roomCode);
      else await firebaseClient.leaveRoomPlayer({ roomCode });
    }
    setRoomSession(null);
    setHostAlerts((prev) => prev.filter((a) => a.roomCode !== roomCode));
  }, [currentUid, roomSession]);

  const advanceRoomPhase = useCallback(
    async (newStatus: RoomStatus | string, nextQuestionIndex?: number) => {
      if (!roomSession?.room) return;
      const idx = nextQuestionIndex ?? roomSession.room.currentQuestionIndex;
      const startedAt = newStatus === RoomStatus.QUESTION ? Date.now() : roomSession.room.questionStartedAtMs;
      const leaderboard = buildRoomLeaderboardEntries(roomSession.players);

      if (newStatus === RoomStatus.REVEAL) sfx.playReveal();
      else if (newStatus === RoomStatus.PODIUM) {
        sfx.playFanfare();
        triggerConfetti();
      } else {
        sfx.playClick();
      }

      if (roomSession.mode === 'LOCAL') {
        nearbySync.advanceLocalRoomPhase({
          roomCode: roomSession.roomCode,
          newStatus,
          questionIndex: idx,
          questionStartedAtMs: startedAt,
          leaderboard,
        });
      } else {
        await firebaseClient.advanceRoomPhase({
          roomCode: roomSession.roomCode,
          newStatus,
          questionIndex: idx,
          questionStartedAtMs: startedAt,
          leaderboard,
        });
      }

      setRoomSession((prev) =>
        prev && prev.room
          ? {
              ...prev,
              room: {
                ...prev.room,
                status: newStatus,
                currentQuestionIndex: idx,
                questionStartedAtMs: startedAt,
                leaderboard,
              },
              answeredQuestionIndex:
                newStatus === RoomStatus.QUESTION && idx !== prev.room.currentQuestionIndex
                  ? -1
                  : prev.answeredQuestionIndex,
              selectedOptionIndex:
                newStatus === RoomStatus.QUESTION && idx !== prev.room.currentQuestionIndex
                  ? null
                  : prev.selectedOptionIndex,
            }
          : prev
      );
    },
    [roomSession, sfx, triggerConfetti]
  );

  const submitRoomAnswer = useCallback(
    async (selectedIndex: number, isCorrect: boolean, pointsEarned: number, newStreak: number) => {
      if (!roomSession?.room) return;
      const qIdx = roomSession.room.currentQuestionIndex;
      if (roomSession.answeredQuestionIndex === qIdx) return;

      const me = roomSession.players.find((p) => (p.playerUid || p.uid) === currentUid);
      const nextScore = Number(me?.score || 0) + pointsEarned;

      if (isCorrect) sfx.playSuccess();
      else sfx.playError();

      setRoomSession((prev) =>
        prev
          ? {
              ...prev,
              answeredQuestionIndex: qIdx,
              selectedOptionIndex: selectedIndex,
            }
          : prev
      );

      if (roomSession.mode === 'LOCAL') {
        nearbySync.submitLocalRoomAnswer({
          roomCode: roomSession.roomCode,
          playerUid: currentUid,
          questionIndex: qIdx,
          selectedIndex,
          correct: isCorrect,
          pointsEarned,
          newScore: nextScore,
          newStreak,
        });
      } else {
        await firebaseClient.submitRoomAnswer({
          roomCode: roomSession.roomCode,
          questionIndex: qIdx,
          selectedIndex,
          correct: isCorrect,
          pointsEarned,
          newScore: nextScore,
          newStreak,
        });
      }
    },
    [currentUid, roomSession, sfx]
  );

  const sendRoomChatMessage = useCallback(
    async (text: string, messageType: 'TEXT' | 'REACTION' = 'TEXT') => {
      if (!roomSession) return;
      const clean = text.trim();
      if (!clean) return;
      if (roomSession.mode === 'LOCAL') {
        nearbySync.sendLocalRoomMessage({
          roomCode: roomSession.roomCode,
          senderUid: currentUid,
          senderName: roomSession.nickname || profile.displayName,
          avatarColor: roomSession.avatarColor || 'INDIGO',
          hostSender: roomSession.isHost,
          messageType,
          text: clean,
        });
      } else {
        await firebaseClient.sendRoomMessage({
          roomCode: roomSession.roomCode,
          senderName: roomSession.nickname || profile.displayName,
          avatarColor: roomSession.avatarColor || 'INDIGO',
          hostSender: roomSession.isHost,
          messageType,
          text: clean,
        });
      }
    },
    [currentUid, profile.displayName, roomSession]
  );

  const deleteRoomChatMessage = useCallback(
    async (messageId: string) => {
      if (!roomSession) return;
      if (roomSession.mode === 'LOCAL') {
        setRoomSession((prev) =>
          prev
            ? { ...prev, roomMessages: prev.roomMessages.filter((m) => m.id !== messageId) }
            : prev
        );
      } else {
        await firebaseClient.deleteRoomMessage(roomSession.roomCode, messageId);
      }
    },
    [roomSession]
  );

  // Team Buzzer Controls
  const openTeamBuzzer = useCallback<AppContextValue['openTeamBuzzer']>(
    ({ contextKey, title, prompt, teams: customTeams, sessionScores }) => {
      const buzzerTeams =
        customTeams && customTeams.length > 0
          ? customTeams
          : DEFAULT_BATTLE_TEAMS.map((t) => ({
              id: t.id,
              name: t.name,
              cefrLevel: CefrLevel.B1,
              motto: t.motto,
              accentColor: t.accentColor,
              leaderUid: 'club',
              leaderName: 'Squad Lead',
              channelKind: 'TEAM',
              memberCount: 4,
            }));

      setTeamBuzzer((prev) => ({
        ...prev,
        open: true,
        contextKey,
        title,
        prompt,
        teams: buzzerTeams,
        sessionScores: sessionScores ?? prev.sessionScores,
      }));
      sfx.playClick();
    },
    [sfx]
  );

  const closeTeamBuzzer = useCallback(() => {
    setTeamBuzzer((prev) => ({ ...prev, open: false }));
  }, []);

  const triggerTeamBuzz = useCallback(
    (team: Team) => {
      if (teamBuzzer.activeBuzz && teamBuzzer.activeBuzz.lockUntilMs > Date.now()) {
        return;
      }
      const lockUntilMs = Date.now() + 5000;
      const packet = {
        contextKey: teamBuzzer.contextKey,
        title: teamBuzzer.title,
        prompt: teamBuzzer.prompt,
        teamId: team.id,
        teamName: team.name,
        playerUid: currentUid,
        playerName: profile.displayName,
        avatarColor: avatarColorForTag(team.accentColor),
        lockUntilMs,
      };
      nearbySync.sendBuzzerEvent(packet);
      sfx.playBuzzer();
      setTeamBuzzer((prev) => ({
        ...prev,
        activeBuzz: {
          teamId: packet.teamId,
          teamName: packet.teamName,
          playerUid: packet.playerUid,
          playerName: packet.playerName,
          avatarColor: packet.avatarColor,
          lockUntilMs,
        },
        buzzHistory: [
          {
            id: `bz_${Date.now()}`,
            teamId: team.id,
            teamName: team.name,
            playerName: profile.displayName,
            outcome: 'PENDING' as const,
            pointsDelta: 0,
            atMs: Date.now(),
          },
          ...prev.buzzHistory,
        ].slice(0, 12),
      }));
    },
    [currentUid, profile.displayName, sfx, teamBuzzer.activeBuzz, teamBuzzer.contextKey, teamBuzzer.prompt, teamBuzzer.title]
  );

  const resolveTeamBuzz = useCallback(
    (outcome: 'AWARDED' | 'WRONG', pointsDelta = 100) => {
      const active = teamBuzzer.activeBuzz;
      if (!active) return;
      if (outcome === 'AWARDED') {
        sfx.playSuccess();
        const updatedContribs = offlineStore.addTeamContribution({
          teamId: active.teamId,
          teamName: active.teamName,
          playerName: active.playerName,
          avatarColor: active.avatarColor,
          points: pointsDelta,
          title: `Buzzer: ${teamBuzzer.title}`,
          gameMode: 'TEAM_BUZZER',
          cefrLevel: String(profile.learningLevel),
          accuracyPct: 100,
          createdAtMs: Date.now(),
        });
        setTeamContributions(updatedContribs);
        toast(`+${pointsDelta} pts awarded to ${active.teamName}!`, 'info');
      } else {
        sfx.playError();
        toast(`${active.teamName} missed — buzzer unlocked!`, 'info');
      }

      nearbySync.clearBuzzerEvent(teamBuzzer.contextKey);
      setTeamBuzzer((prev) => {
        const nextScores = { ...prev.sessionScores };
        if (outcome === 'AWARDED') {
          nextScores[active.teamId] = (nextScores[active.teamId] || 0) + pointsDelta;
        }
        const nextHistory = prev.buzzHistory.map((item, idx) =>
          idx === 0 && item.outcome === 'PENDING'
            ? { ...item, outcome, pointsDelta: outcome === 'AWARDED' ? pointsDelta : 0 }
            : item
        );
        return {
          ...prev,
          activeBuzz: null,
          sessionScores: nextScores,
          buzzHistory: nextHistory,
        };
      });
    },
    [profile.learningLevel, sfx, teamBuzzer.activeBuzz, teamBuzzer.contextKey, teamBuzzer.title, toast]
  );

  const resetTeamBuzzLock = useCallback(() => {
    nearbySync.clearBuzzerEvent(teamBuzzer.contextKey);
    setTeamBuzzer((prev) => ({ ...prev, activeBuzz: null }));
    sfx.playClick();
  }, [sfx, teamBuzzer.contextKey]);

  const upsertArcadeRoomScore = useCallback<AppContextValue['upsertArcadeRoomScore']>(
    (params) => {
      nearbySync.upsertActiveArcadeRoom(params);
    },
    []
  );

  const removeArcadeRoomScore = useCallback((roomId: string) => {
    nearbySync.removeActiveArcadeRoom(roomId);
  }, []);

  // Global Team Leaderboard aggregation
  const globalTeamLeaderboard = useMemo<GlobalTeamEntry[]>(() => {
    const map = new Map<string, GlobalTeamEntry>();

    for (const team of teams) {
      if (team.channelKind === 'CLUB') continue;
      map.set(team.id, {
        id: team.id,
        name: team.name,
        motto: team.motto,
        accentColor: team.accentColor,
        memberCount: team.memberCount || 1,
        totalPoints: 0,
        livePoints: 0,
        basePoints: 0,
        gamesCount: 0,
        activeRoomsCount: 0,
        isMine: profile.teamId === team.id,
      });
    }

    for (const c of teamContributions) {
      const existing = map.get(c.teamId) || {
        id: c.teamId,
        name: c.teamName || c.teamId,
        motto: 'Active LingoClub squad',
        accentColor: 'INDIGO',
        memberCount: 1,
        totalPoints: 0,
        livePoints: 0,
        basePoints: 0,
        gamesCount: 0,
        activeRoomsCount: 0,
        isMine: profile.teamId === c.teamId,
      };
      existing.basePoints += Number(c.points || 0);
      existing.gamesCount += 1;
      map.set(c.teamId, existing);
    }

    for (const sc of globalScores) {
      if (!sc.teamId) continue;
      const existing = map.get(sc.teamId);
      if (existing) {
        existing.basePoints += Math.round(Number(sc.score || 0) * 0.2);
      }
    }

    for (const ar of activeArcadeRooms) {
      for (const [tid, pts] of Object.entries(ar.teamScores || {})) {
        const meta = ar.teamMeta?.[tid];
        const existing = map.get(tid) || {
          id: tid,
          name: meta?.name || tid,
          motto: meta?.motto || 'Live Arcade Battle',
          accentColor: meta?.accentColor || 'INDIGO',
          memberCount: 1,
          totalPoints: 0,
          livePoints: 0,
          basePoints: 0,
          gamesCount: 0,
          activeRoomsCount: 0,
          isMine: profile.teamId === tid,
        };
        existing.livePoints += Number(pts || 0);
        existing.activeRoomsCount += 1;
        map.set(tid, existing);
      }
    }

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        totalPoints: entry.basePoints + entry.livePoints,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints || b.memberCount - a.memberCount);
  }, [activeArcadeRooms, globalScores, profile.teamId, teamContributions, teams]);

  const value: AppContextValue = {
    route,
    autostart,
    navigate,
    theme,
    toggleTheme,
    sfx,
    authReady,
    user,
    isOfflineMode,
    currentUid,
    profile,
    sessions,
    weeklyProgress,
    customQuizzes,
    customDecks,
    customRoleplays,
    teams,
    activeTeamId,
    setActiveTeamId,
    messagesByTeam,
    globalScores,
    teamContributions,
    activeArcadeRooms,
    globalTeamLeaderboard,
    hostedSquad,
    roomSession,
    hostAlerts,
    dismissHostAlert,
    teamBuzzer,
    recentStickers,
    recordStickerUsed,
    toasts,
    toast,
    confettiVersion,
    triggerConfetti,
    signInWithGoogle,
    enterOfflineMode,
    signOut,
    updateDisplayName,
    setLearningLevel,
    awardActivity,
    togglePinEvidence,
    toggleWeeklyWordMastered,
    completeWeeklySession,
    recordWeeklyGamePlayed,
    saveCustomQuiz,
    deleteCustomQuiz,
    saveCustomDeck,
    updateCustomDeck,
    deleteCustomDeck,
    saveCustomRoleplay,
    deleteCustomRoleplay,
    createTeam,
    joinTeam,
    leaveTeam,
    sendTeamMessage,
    toggleTeamMessagePin,
    deleteTeamMessage,
    hostLocalSquad,
    stopHostingLocalSquad,
    hostRoom,
    joinRoomByPin,
    leaveRoom,
    advanceRoomPhase,
    submitRoomAnswer,
    sendRoomChatMessage,
    deleteRoomChatMessage,
    openTeamBuzzer,
    closeTeamBuzzer,
    triggerTeamBuzz,
    resolveTeamBuzz,
    resetTeamBuzzLock,
    upsertArcadeRoomScore,
    removeArcadeRoomScore,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
