// Central Reactive App Store (EventTarget-backed, 1:1 parity with LingoViewModel.kt + GameViewModel.kt)

import {
  ActivityType,
  BadgeEngine,
  CEFR_LABELS,
  CefrLevel,
  DIFFICULTY_CONFIG,
  DIFFICULTY_LEVELS,
  LINGO_BADGES,
  RoomStatus,
  computeQuizPointsEarned,
  createDefaultProfile,
  prepareDynamicQuizQuestions
} from '../models.js';
import { firebaseClient, DEFAULT_TEACHER_HUB_ID } from '../services/firebase-client.js';
import {
  OfflineStore,
  OFFLINE_DEFAULT_TEAM_ID,
  getSavedDifficulty,
  getSavedExplorerName,
  getThemeMode,
  setSavedDifficulty,
  setThemeMode
} from '../services/offline-store.js';
import { nearbySync } from '../services/nearby-sync.js';
import { audioService } from '../services/audio-service.js';

class AppStore extends EventTarget {
  constructor() {
    super();
    this.authMode = 'NONE'; // 'NONE' | 'OFFLINE' | 'GOOGLE'
    this.authLoading = true;
    this.user = null; // Firebase user when GOOGLE
    this.isOfflineMode = true;
    this.offlineStore = new OfflineStore('offline_explorer', getSavedExplorerName());

    this.profile = createDefaultProfile();
    this.sessionHistory = [];
    this.weeklyProgress = {};
    this.cardMastery = {};
    this.customQuizzes = [];
    this.customDecks = [];
    this.customRoleplays = [];
    this.teams = [];
    this.selectedTeamId = OFFLINE_DEFAULT_TEAM_ID;
    this.chatMessages = [];
    this.clubContent = [];
    this.globalScores = [];
    this.teamContributions = this.offlineStore.loadTeamContributions();
    this.teamScoresMap = this.offlineStore.loadTeamScoresMap();
    this.studentsProgress = [];
    this.selectedStudentDetail = null;

    // Live Kahoot Room State
    this.roomSession = null;
    this._recordedPodiumRooms = new Set();
    this._roomClockKey = '';
    this._roomClockStartedMs = 0;
    this._lastRoomPhaseKey = '';

    // Team Buzzer Overlay State (5-second lockout after buzz-in)
    this.teamBuzzer = {
      open: false,
      contextKey: 'global',
      title: 'Team Buzzer',
      prompt: '',
      teams: [],
      activeBuzz: null,
      buzzHistory: [],
      sessionScores: {}
    };
    this._buzzerUnlockTimer = null;
    this._onBuzzResolve = null;
    this._processedCloudBuzzIds = new Set();

    // Nearby cross-tab squad state
    this.nearbySnapshot = nearbySync.getSnapshot();

    // UI Global Filters, Difficulty & Theme
    this.selectedCefrFilter = null; // null | 'A1'|'A2'|'B1'|'B2'
    this.selectedDifficulty = getSavedDifficulty(); // 'EASY' | 'MEDIUM' | 'HARD'
    this.authError = '';
    this.themeMode = getThemeMode();
    setThemeMode(this.themeMode);

    this._unsubs = [];
    this._roomUnsubs = [];
    this._chatUnsub = null;
    this._tutorUnsubs = [];
    this._notifiedSessionBadges = new Set();

    this._initSubscriptions();
  }

  emit(type = 'change', detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  toast(message, kind = 'info') {
    this.emit('toast', { message, kind });
  }

  confetti() {
    this.emit('confetti', { key: Date.now() });
  }

  _clearMainUnsubs() {
    this._unsubs.forEach((u) => {
      try { u?.(); } catch (_) {}
    });
    this._unsubs = [];
    this._clearChatUnsub();
    this._clearTutorUnsubs();
    this._clearRoomUnsubs();
  }

  _clearChatUnsub() {
    if (this._chatUnsub) {
      try { this._chatUnsub(); } catch (_) {}
      this._chatUnsub = null;
    }
  }

  _clearTutorUnsubs() {
    this._tutorUnsubs.forEach((u) => {
      try { u?.(); } catch (_) {}
    });
    this._tutorUnsubs = [];
  }

  _clearRoomUnsubs() {
    this._roomUnsubs.forEach((u) => {
      try { u?.(); } catch (_) {}
    });
    this._roomUnsubs = [];
  }

  _initSubscriptions() {
    // Nearby cross-tab updates
    nearbySync.subscribe((ev, snap) => {
      this.nearbySnapshot = snap;
      if (ev?.type === 'ARCADE_ROOM_SYNC') {
        this.emit('team-leaderboard');
        return;
      }
      if (ev?.type === 'TEAM_BUZZER') {
        const incoming = ev.buzz || snap?.buzzer || null;
        if (incoming && Date.now() < Number(incoming.lockUntilMs || 0)) {
          const sameContext =
            !this.teamBuzzer.contextKey ||
            incoming.contextKey === this.teamBuzzer.contextKey ||
            this.teamBuzzer.open;
          if (sameContext && this.teamBuzzer.activeBuzz?.id !== incoming.id) {
            this.teamBuzzer = {
              ...this.teamBuzzer,
              activeBuzz: incoming
            };
            audioService.playBuzzer();
            this._scheduleBuzzerUnlockTimer(incoming.lockUntilMs);
            this.emit('buzzer');
          }
        } else if (!incoming && this.teamBuzzer.activeBuzz) {
          clearTimeout(this._buzzerUnlockTimer);
          this._buzzerUnlockTimer = null;
          this.teamBuzzer = { ...this.teamBuzzer, activeBuzz: null };
          this.emit('buzzer');
        }
        if (ev?.fromTab && ev.fromTab !== nearbySync.tabId) return;
      }
      if (ev?.type === 'SQUAD_MESSAGE' && ev.message) {
        this.offlineStore.appendMessage(ev.message);
        if (this.isOfflineMode && ev.message.teamId === this.selectedTeamId) {
          this.chatMessages = this.offlineStore.loadMessagesMap()[this.selectedTeamId] || [];
        }
      }
      if (this.roomSession && this.roomSession.mode === 'LOCAL') {
        const roomCode = this.roomSession.roomCode;
        const latest = nearbySync.getLocalQuizRoom(roomCode);
        if ((ev?.type === 'ROOM_CLOSED' && ev.roomCode === roomCode) || !latest) {
          const wasHost = this.roomSession.isHost;
          this._clearRoomUnsubs();
          this.roomSession = null;
          if (!wasHost) {
            this.toast('Host left — quiz room was closed.', 'error');
          }
        } else {
          this._applyLocalRoomSnapshot(latest);
        }
      }
      this.emit('team-leaderboard');
      this.emit('change');
    });

    // Best-effort room cleanup if host closes browser tab
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => {
        const s = this.roomSession;
        if (s?.isHost && s.roomCode) {
          if (s.mode === 'LOCAL') {
            nearbySync.closeLocalQuizRoom(s.roomCode);
          } else {
            firebaseClient.deleteQuizRoom(s.roomCode).catch(() => {});
          }
        }
      });
    }

    // Firebase Auth observer
    firebaseClient.initAuthListener(async (fbUser) => {
      this.authLoading = false;
      this.authError = firebaseClient.lastAuthError || '';
      if (fbUser) {
        this.user = fbUser;
        this.authMode = 'GOOGLE';
        this.isOfflineMode = false;
        this.selectedTeamId = DEFAULT_TEACHER_HUB_ID;
        await this._startGoogleSync(fbUser);
      } else {
        this.user = null;
        if (this.authMode === 'GOOGLE') {
          this.authMode = 'NONE';
          this._clearMainUnsubs();
        }
      }
      this.emit('auth');
      this.emit('change');
    });
  }

  enterOfflineMode(explorerName) {
    this._clearMainUnsubs();
    const cleanName = String(explorerName || getSavedExplorerName() || 'Offline Explorer').trim().slice(0, 50) || 'Offline Explorer';
    this.offlineStore = new OfflineStore('offline_explorer', cleanName);
    this.profile = this.offlineStore.updateDisplayName(cleanName);
    this.authMode = 'OFFLINE';
    this.isOfflineMode = true;
    this.user = null;
    this.sessionHistory = this.offlineStore.loadSessions();
    this.weeklyProgress = this.offlineStore.loadWeeklyProgress();
    this.cardMastery = this.offlineStore.loadCardMastery();
    this.customQuizzes = this.offlineStore.loadCustomQuizzes();
    this.customDecks = this.offlineStore.loadCustomDecks();
    this.customRoleplays = this.offlineStore.loadCustomRoleplays();
    this.teams = this.offlineStore.loadTeams();
    this.selectedTeamId = this.profile.teamId || OFFLINE_DEFAULT_TEAM_ID;
    this.chatMessages = this.offlineStore.loadMessagesMap()[this.selectedTeamId] || [];
    this.globalScores = this.offlineStore.loadScores();
    this.teamContributions = this.offlineStore.loadTeamContributions();
    this.teamScoresMap = this.offlineStore.loadTeamScoresMap();
    this.clubContent = [];
    this.studentsProgress = [];
    this.roomSession = null;
    this.emit('auth');
    this.emit('change');
  }

  async signInWithGoogle({ preferRedirect = false, silentToast = false } = {}) {
    this.authError = '';
    try {
      const user = await firebaseClient.signInWithGoogle({ preferRedirect });
      if (user) {
        this.toast(`Welcome back, ${user.displayName || 'Lingo Member'}!`);
      }
      return user;
    } catch (err) {
      const msg = err?.message || 'Google Sign-In failed.';
      this.authError = msg;
      if (!silentToast) {
        this.toast(msg, 'error');
      }
      throw err;
    }
  }

  async signOut() {
    this._clearMainUnsubs();
    nearbySync.stopHostingSquad();
    this.roomSession = null;
    if (!this.isOfflineMode) {
      await firebaseClient.signOut();
    }
    this.authMode = 'NONE';
    this.user = null;
    this.isOfflineMode = true;
    this.emit('auth');
    this.emit('change');
  }

  async _startGoogleSync(fbUser) {
    this._clearMainUnsubs();
    const uid = fbUser.uid;
    try {
      await firebaseClient.ensureUserProfile(fbUser.displayName || 'Lingo Member');
      if (firebaseClient.isBootstrappedTutor()) {
        await firebaseClient.ensureDefaultTutorHubIfTutor(fbUser.displayName || 'Tutor');
      }
    } catch (err) {
      console.warn('[AppStore] Initial profile sync notice:', err);
    }

    const add = async (fn) => {
      try {
        const unsub = await fn();
        if (typeof unsub === 'function') this._unsubs.push(unsub);
      } catch (err) {
        console.warn('[AppStore] Listener setup error:', err);
      }
    };

    await Promise.all([
      add(() => firebaseClient.observeUserProfile(uid, (p) => {
        if (p) {
          this.profile = p;
          if (!this.selectedTeamId) this.selectedTeamId = p.teamId || DEFAULT_TEACHER_HUB_ID;
          this.emit('change');
        }
      })),
      add(() => firebaseClient.observeSessionHistory(uid, (list) => {
        this.sessionHistory = list;
        this.emit('change');
      })),
      add(() => firebaseClient.observeWeeklyProgress(uid, (map) => {
        this.weeklyProgress = map;
        this.emit('change');
      })),
      add(() => firebaseClient.observeCardMastery(uid, (map) => {
        this.cardMastery = map;
        this.emit('change');
      })),
      add(() => firebaseClient.observeCustomQuizzes(uid, (list) => {
        const localLarge = this.offlineStore.loadCustomQuizzes();
        this.customQuizzes = [...localLarge, ...list].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        this.emit('change');
      })),
      add(() => firebaseClient.observeCustomDecks(uid, (list) => {
        this.customDecks = list;
        this.emit('change');
      })),
      add(() => firebaseClient.observeCustomRoleplays(uid, (list) => {
        this.customRoleplays = list;
        this.emit('change');
      })),
      add(() => firebaseClient.observeTeams((list) => {
        this.teams = list;
        this.emit('change');
      })),
      add(() => firebaseClient.observeClubContent((list) => {
        this.clubContent = list;
        this.emit('change');
      })),
      add(() => firebaseClient.observeGlobalScores((list) => {
        this.globalScores = list;
        this.emit('change');
      }))
    ]);

    this._observeTeamChatOnline(this.selectedTeamId || DEFAULT_TEACHER_HUB_ID);
    this._observeTutorRosterOnline(uid);
  }

  async _observeTeamChatOnline(teamId) {
    this._clearChatUnsub();
    if (this.isOfflineMode || !teamId) return;
    try {
      this._chatUnsub = await firebaseClient.observeTeamMessages(
        teamId,
        (msgs) => {
          this.chatMessages = msgs;
          this.emit('change');
        },
        (err) => {
          console.warn('[AppStore] Team chat listener notice:', err?.message);
        }
      );
    } catch (_) {}
  }

  async _observeTutorRosterOnline(uid) {
    this._clearTutorUnsubs();
    if (this.isOfflineMode) return;
    const sources = { linked: [], boot: [], direct: [] };
    const merge = () => {
      const map = new Map();
      for (const s of sources.linked) {
        map.set(s.studentUid || s.id, { ...s });
      }
      for (const u of [...sources.boot, ...sources.direct]) {
        const sid = u.userId || u.id;
        const ex = map.get(sid);
        if (!ex) {
          map.set(sid, {
            id: sid,
            studentUid: sid,
            tutorUid: u.tutorUid || uid,
            studentName: u.displayName || 'Student',
            learningLevel: u.learningLevel || 'B1',
            xp: u.xp || 0,
            streak: u.streak || 1,
            sessionsCompleted: u.sessionsCompleted || 0,
            weeklyWordsMastered: u.weeklyWordsMastered || 0,
            quizzesPlayed: u.quizzesPlayed || 0,
            quizzesHosted: u.quizzesHosted || 0,
            bestLiveQuizScore: u.bestLiveQuizScore || 0,
            cardsMastered: u.cardsMastered || 0,
            decksCreated: 0,
            audiobooksFinished: u.audiobooksFinished || 0,
            teamName: u.teamName || '',
            earnedBadges: u.earnedBadges || [],
            recentActivities: []
          });
        } else {
          map.set(sid, {
            ...ex,
            studentName: u.displayName || ex.studentName,
            learningLevel: u.learningLevel || ex.learningLevel,
            xp: Math.max(ex.xp || 0, u.xp || 0),
            streak: u.streak || ex.streak,
            sessionsCompleted: Math.max(ex.sessionsCompleted || 0, u.sessionsCompleted || 0),
            weeklyWordsMastered: Math.max(ex.weeklyWordsMastered || 0, u.weeklyWordsMastered || 0),
            quizzesPlayed: Math.max(ex.quizzesPlayed || 0, u.quizzesPlayed || 0),
            quizzesHosted: Math.max(ex.quizzesHosted || 0, u.quizzesHosted || 0),
            bestLiveQuizScore: Math.max(ex.bestLiveQuizScore || 0, u.bestLiveQuizScore || 0),
            cardsMastered: Math.max(ex.cardsMastered || 0, u.cardsMastered || 0),
            audiobooksFinished: Math.max(ex.audiobooksFinished || 0, u.audiobooksFinished || 0),
            teamName: u.teamName || ex.teamName,
            earnedBadges: [...new Set([...(ex.earnedBadges || []), ...(u.earnedBadges || [])])]
          });
        }
      }
      this.studentsProgress = [...map.values()].sort((a, b) => (b.xp || 0) - (a.xp || 0));
      this.emit('change');
    };

    try {
      this._tutorUnsubs.push(await firebaseClient.observeLinkedStudents(uid, (l) => { sources.linked = l; merge(); }, () => {}));
      this._tutorUnsubs.push(await firebaseClient.observeBootstrappedStudents((l) => { sources.boot = l; merge(); }, () => {}));
      this._tutorUnsubs.push(await firebaseClient.observeDirectAssignedStudents(uid, (l) => { sources.direct = l; merge(); }, () => {}));
    } catch (_) {}
  }

  get currentUserId() {
    return this.isOfflineMode ? 'offline_explorer' : (this.user?.uid || 'offline_explorer');
  }

  get currentUserName() {
    return this.profile?.displayName || this.user?.displayName || 'Lingo Explorer';
  }

  get isBootstrappedTutor() {
    return !this.isOfflineMode && firebaseClient.isBootstrappedTutor();
  }

  get difficultyConfig() {
    return DIFFICULTY_CONFIG[this.selectedDifficulty] || DIFFICULTY_CONFIG.MEDIUM;
  }

  setDifficulty(level) {
    const clean = DIFFICULTY_LEVELS.includes(String(level || '').toUpperCase())
      ? String(level).toUpperCase()
      : 'MEDIUM';
    this.selectedDifficulty = clean;
    setSavedDifficulty(clean);
    this.toast(`Difficulty set to ${DIFFICULTY_CONFIG[clean].label}`);
    this.emit('change');
  }

  setCefrFilter(levelOrNull) {
    this.selectedCefrFilter = this.selectedCefrFilter === levelOrNull ? null : levelOrNull;
    this.emit('change');
  }

  cycleThemeMode() {
    const order = ['auto', 'light', 'dark'];
    const next = order[(order.indexOf(this.themeMode) + 1) % order.length];
    this.themeMode = next;
    setThemeMode(next);
    this.toast(`Theme: ${next.toUpperCase()}`);
    this.emit('change');
  }

  async updateDisplayName(name) {
    if (this.isOfflineMode) {
      this.profile = this.offlineStore.updateDisplayName(name);
      this.emit('change');
      this.toast('Explorer name updated!');
    }
  }

  async updateLearningLevel(level) {
    const label = CEFR_LABELS[level] || level;
    if (this.isOfflineMode) {
      this.profile = this.offlineStore.updateLearningLevel(level);
      this.emit('change');
      this.toast(`Student level set to ${label}`);
      return;
    }
    this.profile = { ...this.profile, learningLevel: level };
    this.emit('change');
    try {
      await firebaseClient.updateLearningLevel(level);
      await this._syncTutorIfLinked();
      this.toast(`Student level updated to ${label}`);
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  _checkAndNotifyBadges(opts = {}) {
    const p = this.profile || createDefaultProfile();
    const fresh = BadgeEngine.computeNewBadges({
      existingIds: [...(p.earnedBadges || []), ...this._notifiedSessionBadges],
      sessionsCompleted: (p.sessionsCompleted || 0) + (opts.sessionsCompletedDelta || 0),
      weeklyWordsMastered: (p.weeklyWordsMastered || 0) + (opts.weeklyWordsMasteredDelta || 0),
      quizzesPlayed: (p.quizzesPlayed || 0) + (opts.quizzesPlayedDelta || 0),
      quizzesHosted: (p.quizzesHosted || 0) + (opts.quizzesHostedDelta || 0),
      bestLiveQuizScore: Math.max(p.bestLiveQuizScore || 0, opts.bestLiveQuizScoreCandidate || 0),
      latestQuizAccuracyPct: opts.latestQuizAccuracyPct || 0,
      audiobooksFinished: (p.audiobooksFinished || 0) + (opts.audiobooksFinishedDelta || 0),
      roleplayCompleted: Boolean(opts.roleplayCompleted),
      arcadePlayed: Boolean(opts.arcadePlayed),
      highCombo: opts.highCombo || 0
    });
    if (fresh.length > 0) {
      fresh.forEach((b) => this._notifiedSessionBadges.add(b.id));
      this.toast(`Badge Unlocked: ${fresh[0].icon} ${fresh[0].title}!`, 'badge');
      this.confetti();
    }
    return fresh.map((b) => b.id);
  }

  async awardActivityProgress({
    xpDelta = 0,
    activityType = ActivityType.GAME,
    title = 'Practice',
    cefrLevel = null,
    score = 0,
    accuracyPct = 100,
    wordsPracticed = 5,
    durationMinutes = 3,
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
    publishLeaderboardMode = null,
    skipAutoTeamContrib = false
  }) {
    const level = cefrLevel || this.profile?.learningLevel || CefrLevel.B1;
    const activeTeamId = this.profile?.teamId || this.selectedTeamId || OFFLINE_DEFAULT_TEAM_ID;
    const activeTeamObj = (this.teams || []).find((t) => t.id === activeTeamId);
    const activeTeamName = this.profile?.teamName || activeTeamObj?.name || 'Offline Explorers';
    const newBadgeIds = this._checkAndNotifyBadges({
      sessionsCompletedDelta,
      weeklyWordsMasteredDelta,
      quizzesPlayedDelta,
      quizzesHostedDelta,
      bestLiveQuizScoreCandidate,
      latestQuizAccuracyPct: activityType === ActivityType.QUIZ ? accuracyPct : 0,
      audiobooksFinishedDelta,
      roleplayCompleted,
      arcadePlayed,
      highCombo
    });

    if (!skipAutoTeamContrib && score > 0 && activeTeamId) {
      this.awardTeamContribution(
        {
          teamId: activeTeamId,
          teamName: activeTeamName,
          playerName: this.currentUserName,
          avatarColor: this.profile?.avatarColor || 'INDIGO',
          title,
          gameMode: publishLeaderboardMode || activityType,
          points: score,
          accuracyPct,
          cefrLevel: level
        },
        false
      );
    }

    if (this.isOfflineMode) {
      this.profile = this.offlineStore.awardProgress({
        xpDelta,
        quizzesHostedDelta,
        quizzesPlayedDelta,
        cardsMasteredDelta,
        sessionsCompletedDelta,
        audiobooksFinishedDelta,
        weeklyWordsMasteredDelta,
        bestLiveQuizScoreCandidate,
        newEarnedBadgeIds: newBadgeIds
      });
      this.sessionHistory = this.offlineStore.logSessionRecord({
        activityType,
        title,
        cefrLevel: level,
        score,
        accuracyPct,
        wordsPracticed,
        durationMinutes
      });
      if (publishLeaderboardMode && score > 0) {
        this.globalScores = this.offlineStore.publishScoreRecord({
          playerName: this.currentUserName,
          quizTitle: title,
          cefrLevel: level,
          score,
          accuracyPct,
          streak: highCombo,
          gameMode: publishLeaderboardMode,
          avatarColor: this.profile?.avatarColor || 'INDIGO',
          teamId: activeTeamId,
          teamName: activeTeamName
        });
      }
      this.emit('change');
      return;
    }

    try {
      await firebaseClient.awardProgress({
        xpDelta,
        quizzesHostedDelta,
        quizzesPlayedDelta,
        cardsMasteredDelta,
        sessionsCompletedDelta,
        audiobooksFinishedDelta,
        weeklyWordsMasteredDelta,
        bestLiveQuizScoreCandidate,
        newEarnedBadgeIds: newBadgeIds
      });
      await firebaseClient.logSessionRecord({
        activityType,
        title,
        cefrLevel: level,
        score,
        accuracyPct,
        wordsPracticed,
        durationMinutes
      });
      if (publishLeaderboardMode && score > 0) {
        await firebaseClient.publishScoreRecord({
          quizTitle: title,
          cefrLevel: level,
          score,
          accuracyPct,
          streak: highCombo,
          gameMode: publishLeaderboardMode
        });
      }
      await this._syncTutorIfLinked();
    } catch (err) {
      console.warn('[AppStore] Cloud progress error:', err);
    }
  }

  async _syncTutorIfLinked() {
    if (this.isOfflineMode || !this.profile?.tutorUid) return;
    try {
      await firebaseClient.syncStudentProgressToTutor({
        profile: this.profile,
        decksCount: this.customDecks.length,
        recentSessions: this.sessionHistory
      });
    } catch (_) {}
  }

  // --- Weekly Curriculum ---

  async toggleWeeklyWordMastered(weekNumber, wordId) {
    const wp = this.weeklyProgress[weekNumber] || {
      weekNumber,
      masteredWordIds: [],
      completedSessions: [],
      gamesPlayed: 0
    };
    const set = new Set(wp.masteredWordIds || []);
    const adding = !set.has(wordId);
    if (adding) set.add(wordId);
    else set.delete(wordId);
    const updatedIds = [...set];

    if (this.isOfflineMode) {
      this.weeklyProgress = this.offlineStore.updateWeeklyWordMastery(weekNumber, updatedIds);
      this.profile = this.offlineStore.awardProgress({
        xpDelta: adding ? 5 : 0,
        weeklyWordsMasteredDelta: adding ? 1 : -1,
        newEarnedBadgeIds: adding ? this._checkAndNotifyBadges({ weeklyWordsMasteredDelta: 1 }) : []
      });
      this.emit('change');
      return;
    }

    try {
      await firebaseClient.updateWeeklyWordMastery(weekNumber, updatedIds);
      await firebaseClient.awardProgress({
        xpDelta: adding ? 5 : 0,
        weeklyWordsMasteredDelta: adding ? 1 : -1,
        newEarnedBadgeIds: adding ? this._checkAndNotifyBadges({ weeklyWordsMasteredDelta: 1 }) : []
      });
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  async completeWeeklySession(weekNumber, sessionNumber) {
    if (this.isOfflineMode) {
      const { map, newlyCompleted } = this.offlineStore.markWeeklySessionComplete(weekNumber, sessionNumber);
      this.weeklyProgress = map;
      const badgeIds = this._checkAndNotifyBadges({ sessionsCompletedDelta: newlyCompleted ? 1 : 0 });
      this.profile = this.offlineStore.awardProgress({
        xpDelta: newlyCompleted ? 50 : 15,
        sessionsCompletedDelta: newlyCompleted ? 1 : 0,
        newEarnedBadgeIds: badgeIds
      });
      this.sessionHistory = this.offlineStore.logSessionRecord({
        activityType: ActivityType.WEEKLY_SESSION,
        title: `Week ${weekNumber} · Session ${sessionNumber}`,
        cefrLevel: weekNumber === 1 ? CefrLevel.B1 : CefrLevel.B2,
        score: newlyCompleted ? 50 : 15,
        accuracyPct: 100,
        wordsPracticed: 65,
        durationMinutes: 12
      });
      this.emit('change');
      this.confetti();
      this.toast(`Session ${sessionNumber} completed! +${newlyCompleted ? 50 : 15} XP`);
      return;
    }

    try {
      const newlyCompleted = await firebaseClient.markWeeklySessionComplete(weekNumber, sessionNumber);
      const badgeIds = this._checkAndNotifyBadges({ sessionsCompletedDelta: newlyCompleted ? 1 : 0 });
      await firebaseClient.awardProgress({
        xpDelta: newlyCompleted ? 50 : 15,
        sessionsCompletedDelta: newlyCompleted ? 1 : 0,
        newEarnedBadgeIds: badgeIds
      });
      await firebaseClient.logSessionRecord({
        activityType: ActivityType.WEEKLY_SESSION,
        title: `Week ${weekNumber} · Session ${sessionNumber}`,
        cefrLevel: weekNumber === 1 ? CefrLevel.B1 : CefrLevel.B2,
        score: newlyCompleted ? 50 : 15,
        accuracyPct: 100,
        wordsPracticed: 65,
        durationMinutes: 12
      });
      await this._syncTutorIfLinked();
      this.confetti();
      this.toast(`Session ${sessionNumber} completed! +${newlyCompleted ? 50 : 15} XP`);
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  async recordWeeklyGame(weekNumber, title, score, accuracyPct) {
    if (this.isOfflineMode) {
      this.weeklyProgress = this.offlineStore.recordWeeklyGamePlayed(weekNumber);
    } else {
      try { await firebaseClient.recordWeeklyGamePlayed(weekNumber); } catch (_) {}
    }
    await this.awardActivityProgress({
      xpDelta: Math.max(15, Math.round(score / 10)),
      activityType: ActivityType.GAME,
      title,
      cefrLevel: weekNumber === 1 ? CefrLevel.B1 : CefrLevel.B2,
      score,
      accuracyPct,
      wordsPracticed: 10,
      durationMinutes: 2,
      arcadePlayed: true,
      publishLeaderboardMode: 'WEEKLY_BLITZ'
    });
  }

  // --- Evidence Board Pins ---

  async togglePinEvidence(cardId) {
    const pinnedSet = new Set(this.profile?.pinnedEvidenceIds || []);
    const nextPinned = !pinnedSet.has(cardId);
    if (this.isOfflineMode) {
      this.profile = this.offlineStore.togglePinEvidence(cardId, nextPinned);
      this.emit('change');
      return nextPinned;
    }
    try {
      await firebaseClient.togglePinEvidence(cardId, nextPinned);
      return nextPinned;
    } catch (err) {
      this.toast(err.message, 'error');
      return !nextPinned;
    }
  }

  // --- Flashcards & Custom Decks ---

  async toggleCardMastery(deckId, cardIndex, mastered) {
    if (this.isOfflineMode) {
      this.cardMastery = this.offlineStore.toggleCardMastery(deckId, cardIndex, mastered);
      this.profile = this.offlineStore.awardProgress({
        xpDelta: mastered ? 8 : 0,
        cardsMasteredDelta: mastered ? 1 : 0
      });
      this.emit('change');
      return;
    }
    try {
      await firebaseClient.toggleCardMastery(deckId, cardIndex, mastered);
      if (mastered) {
        await firebaseClient.awardProgress({ xpDelta: 8, cardsMasteredDelta: 1 });
      }
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  async saveCustomDeck(payload) {
    if (this.isOfflineMode) {
      this.customDecks = this.offlineStore.saveCustomDeck(payload);
      this.emit('change');
      this.toast(`Saved deck "${payload.title}"!`);
      return;
    }
    await firebaseClient.saveCustomDeck(payload);
    this.toast(`Saved deck "${payload.title}" to cloud!`);
    await this._syncTutorIfLinked();
  }

  async updateCustomDeck(deckId, payload) {
    if (this.isOfflineMode) {
      this.customDecks = this.offlineStore.updateCustomDeck(deckId, payload);
      this.emit('change');
      this.toast('Deck updated!');
      return;
    }
    await firebaseClient.updateCustomDeck(deckId, payload);
    this.toast('Deck updated!');
  }

  async deleteCustomDeck(deckId) {
    if (this.isOfflineMode) {
      this.customDecks = this.offlineStore.deleteCustomDeck(deckId);
      this.emit('change');
      this.toast('Deck deleted.');
      return;
    }
    await firebaseClient.deleteCustomDeck(deckId);
    this.toast('Deck deleted.');
  }

  async quickSaveWordToDeck(entry) {
    const targetTitle = 'Saved Vocabulary';
    const existing = this.customDecks.find((d) => d.title === targetTitle);
    const newCard = {
      term: entry.english,
      translation: entry.arabic || '',
      pronunciation: entry.phonetic || '',
      exampleSentence: entry.example || entry.english
    };
    if (existing) {
      if ((existing.cards || []).some((c) => c.term.toLowerCase() === newCard.term.toLowerCase())) {
        this.toast(`"${entry.english}" is already in ${targetTitle}.`);
        return;
      }
      const nextCards = [newCard, ...(existing.cards || [])].slice(0, 40);
      await this.updateCustomDeck(existing.id, {
        title: existing.title,
        cefrLevel: existing.cefrLevel || CefrLevel.B1,
        cards: nextCards
      });
    } else {
      await this.saveCustomDeck({
        title: targetTitle,
        cefrLevel: entry.cefrLevel || CefrLevel.B1,
        cards: [newCard]
      });
    }
  }

  // --- Custom Quizzes & Roleplays ---

  async saveCustomQuiz(payload) {
    const qs = payload?.questions || [];
    if (this.isOfflineMode || qs.length > 20 || payload?.customPrompt) {
      const savedLocal = this.offlineStore.saveCustomQuiz(payload);
      const cloudOnly = this.isOfflineMode ? [] : (this.customQuizzes || []).filter((q) => !String(q.id || '').startsWith('offline_quiz_'));
      this.customQuizzes = [...savedLocal, ...cloudOnly].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      this.emit('change');
      this.toast(`Saved ${qs.length}-question quiz "${payload.title}"!`);
      return savedLocal[0];
    }
    await firebaseClient.saveCustomQuiz(payload);
    this.toast(`Saved quiz "${payload.title}"!`);
    return payload;
  }

  async updateCustomQuiz(id, patch) {
    if (this.isOfflineMode || String(id || '').startsWith('offline_quiz_')) {
      const savedLocal = this.offlineStore.updateCustomQuiz(id, patch);
      const cloudOnly = this.isOfflineMode ? [] : (this.customQuizzes || []).filter((q) => !String(q.id || '').startsWith('offline_quiz_'));
      this.customQuizzes = [...savedLocal, ...cloudOnly].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      this.emit('change');
      this.toast(`Updated "${patch?.title || 'Custom Quiz'}"!`);
      return;
    }
    await this.saveCustomQuiz({ ...patch });
  }

  async deleteCustomQuiz(id) {
    if (this.isOfflineMode || String(id || '').startsWith('offline_quiz_')) {
      const savedLocal = this.offlineStore.deleteCustomQuiz(id);
      const cloudOnly = this.isOfflineMode ? [] : (this.customQuizzes || []).filter((q) => !String(q.id || '').startsWith('offline_quiz_'));
      this.customQuizzes = [...savedLocal, ...cloudOnly].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      this.emit('change');
      return;
    }
    await firebaseClient.deleteCustomQuiz(id);
  }

  async saveCustomRoleplay(scenario) {
    const payload = {
      title: scenario.title,
      setting: scenario.setting,
      cefrLevel: scenario.cefrLevel,
      roleAName: scenario.roleAName,
      roleBName: scenario.roleBName,
      goal: scenario.goal,
      source: scenario.source === 'AI' ? 'AI' : 'OFFLINE',
      lines: scenario.lines,
      plotTwists: scenario.plotTwists || []
    };
    if (this.isOfflineMode) {
      this.customRoleplays = this.offlineStore.saveCustomRoleplay(payload);
      this.emit('change');
      this.toast(`Saved roleplay "${scenario.title}"!`);
      return;
    }
    await firebaseClient.saveCustomRoleplay(payload);
    this.toast(`Saved roleplay "${scenario.title}"!`);
  }

  async deleteCustomRoleplay(id) {
    if (this.isOfflineMode) {
      this.customRoleplays = this.offlineStore.deleteCustomRoleplay(id);
      this.emit('change');
      return;
    }
    await firebaseClient.deleteCustomRoleplay(id);
  }

  // --- Live Kahoot Quiz Rooms (Cloud Firestore OR Cross-Tab BroadcastChannel) ---

  async hostQuizRoom({ quizTitle, cefrLevel, questions, shuffle = true }) {
    const prepared = shuffle ? prepareDynamicQuizQuestions(questions) : questions;
    if (this.isOfflineMode) {
      const room = nearbySync.createLocalQuizRoom({
        hostUid: this.currentUserId,
        hostName: this.currentUserName,
        quizTitle,
        cefrLevel,
        questions: prepared
      });
      this.roomSession = {
        mode: 'LOCAL',
        roomCode: room.roomCode,
        isHost: true,
        hasLoadedRoom: true,
        localNickname: this.currentUserName,
        localAvatarColor: 'INDIGO',
        room,
        players: Object.values(room.players || {}),
        roomMessages: room.messages || [],
        localScore: 0,
        localStreak: 0,
        correctAnswersCount: 0,
        answeredQuestionIndex: -1,
        selectedOptionIndex: -1
      };
      this.offlineStore.awardProgress({
        xpDelta: 25,
        quizzesHostedDelta: 1,
        newEarnedBadgeIds: this._checkAndNotifyBadges({ quizzesHostedDelta: 1 })
      });
      this.profile = this.offlineStore.loadProfile();
      this.emit('change');
      this.toast(`Nearby Room ${room.roomCode} opened! Share PIN with another tab.`);
      return room.roomCode;
    }

    if (prepared.length > 20) {
      this.toast('Cloud Live Rooms host up to 20 questions (use Solo Blitz for all ' + prepared.length + ').');
    }

    const code = await firebaseClient.createQuizRoom({
      hostName: this.currentUserName,
      quizTitle,
      cefrLevel,
      questions: prepared
    });
    const badges = this._checkAndNotifyBadges({ quizzesHostedDelta: 1 });
    await firebaseClient.awardProgress({
      xpDelta: 25,
      quizzesHostedDelta: 1,
      newEarnedBadgeIds: badges
    });
    this.roomSession = {
      mode: 'CLOUD',
      roomCode: code,
      isHost: true,
      hasLoadedRoom: false,
      localNickname: this.currentUserName,
      localAvatarColor: 'INDIGO',
      room: null,
      players: [],
      roomMessages: [],
      localScore: 0,
      localStreak: 0,
      correctAnswersCount: 0,
      answeredQuestionIndex: -1,
      selectedOptionIndex: -1
    };
    await this._attachOnlineRoomListeners(code, this.currentUserId);
    this.emit('change');
    this.toast(`Live Room ${code} created!`);
    return code;
  }

  async joinQuizRoom({ roomCode, nickname, avatarColor = 'INDIGO' }) {
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) {
      throw new Error('Enter a valid 6-character Room PIN.');
    }
    const cleanNick = String(nickname || this.currentUserName).trim().slice(0, 24) || 'Explorer';

    if (this.isOfflineMode) {
      const myTeamId = this.profile?.teamId || this.selectedTeamId || '';
      const myTeamObj = (this.teams || []).find((t) => t.id === myTeamId);
      const room = nearbySync.joinLocalQuizRoom({
        roomCode: clean,
        playerUid: this.currentUserId,
        nickname: cleanNick,
        avatarColor,
        teamId: myTeamId,
        teamName: this.profile?.teamName || myTeamObj?.name || ''
      });
      const existingPlayer = room.players?.[this.currentUserId];
      this.roomSession = {
        mode: 'LOCAL',
        roomCode: clean,
        isHost: room.hostUid === this.currentUserId,
        localNickname: cleanNick,
        localAvatarColor: avatarColor,
        room,
        players: Object.values(room.players || {}).sort((a, b) => (b.score || 0) - (a.score || 0)),
        roomMessages: room.messages || [],
        localScore: existingPlayer?.score || 0,
        localStreak: existingPlayer?.streak || 0,
        correctAnswersCount: 0,
        answeredQuestionIndex: existingPlayer?.lastAnsweredQuestion ?? -1,
        selectedOptionIndex: existingPlayer?.lastAnswerIndex ?? -1
      };
      this.emit('change');
      this.toast(`Joined nearby room ${clean}!`);
      return;
    }

    const room = await firebaseClient.joinRoom({ roomCode: clean, nickname: cleanNick, avatarColor });
    this.roomSession = {
      mode: 'CLOUD',
      roomCode: clean,
      isHost: room.hostUid === this.currentUserId,
      hasLoadedRoom: true,
      localNickname: cleanNick,
      localAvatarColor: avatarColor,
      room,
      players: [],
      roomMessages: [],
      localScore: 0,
      localStreak: 0,
      correctAnswersCount: 0,
      answeredQuestionIndex: -1,
      selectedOptionIndex: -1
    };
    await this._attachOnlineRoomListeners(clean, room.hostUid);
    this.emit('change');
    this.toast(`Joined live room ${clean}!`);
  }

  async _attachOnlineRoomListeners(roomCode, hostUid) {
    this._clearRoomUnsubs();
    const kickOut = (reason = 'Host left — quiz room was closed.') => {
      if (!this.roomSession || this.roomSession.roomCode !== roomCode) return;
      const wasHost = this.roomSession.isHost;
      this._clearRoomUnsubs();
      this.roomSession = null;
      if (!wasHost) {
        this.toast(reason, 'error');
      }
      this.emit('change');
    };

    const u1 = await firebaseClient.observeRoom(
      roomCode,
      (room) => {
        if (!this.roomSession || this.roomSession.roomCode !== roomCode) return;
        if (!room) {
          if (this.roomSession.hasLoadedRoom || !this.roomSession.isHost) {
            kickOut('Host left — quiz room was closed.');
          }
          return;
        }
        this.roomSession = { ...this.roomSession, room, hasLoadedRoom: true };
        if (room.status === RoomStatus.PODIUM) {
          this._handleRoomReachedPodium(this.roomSession);
        }
        this.emit('change');
      },
      () => {
        kickOut('Quiz room ended or is no longer available.');
      }
    );
    const u2 = await firebaseClient.observeRoomPlayers(
      roomCode,
      hostUid,
      (players) => {
        if (!this.roomSession || this.roomSession.roomCode !== roomCode) return;
        this.roomSession = { ...this.roomSession, players };
        this.emit('change');
      },
      () => {}
    );
    const u3 = await firebaseClient.observeRoomMessages(
      roomCode,
      (roomMessages) => {
        if (!this.roomSession || this.roomSession.roomCode !== roomCode) return;
        this.roomSession = { ...this.roomSession, roomMessages };
        // Parse cloud [BUZZ|teamId|teamName|playerName|buzzedAtMs] messages for cross-device 5s lockout
        for (const msg of roomMessages) {
          const txt = String(msg?.text || '');
          if (txt.startsWith('[BUZZ|') && txt.endsWith(']')) {
            const parts = txt.slice(6, -1).split('|');
            if (parts.length >= 4) {
              const buzzId = msg.id || `${parts[0]}_${parts[3]}`;
              if (!this._processedCloudBuzzIds.has(buzzId)) {
                this._processedCloudBuzzIds.add(buzzId);
                const buzzedAtMs = Number(parts[3]) || msg.createdAtMs || Date.now();
                const lockUntilMs = buzzedAtMs + 5000;
                if (Date.now() < lockUntilMs) {
                  this.teamBuzzer = {
                    ...this.teamBuzzer,
                    activeBuzz: {
                      id: buzzId,
                      contextKey: `room:${roomCode}`,
                      teamId: parts[0],
                      teamName: parts[1],
                      playerUid: msg.senderUid || '',
                      playerName: parts[2] || msg.senderName || 'Player',
                      avatarColor: msg.avatarColor || 'INDIGO',
                      buzzedAtMs,
                      lockUntilMs
                    }
                  };
                  audioService.playBuzzer();
                  this._scheduleBuzzerUnlockTimer(lockUntilMs);
                  this.emit('buzzer');
                }
              }
            }
          }
        }
        this.emit('change');
      },
      () => {}
    );
    this._roomUnsubs.push(u1, u2, u3);
  }

  _applyLocalRoomSnapshot(room) {
    if (!this.roomSession || this.roomSession.roomCode !== room.roomCode) return;
    const players = Object.values(room.players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
    this.roomSession = {
      ...this.roomSession,
      room,
      players,
      roomMessages: room.messages || []
    };
    if (room.status === RoomStatus.PODIUM) {
      this._handleRoomReachedPodium(this.roomSession);
    }
  }

  async _handleRoomReachedPodium(session) {
    if (!session?.room || this._recordedPodiumRooms.has(session.roomCode)) return;
    this._recordedPodiumRooms.add(session.roomCode);
    const qTotal = Math.max(1, session.room.questions?.length || 1);
    const accuracy = Math.min(100, Math.round((session.correctAnswersCount / qTotal) * 100));
    const score = session.localScore || 0;
    this.confetti();
    if (!session.isHost || score > 0) {
      await this.awardActivityProgress({
        xpDelta: Math.max(25, Math.round(score / 25)),
        activityType: ActivityType.QUIZ,
        title: session.room.quizTitle || 'Live Quiz Clash',
        cefrLevel: session.room.cefrLevel || CefrLevel.B1,
        score,
        accuracyPct: accuracy,
        wordsPracticed: qTotal,
        durationMinutes: 4,
        quizzesPlayedDelta: 1,
        bestLiveQuizScoreCandidate: score,
        highCombo: session.localStreak,
        publishLeaderboardMode: 'LIVE_QUIZ'
      });
    }
  }

  _syncRoomClock(room) {
    if (!room) return;
    const qIdx = Number(room.currentQuestionIndex || 0);
    const key = `${room.roomCode}_${room.status}_${qIdx}_${room.questionStartedAtMs || 0}`;
    if (room.status !== RoomStatus.QUESTION) {
      this._lastRoomPhaseKey = key;
      return;
    }
    if (this._roomClockKey !== key) {
      const q = room.questions?.[qIdx];
      const totalSec = Number(q?.timeLimitSec || 20);
      const rawStarted = Number(room.questionStartedAtMs || Date.now());
      const rawElapsed = Date.now() - rawStarted;
      const isHostOrLocal = Boolean(this.roomSession?.isHost || this.roomSession?.mode === 'LOCAL');
      if (isHostOrLocal) {
        this._roomClockStartedMs = rawElapsed < 0 ? Date.now() : rawStarted;
      } else if (this._lastRoomPhaseKey && this._lastRoomPhaseKey !== key) {
        // Real-time transition observed on this device: anchor clock cleanly to avoid host/player device clock skew
        this._roomClockStartedMs = rawElapsed >= 0 && rawElapsed <= 2500 ? rawStarted : Date.now();
      } else {
        // Joined mid-question: guard against negative or wildly future/stale client clock skew
        if (rawElapsed < 0) {
          this._roomClockStartedMs = Date.now();
        } else if (rawElapsed > totalSec * 1000 + 2000) {
          this._roomClockStartedMs = Date.now() - Math.max(0, (totalSec - 5) * 1000);
        } else {
          this._roomClockStartedMs = rawStarted;
        }
      }
      this._roomClockKey = key;
    }
    this._lastRoomPhaseKey = key;
  }

  getLiveRoomTimeRemaining(room, q) {
    const totalSec = Math.max(1, Number(q?.timeLimitSec || this.difficultyConfig?.timeLimitSec || 20));
    if (!room || room.status !== RoomStatus.QUESTION) {
      return { leftSec: 0, totalSec, elapsedSec: totalSec };
    }
    this._syncRoomClock(room);
    const elapsedSec = Math.max(0, (Date.now() - this._roomClockStartedMs) / 1000);
    const leftSec = Math.max(0, Math.ceil(totalSec - elapsedSec));
    return { leftSec, totalSec, elapsedSec };
  }

  async submitLiveAnswer(optionIndex) {
    const s = this.roomSession;
    if (!s?.room) return;
    const qIdx = s.room.currentQuestionIndex || 0;
    if (s.answeredQuestionIndex === qIdx) return;
    const q = s.room.questions?.[qIdx];
    if (!q) return;

    const { leftSec, totalSec } = this.getLiveRoomTimeRemaining(s.room, q);
    const correct = Number(optionIndex) === Number(q.correctIndex);
    const points = computeQuizPointsEarned(correct, leftSec, totalSec, s.localStreak);
    const newScore = (s.localScore || 0) + points;
    const newStreak = correct ? (s.localStreak || 0) + 1 : 0;

    this.roomSession = {
      ...s,
      answeredQuestionIndex: qIdx,
      selectedOptionIndex: optionIndex,
      localScore: newScore,
      localStreak: newStreak,
      correctAnswersCount: s.correctAnswersCount + (correct ? 1 : 0)
    };
    this.emit('change');

    if (s.mode === 'LOCAL') {
      nearbySync.submitLocalRoomAnswer({
        roomCode: s.roomCode,
        playerUid: this.currentUserId,
        questionIndex: qIdx,
        selectedIndex: optionIndex,
        correct,
        pointsEarned: points,
        newScore,
        newStreak
      });
      return;
    }

    try {
      await firebaseClient.submitRoomAnswer({
        roomCode: s.roomCode,
        questionIndex: qIdx,
        selectedIndex: optionIndex,
        correct,
        pointsEarned: points,
        newScore,
        newStreak
      });
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  async advanceLiveRoomPhase(newStatus, nextQuestionIndex) {
    const s = this.roomSession;
    if (!s?.room || !s.isHost) return;
    const lb = (s.players || [])
      .slice()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 25)
      .map((p) => ({
        playerUid: p.playerUid,
        nickname: p.nickname,
        avatarColor: p.avatarColor || 'INDIGO',
        score: p.score || 0,
        streak: p.streak || 0
      }));
    const startedAt = newStatus === RoomStatus.QUESTION ? Date.now() : Number(s.room.questionStartedAtMs || 0);

    if (s.mode === 'LOCAL') {
      nearbySync.advanceLocalRoomPhase({
        roomCode: s.roomCode,
        newStatus,
        questionIndex: nextQuestionIndex,
        questionStartedAtMs: startedAt,
        leaderboard: lb
      });
      return;
    }

    try {
      await firebaseClient.advanceRoomPhase({
        roomCode: s.roomCode,
        newStatus,
        questionIndex: nextQuestionIndex,
        questionStartedAtMs: startedAt,
        leaderboard: lb
      });
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  async sendLiveRoomMessage(text, messageType = 'TEXT') {
    const s = this.roomSession;
    if (!s) return;
    if (s.mode === 'LOCAL') {
      nearbySync.sendLocalRoomMessage({
        roomCode: s.roomCode,
        senderUid: this.currentUserId,
        senderName: s.localNickname || this.currentUserName,
        avatarColor: s.localAvatarColor || 'INDIGO',
        hostSender: s.isHost,
        messageType,
        text
      });
      return;
    }
    try {
      await firebaseClient.sendRoomMessage({
        roomCode: s.roomCode,
        senderName: s.localNickname || this.currentUserName,
        avatarColor: s.localAvatarColor || 'INDIGO',
        hostSender: s.isHost,
        messageType,
        text
      });
    } catch (err) {
      this.toast(err.message, 'error');
    }
  }

  async leaveLiveRoom() {
    const s = this.roomSession;
    this._clearRoomUnsubs();
    this._roomClockKey = '';
    this._roomClockStartedMs = 0;
    this._lastRoomPhaseKey = '';
    this.roomSession = null;
    this.emit('change');
    if (s?.isHost && s.roomCode) {
      if (s.mode === 'LOCAL') {
        nearbySync.closeLocalQuizRoom(s.roomCode);
      } else {
        try {
          await firebaseClient.deleteQuizRoom(s.roomCode);
        } catch (_) {}
      }
      this.toast('Quiz room closed — all players removed.');
    }
  }

  // --- Team Chat & Nearby Squad ---

  selectTeam(teamId) {
    this.selectedTeamId = teamId;
    if (this.isOfflineMode) {
      this.chatMessages = this.offlineStore.loadMessagesMap()[teamId] || [];
      this.emit('change');
    } else {
      this._observeTeamChatOnline(teamId);
      this.emit('change');
    }
  }

  async createTeam({ name, cefrLevel, motto, accentColor, isTeacherHub = false }) {
    if (this.isOfflineMode) {
      const { team, teams } = this.offlineStore.createTeam({ name, cefrLevel, motto, accentColor, isTeacherHub });
      this.teams = teams;
      this.profile = this.offlineStore.loadProfile();
      this.selectedTeamId = team.id;
      this.chatMessages = this.offlineStore.loadMessagesMap()[team.id] || [];
      this.emit('change');
      this.toast(`Created team "${team.name}"!`);
      return team;
    }
    const id = await firebaseClient.createTeam({
      name,
      cefrLevel,
      motto,
      accentColor,
      channelKind: isTeacherHub ? 'TEACHER_HUB' : 'TEAM',
      creatorName: this.currentUserName
    });
    this.selectTeam(id);
    this.toast(`Created team "${name}"!`);
    return { id };
  }

  async joinTeam(team) {
    if (this.isOfflineMode) {
      this.teams = this.offlineStore.joinTeam(team);
      this.profile = this.offlineStore.loadProfile();
      this.selectTeam(team.id);
      this.toast(`Joined "${team.name}"!`);
      return;
    }
    await firebaseClient.joinTeam(team, this.profile?.teamId || '');
    this.selectTeam(team.id);
    this.toast(`Joined "${team.name}"!`);
  }

  async sendTeamMessage(text, pinned = false) {
    const teamId = this.selectedTeamId;
    if (!teamId || !String(text || '').trim()) return;
    const team = this.teams.find((t) => t.id === teamId);
    const isLeaderOrTutor = this.isBootstrappedTutor || team?.leaderUid === this.currentUserId;

    if (this.isOfflineMode) {
      const msg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        teamId,
        senderUid: this.currentUserId,
        senderName: this.currentUserName,
        senderTeamName: this.profile?.teamName || '',
        senderRole: isLeaderOrTutor ? 'TEACHER' : 'PLAYER',
        text: String(text).trim().slice(0, 500),
        pinned: Boolean(pinned && isLeaderOrTutor),
        createdAtMs: Date.now()
      };
      this.offlineStore.appendMessage(msg);
      this.chatMessages = this.offlineStore.loadMessagesMap()[teamId] || [];
      if (this.nearbySnapshot.hostingSquadId === teamId || this.nearbySnapshot.squads.some((s) => s.id === teamId)) {
        nearbySync.sendSquadMessage(msg);
      }
      this.emit('change');
      return;
    }

    await firebaseClient.sendTeamMessage({
      teamId,
      senderName: this.currentUserName,
      senderTeamName: this.profile?.teamName || '',
      senderRole: isLeaderOrTutor ? 'TEACHER' : 'PLAYER',
      text,
      pinned: Boolean(pinned && isLeaderOrTutor)
    });
  }

  async toggleTeamMessagePin(messageId, pinned) {
    const teamId = this.selectedTeamId;
    if (!teamId) return;
    if (this.isOfflineMode) {
      this.offlineStore.toggleMessagePin(teamId, messageId, pinned);
      this.chatMessages = this.offlineStore.loadMessagesMap()[teamId] || [];
      this.emit('change');
      return;
    }
    await firebaseClient.toggleMessagePin(teamId, messageId, pinned);
  }

  async deleteTeamMessage(messageId) {
    const teamId = this.selectedTeamId;
    if (!teamId) return;
    if (this.isOfflineMode) {
      this.offlineStore.deleteMessage(teamId, messageId);
      this.chatMessages = this.offlineStore.loadMessagesMap()[teamId] || [];
      this.emit('change');
      return;
    }
    await firebaseClient.deleteTeamMessage(teamId, messageId);
  }

  hostNearbySquad() {
    const team = this.teams.find((t) => t.id === this.selectedTeamId) || this.teams[0];
    if (!team) return;
    nearbySync.hostSquad({ team, hostName: this.currentUserName });
    this.nearbySnapshot = nearbySync.getSnapshot();
    this.emit('change');
    this.toast(`Nearby Squad "${team.name}" is broadcasting to other open tabs!`);
  }

  stopNearbySquad() {
    nearbySync.stopHostingSquad();
    this.nearbySnapshot = nearbySync.getSnapshot();
    this.emit('change');
    this.toast('Stopped nearby squad host.');
  }

  joinNearbySquad(squad) {
    this.teams = this.offlineStore.upsertTeam(squad, true);
    this.profile = this.offlineStore.loadProfile();
    this.selectTeam(squad.id);
    this.toast(`Connected to nearby squad "${squad.name}"!`);
  }

  // --- Tutor Connection & Inspection ---

  async connectToTutor(tutorUid, tutorLabel) {
    if (this.isOfflineMode) {
      this.toast('Sign in with Google first to link your progress to a Tutor.', 'error');
      return;
    }
    await firebaseClient.connectToTutor({
      tutorUid,
      tutorLabel,
      profile: this.profile,
      decksCount: this.customDecks.length,
      recentSessions: this.sessionHistory
    });
    this.toast(`Connected to tutor ${tutorLabel || tutorUid}!`);
  }

  async disconnectFromTutor() {
    if (this.isOfflineMode) return;
    await firebaseClient.disconnectFromTutor(this.profile?.tutorUid || '');
    this.toast('Disconnected from tutor.');
  }

  async syncTutorNow() {
    if (this.isOfflineMode) return;
    await this._syncTutorIfLinked();
    this.toast('Synced latest progress to your tutor!');
  }

  async inspectStudentDetail(studentUid) {
    if (this.isOfflineMode) return null;
    try {
      this.selectedStudentDetail = await firebaseClient.fetchStudentDetailBundle(studentUid);
      this.emit('change');
      return this.selectedStudentDetail;
    } catch (err) {
      this.toast(err.message, 'error');
      return null;
    }
  }

  // --- Kahoot-Style Team Battle Squads, Contributions & 5s Team Buzzer ---

  getDefaultBattleTeams() {
    const presets = [
      { id: 'squad_crimson', name: 'Crimson Foxes', accentColor: 'CORAL', motto: 'Fast & Fearless' },
      { id: 'squad_azure', name: 'Azure Hawks', accentColor: 'INDIGO', motto: 'Sharp Minds' },
      { id: 'squad_amber', name: 'Amber Lions', accentColor: 'AMBER', motto: 'Bold Clues' },
      { id: 'squad_mint', name: 'Mint Wolves', accentColor: 'MINT', motto: 'Team Synergy' }
    ];
    const merged = [];
    const seenIds = new Set();
    const myTeamId = this.profile?.teamId || this.selectedTeamId;

    for (const t of this.teams || []) {
      if (!t?.id || seenIds.has(t.id)) continue;
      seenIds.add(t.id);
      merged.push({
        id: t.id,
        name: t.name || 'Squad',
        accentColor: t.accentColor || 'INDIGO',
        motto: t.motto || 'Club Squad',
        memberCount: t.memberCount || 1,
        isMine: t.id === myTeamId
      });
    }
    for (const p of presets) {
      if (merged.length >= 4) break;
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      merged.push({ ...p, memberCount: 1, isMine: p.id === myTeamId });
    }
    return merged.slice(0, 4);
  }

  awardTeamContribution(
    { teamId, teamName, playerName, avatarColor, title, gameMode, points, accuracyPct = 100, cefrLevel },
    emitChange = true
  ) {
    const res = this.offlineStore.recordTeamContribution({
      teamId,
      teamName,
      playerName: playerName || this.currentUserName,
      avatarColor: avatarColor || this.profile?.avatarColor || 'INDIGO',
      title,
      gameMode,
      points,
      accuracyPct,
      cefrLevel: cefrLevel || this.profile?.learningLevel || CefrLevel.B1
    });
    this.teamContributions = res.contributions;
    this.teamScoresMap = res.teamScoresMap;
    if (emitChange) this.emit('change');
  }

  _scheduleBuzzerUnlockTimer(lockUntilMs) {
    if (this._buzzerUnlockTimer) {
      clearTimeout(this._buzzerUnlockTimer);
      this._buzzerUnlockTimer = null;
    }
    const delay = Math.max(50, lockUntilMs - Date.now());
    this._buzzerUnlockTimer = setTimeout(() => {
      this._buzzerUnlockTimer = null;
      if (this.teamBuzzer.activeBuzz && this.teamBuzzer.activeBuzz.lockUntilMs === lockUntilMs) {
        const ctx = this.teamBuzzer.contextKey;
        this.teamBuzzer = { ...this.teamBuzzer, activeBuzz: null };
        nearbySync.clearBuzzerEvent(ctx);
        audioService.playUnlock();
        this.emit('buzzer');
      }
    }, delay);
  }

  openTeamBuzzer({
    contextKey = 'global',
    title = '🚨 Team Buzzer',
    prompt = '',
    teams = null,
    sessionScores = null,
    onResolve = null
  } = {}) {
    const squadList = Array.isArray(teams) && teams.length >= 2 ? teams : this.getDefaultBattleTeams();
    const keepScores = this.teamBuzzer.contextKey === contextKey ? this.teamBuzzer.sessionScores : {};
    const nextScores = sessionScores ? { ...sessionScores } : { ...keepScores };
    squadList.forEach((t) => {
      if (typeof nextScores[t.id] !== 'number') nextScores[t.id] = 0;
    });

    const snapBuzz = nearbySync.getSnapshot().buzzer;
    let activeBuzz = this.teamBuzzer.activeBuzz;
    if (activeBuzz && Date.now() >= Number(activeBuzz.lockUntilMs || 0)) {
      activeBuzz = null;
    }
    if (!activeBuzz && snapBuzz && snapBuzz.contextKey === contextKey && Date.now() < Number(snapBuzz.lockUntilMs || 0)) {
      activeBuzz = snapBuzz;
    }
    if (activeBuzz) {
      this._scheduleBuzzerUnlockTimer(activeBuzz.lockUntilMs);
    }

    this._onBuzzResolve = typeof onResolve === 'function' ? onResolve : null;
    this.teamBuzzer = {
      ...this.teamBuzzer,
      open: true,
      contextKey,
      title,
      prompt,
      teams: squadList,
      activeBuzz,
      sessionScores: nextScores
    };
    audioService.playTransition();
    this.emit('buzzer');
  }

  closeTeamBuzzer() {
    this._onBuzzResolve = null;
    this.teamBuzzer = { ...this.teamBuzzer, open: false };
    this.emit('buzzer');
  }

  triggerTeamBuzz({ teamId, teamName, playerUid, playerName, avatarColor } = {}) {
    const now = Date.now();
    const cur = this.teamBuzzer.activeBuzz;
    if (cur && now < Number(cur.lockUntilMs || 0)) {
      return false;
    }
    const cleanTeamId = String(teamId || this.profile?.teamId || this.selectedTeamId || 'squad_crimson');
    const matchedTeam =
      (this.teamBuzzer.teams || []).find((t) => t.id === cleanTeamId) ||
      (this.teams || []).find((t) => t.id === cleanTeamId);
    const cleanTeamName = String(teamName || matchedTeam?.name || this.profile?.teamName || 'Squad');
    const cleanPlayerName = String(playerName || this.currentUserName || 'Member').slice(0, 40);
    const buzz = {
      id: `buzz_${now}_${Math.random().toString(36).slice(2, 6)}`,
      contextKey: this.teamBuzzer.contextKey || 'global',
      teamId: cleanTeamId,
      teamName: cleanTeamName,
      playerUid: playerUid || this.currentUserId,
      playerName: cleanPlayerName,
      avatarColor: avatarColor || matchedTeam?.accentColor || this.profile?.avatarColor || 'INDIGO',
      buzzedAtMs: now,
      lockUntilMs: now + 5000
    };

    this.teamBuzzer = {
      ...this.teamBuzzer,
      activeBuzz: buzz
    };
    audioService.playBuzzer();
    nearbySync.sendBuzzerEvent(buzz);
    this._scheduleBuzzerUnlockTimer(buzz.lockUntilMs);

    if (this.roomSession?.mode === 'CLOUD' && this.roomSession.roomCode) {
      const marker = `[BUZZ|${cleanTeamId.slice(0, 32)}|${cleanTeamName.slice(0, 36)}|${cleanPlayerName.slice(0, 30)}|${now}]`;
      this.sendLiveRoomMessage(marker.slice(0, 230), 'REACTION').catch(() => {});
    }

    this.emit('buzzer');
    return true;
  }

  resolveTeamBuzz({ correct, points = 100 } = {}) {
    const active = this.teamBuzzer.activeBuzz;
    if (!active) return;
    clearTimeout(this._buzzerUnlockTimer);
    this._buzzerUnlockTimer = null;

    const delta = correct ? Math.max(10, Number(points || 100)) : -25;
    const prevScore = Number(this.teamBuzzer.sessionScores[active.teamId] || 0);
    const nextScores = {
      ...this.teamBuzzer.sessionScores,
      [active.teamId]: Math.max(0, prevScore + delta)
    };
    const record = {
      ...active,
      correct: Boolean(correct),
      pointsDelta: delta,
      resolvedAtMs: Date.now()
    };

    this.teamBuzzer = {
      ...this.teamBuzzer,
      activeBuzz: null,
      sessionScores: nextScores,
      buzzHistory: [record, ...(this.teamBuzzer.buzzHistory || [])].slice(0, 12)
    };
    nearbySync.clearBuzzerEvent(this.teamBuzzer.contextKey);

    if (correct) {
      audioService.playCorrect();
      this.awardTeamContribution(
        {
          teamId: active.teamId,
          teamName: active.teamName,
          playerName: active.playerName,
          avatarColor: active.avatarColor,
          title: this.teamBuzzer.title || 'Team Buzzer',
          gameMode: 'TEAM_BUZZER',
          points: delta,
          accuracyPct: 100
        },
        false
      );
      this.toast(`⚡ ${active.teamName} +${delta} pts!`, 'badge');
    } else {
      audioService.playIncorrect();
      this.toast(`${active.teamName} missed (-25 pts). Lockout cleared!`, 'error');
    }

    if (typeof this._onBuzzResolve === 'function') {
      try {
        this._onBuzzResolve({
          buzz: active,
          correct: Boolean(correct),
          points: delta,
          sessionScores: nextScores
        });
      } catch (_) {}
    }
    this.emit('buzzer');
    this.emit('change');
  }

  resetTeamBuzzLock() {
    clearTimeout(this._buzzerUnlockTimer);
    this._buzzerUnlockTimer = null;
    const ctx = this.teamBuzzer.contextKey;
    this.teamBuzzer = { ...this.teamBuzzer, activeBuzz: null };
    nearbySync.clearBuzzerEvent(ctx);
    audioService.playUnlock();
    this.emit('buzzer');
  }

  // --- Global Cross-Room Team Leaderboard Aggregation ---

  syncActiveArcadeRoom(payload) {
    const res = nearbySync.upsertActiveArcadeRoom(payload);
    this.nearbySnapshot = nearbySync.getSnapshot();
    this.emit('team-leaderboard');
    return res;
  }

  clearActiveArcadeRoom(roomId) {
    nearbySync.removeActiveArcadeRoom(roomId);
    this.nearbySnapshot = nearbySync.getSnapshot();
    this.emit('team-leaderboard');
  }

  getGlobalTeamLeaderboard(limit = 5) {
    const avatarToSquad = {
      CORAL: 'squad_crimson',
      INDIGO: 'squad_azure',
      AMBER: 'squad_amber',
      MINT: 'squad_mint'
    };
    const clubTeams = this.teams || [];
    const battleTeams = this.getDefaultBattleTeams();
    const teamMap = new Map();
    const myTeamId = this.profile?.teamId || this.selectedTeamId || '';

    const ensureTeam = (id, fallbackMeta = {}) => {
      if (!id) return null;
      if (!teamMap.has(id)) {
        teamMap.set(id, {
          id,
          name: fallbackMeta.name || 'Squad',
          accentColor: fallbackMeta.accentColor || 'INDIGO',
          motto: fallbackMeta.motto || 'Active Squad',
          memberCount: fallbackMeta.memberCount || 1,
          clubPoints: 0,
          liveRoomPoints: 0,
          totalPoints: 0,
          activeRoomIds: new Set(),
          gamesCount: 0,
          isMine: id === myTeamId
        });
      }
      return teamMap.get(id);
    };

    [...clubTeams, ...battleTeams].forEach((t) => {
      if (!t?.id) return;
      const entry = ensureTeam(t.id, t);
      if (t.name) entry.name = t.name;
      if (t.accentColor) entry.accentColor = t.accentColor;
      if (t.motto) entry.motto = t.motto;
      entry.memberCount = Math.max(entry.memberCount || 1, Number(t.memberCount || 1));
    });

    // 1. Persisted club & contribution points + player XP
    for (const entry of teamMap.values()) {
      entry.clubPoints += Number(this.teamScoresMap?.[entry.id] || 0);
      if (entry.id === myTeamId) {
        entry.clubPoints += Number(this.profile?.xp || 0);
      }
      entry.gamesCount = (this.teamContributions || []).filter((c) => c.teamId === entry.id).length;
    }

    if (!this.isOfflineMode) {
      (this.globalScores || []).forEach((s) => {
        if (s?.teamId) {
          const entry = ensureTeam(s.teamId, { name: s.teamName || 'Club Squad', accentColor: s.avatarColor || 'INDIGO' });
          entry.clubPoints += Number(s.score || 0);
        }
      });
    }

    // 2. Active rooms aggregation
    const snap = nearbySync.getSnapshot();
    const activeRoomSummaries = [];
    const seenQuizCodes = new Set();

    // 2a. Local cross-tab Live Quiz rooms
    Object.values(snap.rooms || {}).forEach((room) => {
      if (!room?.roomCode) return;
      seenQuizCodes.add(room.roomCode);
      const roomKey = `quiz:${room.roomCode}`;
      const players = Object.values(room.players || {});
      let roomPts = 0;
      players.forEach((pl) => {
        const pts = Math.max(0, Number(pl.score || 0));
        const resolvedId = pl.teamId || avatarToSquad[pl.avatarColor] || myTeamId || 'squad_azure';
        const entry = ensureTeam(resolvedId, {
          name: pl.teamName || undefined,
          accentColor: pl.avatarColor || 'INDIGO'
        });
        if (entry) {
          entry.liveRoomPoints += pts;
          entry.activeRoomIds.add(roomKey);
        }
        roomPts += pts;
      });
      activeRoomSummaries.push({
        id: roomKey,
        kind: 'LIVE_QUIZ',
        label: `⚡ PIN ${room.roomCode}`,
        title: room.quizTitle || 'Live Quiz',
        points: roomPts
      });
    });

    // 2b. Cloud Live Quiz room currently active in this session
    if (this.roomSession?.room && !seenQuizCodes.has(this.roomSession.roomCode)) {
      const r = this.roomSession.room;
      const roomKey = `quiz:${this.roomSession.roomCode}`;
      let roomPts = 0;
      (this.roomSession.players || []).forEach((pl) => {
        const pts = Math.max(0, Number(pl.score || 0));
        const isMe = pl.playerUid === this.currentUserId;
        const resolvedId = (isMe && myTeamId) ? myTeamId : (avatarToSquad[pl.avatarColor] || 'squad_azure');
        const entry = ensureTeam(resolvedId, { accentColor: pl.avatarColor || 'INDIGO' });
        if (entry) {
          entry.liveRoomPoints += pts;
          entry.activeRoomIds.add(roomKey);
        }
        roomPts += pts;
      });
      activeRoomSummaries.push({
        id: roomKey,
        kind: 'LIVE_QUIZ',
        label: `☁️ PIN ${this.roomSession.roomCode}`,
        title: r.quizTitle || 'Cloud Live Quiz',
        points: roomPts
      });
    }

    // 2c. Active Arcade Team Play rooms across tabs
    Object.values(snap.arcadeRooms || {}).forEach((ar) => {
      if (!ar?.id) return;
      const roomKey = `arcade:${ar.id}`;
      let roomPts = 0;
      Object.entries(ar.teamScores || {}).forEach(([tid, rawPts]) => {
        const pts = Math.max(0, Number(rawPts || 0));
        const meta = ar.teamMeta?.[tid] || {};
        const entry = ensureTeam(tid, meta);
        if (entry) {
          entry.liveRoomPoints += pts;
          entry.activeRoomIds.add(roomKey);
        }
        roomPts += pts;
      });
      activeRoomSummaries.push({
        id: roomKey,
        kind: 'ARCADE',
        label: `🎮 ${ar.gameTitle || 'Arcade Match'}`,
        title: ar.activeTeamName ? `Turn: ${ar.activeTeamName}` : 'Team Play',
        points: roomPts
      });
    });

    // 2d. Active Team Buzzer session scores
    const buzzerEntries = Object.entries(this.teamBuzzer?.sessionScores || {}).filter(([, v]) => Number(v || 0) > 0);
    if (buzzerEntries.length > 0 || this.teamBuzzer?.open) {
      const buzzKey = `buzzer:${this.teamBuzzer.contextKey || 'global'}`;
      let buzzPts = 0;
      buzzerEntries.forEach(([tid, rawPts]) => {
        const pts = Math.max(0, Number(rawPts || 0));
        const meta = (this.teamBuzzer.teams || []).find((t) => t.id === tid) || {};
        const entry = ensureTeam(tid, meta);
        if (entry) {
          entry.liveRoomPoints += pts;
          entry.activeRoomIds.add(buzzKey);
        }
        buzzPts += pts;
      });
      activeRoomSummaries.push({
        id: buzzKey,
        kind: 'BUZZER',
        label: '🚨 Team Buzzer',
        title: this.teamBuzzer.title || 'Live Buzzer',
        points: buzzPts
      });
    }

    const allTeams = [...teamMap.values()]
      .map((t) => ({
        id: t.id,
        name: t.name,
        accentColor: t.accentColor,
        motto: t.motto,
        memberCount: t.memberCount,
        clubPoints: t.clubPoints,
        liveRoomPoints: t.liveRoomPoints,
        totalPoints: t.clubPoints + t.liveRoomPoints,
        activeRoomsCount: t.activeRoomIds.size,
        gamesCount: t.gamesCount,
        isMine: t.id === myTeamId
      }))
      .sort((a, b) => (b.totalPoints - a.totalPoints) || (b.liveRoomPoints - a.liveRoomPoints) || a.name.localeCompare(b.name));

    const totalAggregatedPoints = allTeams.reduce((sum, t) => sum + t.totalPoints, 0);

    return {
      topTeams: allTeams.slice(0, Math.max(1, limit)),
      allTeams,
      totalActiveRooms: activeRoomSummaries.length,
      activeRoomSummaries,
      totalAggregatedPoints
    };
  }
}

export const store = new AppStore();
