import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OperationType, auth, db, googleProvider, handleFirestoreError } from '../firebase';
import {
  CefrLevel,
  ChatMessage,
  FlashcardDeck,
  QuizPack,
  QuizQuestion,
  QuizRoom,
  RoleplayScenario,
  RoomChatMessage,
  RoomPlayer,
  RoomStatus,
  ScoreRecord,
  SessionRecord,
  Team,
  TeamMember,
  UserProfile,
  WeeklyProgressRecord,
} from '../types';
import {
  DEFAULT_CLUB_LOUNGE_ID,
  epochDayNow,
  generatePin6,
  sanitizeId,
} from '../utils/constants';

function toMillis(ts: unknown): number {
  if (!ts) return 0;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === 'number') return ts;
  return 0;
}

function mapSnapshotDoc<T extends Record<string, unknown>>(snap: DocumentSnapshot<DocumentData>): T & { id: string; createdAtMs: number; updatedAtMs: number } {
  const data = (snap.data() || {}) as Record<string, unknown>;
  return {
    ...(data as T),
    id: snap.id,
    createdAtMs: toMillis(data.createdAt) || Number(data.createdAtMs || 0),
    updatedAtMs: toMillis(data.updatedAt) || Number(data.updatedAtMs || 0),
  };
}

class FirebaseClient {
  public currentUser: User | null = null;

  init(onAuthStateChange: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      onAuthStateChange(user);
    });
  }

  getCurrentUser(): User | null {
    return auth.currentUser || this.currentUser;
  }

  isSignedIn(): boolean {
    return Boolean(this.getCurrentUser()?.uid);
  }

  requireUid(): string {
    const uid = this.getCurrentUser()?.uid;
    if (!uid) throw new Error('Sign in with Google to use cloud features.');
    return uid;
  }

  async signInWithGoogle(): Promise<User> {
    const cred = await signInWithPopup(auth, googleProvider);
    this.currentUser = cred.user;
    return cred.user;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
    this.currentUser = null;
  }

  async ensureUserProfile(displayName?: string): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}`;
    const ref = doc(db, 'users', uid);
    try {
      const snap = await getDoc(ref);
      const today = Math.max(1, Math.min(100000, epochDayNow()));
      const safeName = String(displayName || 'Lingo Member').trim().slice(0, 50) || 'Lingo Member';

      if (!snap.exists()) {
        await setDoc(ref, {
          userId: uid,
          displayName: safeName,
          learningLevel: CefrLevel.B2,
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
          lastActiveEpochDay: today,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const d = snap.data() || {};
        const patch: Record<string, unknown> = {};
        if (!d.learningLevel) patch.learningLevel = CefrLevel.B2;
        if (d.quizzesPlayed == null) patch.quizzesPlayed = 0;
        if (d.sessionsCompleted == null) patch.sessionsCompleted = 0;
        if (d.audiobooksFinished == null) patch.audiobooksFinished = 0;
        if (d.weeklyWordsMastered == null) patch.weeklyWordsMastered = 0;
        if (d.bestLiveQuizScore == null) patch.bestLiveQuizScore = 0;
        if (!Array.isArray(d.earnedBadges)) patch.earnedBadges = [];
        if (!Array.isArray(d.pinnedEvidenceIds)) patch.pinnedEvidenceIds = [];
        if (d.teamId == null) patch.teamId = '';
        if (d.teamName == null) patch.teamName = '';
        if (typeof d.sfxMuted !== 'boolean') patch.sfxMuted = false;
        if (typeof d.sfxVolume !== 'number') patch.sfxVolume = 85;

        const lastDay = Number(d.lastActiveEpochDay || 0);
        const curStreak = Number(d.streak || 1);
        if (lastDay === 0) {
          patch.lastActiveEpochDay = today;
        } else if (today === lastDay + 1) {
          patch.streak = Math.min(curStreak + 1, 10000);
          patch.lastActiveEpochDay = today;
        } else if (today > lastDay + 1) {
          patch.streak = 1;
          patch.lastActiveEpochDay = today;
        }

        if (Object.keys(patch).length > 0) {
          patch.updatedAt = serverTimestamp();
          await updateDoc(ref, patch);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  observeUserProfile(
    uid: string,
    onData: (profile: UserProfile | null) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = `users/${uid}`;
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => onData(snap.exists() ? mapSnapshotDoc<UserProfile & Record<string, unknown>>(snap) : null),
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.GET, path);
      }
    );
  }

  async updateLearningLevel(level: CefrLevel | string): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), {
        learningLevel: level,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async updateSoundPreferences({
    sfxMuted,
    sfxVolume,
  }: {
    sfxMuted?: boolean;
    sfxVolume?: number;
  }): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}`;
    const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (typeof sfxMuted === 'boolean') updates.sfxMuted = sfxMuted;
    if (typeof sfxVolume === 'number' && Number.isFinite(sfxVolume)) {
      updates.sfxVolume = Math.max(0, Math.min(100, Math.round(sfxVolume)));
    }
    try {
      await updateDoc(doc(db, 'users', uid), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async awardProgress({
    xpDelta = 0,
    quizzesHostedDelta = 0,
    quizzesPlayedDelta = 0,
    cardsMasteredDelta = 0,
    sessionsCompletedDelta = 0,
    audiobooksFinishedDelta = 0,
    weeklyWordsMasteredDelta = 0,
    bestLiveQuizScoreCandidate = 0,
    newEarnedBadgeIds = [],
  }: {
    xpDelta?: number;
    quizzesHostedDelta?: number;
    quizzesPlayedDelta?: number;
    cardsMasteredDelta?: number;
    sessionsCompletedDelta?: number;
    audiobooksFinishedDelta?: number;
    weeklyWordsMasteredDelta?: number;
    bestLiveQuizScoreCandidate?: number;
    newEarnedBadgeIds?: string[];
  }): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}`;
    const ref = doc(db, 'users', uid);
    try {
      const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (xpDelta > 0) updates.xp = increment(xpDelta);
      if (quizzesHostedDelta > 0) updates.quizzesHosted = increment(quizzesHostedDelta);
      if (quizzesPlayedDelta > 0) updates.quizzesPlayed = increment(quizzesPlayedDelta);
      if (cardsMasteredDelta !== 0) updates.cardsMastered = increment(cardsMasteredDelta);
      if (sessionsCompletedDelta > 0) updates.sessionsCompleted = increment(sessionsCompletedDelta);
      if (audiobooksFinishedDelta > 0) updates.audiobooksFinished = increment(audiobooksFinishedDelta);
      if (weeklyWordsMasteredDelta !== 0) updates.weeklyWordsMastered = increment(weeklyWordsMasteredDelta);
      if (bestLiveQuizScoreCandidate > 0) {
        const snap = await getDoc(ref);
        const curBest = Number(snap.data()?.bestLiveQuizScore || 0);
        const bounded = Math.min(Math.max(0, bestLiveQuizScoreCandidate), 500000);
        if (bounded > curBest) updates.bestLiveQuizScore = bounded;
      }
      if (newEarnedBadgeIds.length > 0) {
        updates.earnedBadges = arrayUnion(...newEarnedBadgeIds);
      }
      await updateDoc(ref, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async togglePinEvidence(cardId: string, pinned: boolean): Promise<void> {
    const uid = this.requireUid();
    const cleanId = String(cardId || '').trim().slice(0, 80);
    if (!cleanId) return;
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), {
        pinnedEvidenceIds: pinned ? arrayUnion(cleanId) : arrayRemove(cleanId),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  observeSessionHistory(
    uid: string,
    onData: (sessions: SessionRecord[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = `users/${uid}/session_history`;
    return onSnapshot(
      collection(db, 'users', uid, 'session_history'),
      (snap) => {
        const list = snap.docs
          .map((d) => mapSnapshotDoc<SessionRecord & Record<string, unknown>>(d))
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        onData(list);
      },
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async logSessionRecord({
    activityType,
    title,
    cefrLevel,
    score,
    accuracyPct,
    wordsPracticed,
    durationMinutes,
  }: SessionRecord): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}/session_history`;
    try {
      await addDoc(collection(db, 'users', uid, 'session_history'), {
        activityType,
        title: String(title || activityType).trim().slice(0, 100) || activityType,
        cefrLevel,
        score: Math.min(Math.max(0, Math.round(score)), 500000),
        accuracyPct: Math.min(Math.max(0, Math.round(accuracyPct)), 100),
        wordsPracticed: Math.min(Math.max(0, Math.round(wordsPracticed)), 200),
        durationMinutes: Math.min(Math.max(0, Math.round(durationMinutes)), 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  observeWeeklyProgress(
    uid: string,
    onData: (map: Record<string, WeeklyProgressRecord>) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = `users/${uid}/weekly_progress`;
    return onSnapshot(
      collection(db, 'users', uid, 'weekly_progress'),
      (snap) => {
        const out: Record<string, WeeklyProgressRecord> = {};
        snap.docs.forEach((d) => {
          const item = mapSnapshotDoc<WeeklyProgressRecord & Record<string, unknown>>(d);
          out[String(Number(item.weekNumber))] = item;
        });
        onData(out);
      },
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async updateWeeklyWordMastery(weekNumber: number, masteredWordIds: string[]): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}/weekly_progress/week_${weekNumber}`;
    const ref = doc(db, 'users', uid, 'weekly_progress', `week_${weekNumber}`);
    const cleanIds = [...new Set(masteredWordIds)].slice(0, 200);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          masteredWordIds: cleanIds,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          weekNumber,
          masteredWordIds: cleanIds,
          completedSessions: [],
          gamesPlayed: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async markWeeklySessionComplete(
    weekNumber: number,
    sessionNumber: number,
    incrementGames = false
  ): Promise<boolean> {
    const uid = this.requireUid();
    const path = `users/${uid}/weekly_progress/week_${weekNumber}`;
    const ref = doc(db, 'users', uid, 'weekly_progress', `week_${weekNumber}`);
    try {
      const snap = await getDoc(ref);
      const cur: number[] = snap.exists() ? (snap.data()?.completedSessions || []).map(Number) : [];
      const newlyCompleted = !cur.includes(sessionNumber);
      const next = [...new Set([...cur, sessionNumber])].sort((a, b) => a - b).slice(0, 3);
      if (snap.exists()) {
        const updates: Record<string, unknown> = {
          completedSessions: next,
          updatedAt: serverTimestamp(),
        };
        if (incrementGames) updates.gamesPlayed = increment(1);
        await updateDoc(ref, updates);
      } else {
        await setDoc(ref, {
          weekNumber,
          masteredWordIds: [],
          completedSessions: next,
          gamesPlayed: incrementGames ? 1 : 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return newlyCompleted;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  }

  async recordWeeklyGamePlayed(weekNumber: number): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}/weekly_progress/week_${weekNumber}`;
    const ref = doc(db, 'users', uid, 'weekly_progress', `week_${weekNumber}`);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          gamesPlayed: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          weekNumber,
          masteredWordIds: [],
          completedSessions: [],
          gamesPlayed: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  observeCustomRoleplays(
    uid: string,
    onData: (items: RoleplayScenario[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = `users/${uid}/custom_roleplays`;
    return onSnapshot(
      collection(db, 'users', uid, 'custom_roleplays'),
      (snap) =>
        onData(
          snap.docs
            .map((d) => mapSnapshotDoc<RoleplayScenario & Record<string, unknown>>(d))
            .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
        ),
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async saveCustomRoleplay(rp: Omit<RoleplayScenario, 'id'>): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}/custom_roleplays`;
    try {
      await addDoc(collection(db, 'users', uid, 'custom_roleplays'), {
        title: String(rp.title || 'Custom Scene').trim().slice(0, 80),
        setting: String(rp.setting || 'Interactive Stage').trim().slice(0, 160),
        cefrLevel: rp.cefrLevel,
        roleAName: String(rp.roleAName || 'Speaker A').trim().slice(0, 40),
        roleBName: String(rp.roleBName || 'Speaker B').trim().slice(0, 40),
        goal: String(rp.goal || 'Practice English together.').trim().slice(0, 200),
        source: rp.source === 'AI' ? 'AI' : 'OFFLINE',
        lines: (rp.lines || []).slice(0, 20),
        plotTwists: (rp.plotTwists || []).slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async deleteCustomRoleplay(roleplayId: string): Promise<void> {
    const uid = this.requireUid();
    const clean = sanitizeId(roleplayId);
    const path = `users/${uid}/custom_roleplays/${clean}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'custom_roleplays', clean));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  observeCustomQuizzes(
    uid: string,
    onData: (quizzes: QuizPack[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = `users/${uid}/custom_quizzes`;
    return onSnapshot(
      collection(db, 'users', uid, 'custom_quizzes'),
      (snap) =>
        onData(
          snap.docs
            .map((d) => mapSnapshotDoc<QuizPack & Record<string, unknown>>(d))
            .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
        ),
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async saveCustomQuiz({
    title,
    topic,
    cefrLevel,
    questions,
  }: {
    title: string;
    topic: string;
    cefrLevel: CefrLevel | string;
    questions: QuizQuestion[];
  }): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}/custom_quizzes`;
    try {
      await addDoc(collection(db, 'users', uid, 'custom_quizzes'), {
        title: String(title || 'Custom Quiz').trim().slice(0, 80),
        topic: String(topic || 'English').trim().slice(0, 40) || 'English',
        cefrLevel,
        questions: (questions || []).slice(0, 20),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async deleteCustomQuiz(quizId: string): Promise<void> {
    const uid = this.requireUid();
    const clean = sanitizeId(quizId);
    const path = `users/${uid}/custom_quizzes/${clean}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'custom_quizzes', clean));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  observeCustomDecks(
    uid: string,
    onData: (decks: FlashcardDeck[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = `users/${uid}/custom_decks`;
    return onSnapshot(
      collection(db, 'users', uid, 'custom_decks'),
      (snap) =>
        onData(
          snap.docs
            .map((d) => mapSnapshotDoc<FlashcardDeck & Record<string, unknown>>(d))
            .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
        ),
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async saveCustomDeck({ title, cefrLevel, cards }: Omit<FlashcardDeck, 'id'>): Promise<void> {
    const uid = this.requireUid();
    const path = `users/${uid}/custom_decks`;
    try {
      await addDoc(collection(db, 'users', uid, 'custom_decks'), {
        title: String(title || 'My Deck').trim().slice(0, 80),
        cefrLevel,
        cards: (cards || []).slice(0, 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async updateCustomDeck(deckId: string, { title, cefrLevel, cards }: Omit<FlashcardDeck, 'id'>): Promise<void> {
    const uid = this.requireUid();
    const clean = sanitizeId(deckId);
    const path = `users/${uid}/custom_decks/${clean}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'custom_decks', clean), {
        title: String(title || 'My Deck').trim().slice(0, 80),
        cefrLevel,
        cards: (cards || []).slice(0, 40),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async deleteCustomDeck(deckId: string): Promise<void> {
    const uid = this.requireUid();
    const clean = sanitizeId(deckId);
    const path = `users/${uid}/custom_decks/${clean}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'custom_decks', clean));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Live Quiz Rooms (Max 60 questions, Host-Only leave notifications) ---

  async createQuizRoom({
    hostName,
    quizTitle,
    cefrLevel,
    questions,
  }: {
    hostName: string;
    quizTitle: string;
    cefrLevel: CefrLevel | string;
    questions: QuizQuestion[];
  }): Promise<string> {
    const uid = this.requireUid();
    let code = '';
    for (let i = 0; i < 5; i++) {
      const candidate = generatePin6();
      const snap = await getDoc(doc(db, 'quiz_rooms', candidate));
      if (!snap.exists()) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error('Busy quiz room codes right now. Please tap Host again.');

    const path = `quiz_rooms/${code}`;
    try {
      await setDoc(doc(db, 'quiz_rooms', code), {
        hostUid: uid,
        hostName: String(hostName || 'Host').trim().slice(0, 50) || 'Host',
        quizTitle: String(quizTitle || 'Quiz Clash').trim().slice(0, 80),
        cefrLevel,
        status: RoomStatus.LOBBY,
        currentQuestionIndex: 0,
        questionStartedAtMs: 0,
        questions: questions.slice(0, 60),
        leaderboard: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return code;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return code;
    }
  }

  observeRoom(
    roomCode: string,
    onData: (room: QuizRoom | null) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const clean = String(roomCode || '').trim().toUpperCase();
    const path = `quiz_rooms/${clean}`;
    return onSnapshot(
      doc(db, 'quiz_rooms', clean),
      (snap) => onData(snap.exists() ? ({ ...mapSnapshotDoc<QuizRoom & Record<string, unknown>>(snap), roomCode: clean }) : null),
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.GET, path);
      }
    );
  }

  async deleteQuizRoom(roomCode: string): Promise<void> {
    this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) return;
    try {
      await deleteDoc(doc(db, 'quiz_rooms', clean));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `quiz_rooms/${clean}`);
    }
  }

  observeRoomPlayers(
    roomCode: string,
    hostUid: string,
    onData: (players: RoomPlayer[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const clean = String(roomCode || '').trim().toUpperCase();
    const path = `quiz_rooms/${clean}/players`;
    const q = query(collection(db, 'quiz_rooms', clean, 'players'), where('hostUid', '==', hostUid));
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs
          .map((d) => {
            const mapped = mapSnapshotDoc<RoomPlayer & Record<string, unknown>>(d);
            return { ...mapped, uid: mapped.playerUid || mapped.id };
          })
          .sort((a, b) => (b.score || 0) - (a.score || 0));
        onData(list);
      },
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async joinRoom({
    roomCode,
    nickname,
    avatarColor,
    teamId = '',
    teamName = '',
  }: {
    roomCode: string;
    nickname: string;
    avatarColor: string;
    teamId?: string;
    teamName?: string;
  }): Promise<QuizRoom> {
    const uid = this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) {
      throw new Error('Enter a valid 6-character Room PIN.');
    }
    const roomRef = doc(db, 'quiz_rooms', clean);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      throw new Error(`No active room found for PIN ${clean}.`);
    }
    const room = { ...mapSnapshotDoc<QuizRoom & Record<string, unknown>>(roomSnap), roomCode: clean };
    if (room.status === RoomStatus.PODIUM) {
      throw new Error('This quiz round has already finished.');
    }
    const playerRef = doc(db, 'quiz_rooms', clean, 'players', uid);
    const path = `quiz_rooms/${clean}/players/${uid}`;
    const existing = await getDoc(playerRef);
    const cleanNick = String(nickname || 'Friend').trim().slice(0, 24) || 'Friend';
    const cleanColor = String(avatarColor || 'INDIGO').slice(0, 20);
    const cleanTeamId = String(teamId || '').trim().slice(0, 60);
    const cleanTeamName = String(teamName || '').trim().slice(0, 50);

    try {
      if (!existing.exists()) {
        await setDoc(playerRef, {
          playerUid: uid,
          roomCode: clean,
          hostUid: room.hostUid,
          nickname: cleanNick,
          avatarColor: cleanColor,
          teamId: cleanTeamId,
          teamName: cleanTeamName,
          score: 0,
          streak: 0,
          lastAnswerIndex: -1,
          lastAnsweredQuestion: -1,
          lastAnswerCorrect: false,
          lastPointsEarned: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(playerRef, {
          nickname: cleanNick,
          avatarColor: cleanColor,
          teamId: cleanTeamId,
          teamName: cleanTeamName,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    return room;
  }

  async submitRoomAnswer({
    roomCode,
    questionIndex,
    selectedIndex,
    correct,
    pointsEarned,
    newScore,
    newStreak,
  }: {
    roomCode: string;
    questionIndex: number;
    selectedIndex: number;
    correct: boolean;
    pointsEarned: number;
    newScore: number;
    newStreak: number;
  }): Promise<void> {
    const uid = this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    const path = `quiz_rooms/${clean}/players/${uid}`;
    try {
      await updateDoc(doc(db, 'quiz_rooms', clean, 'players', uid), {
        score: Math.min(Math.max(0, newScore), 500000),
        streak: Math.min(Math.max(0, newStreak), 50),
        lastAnswerIndex: selectedIndex,
        lastAnsweredQuestion: questionIndex,
        lastAnswerCorrect: Boolean(correct),
        lastPointsEarned: Math.min(Math.max(0, pointsEarned), 2000),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async advanceRoomPhase({
    roomCode,
    newStatus,
    questionIndex,
    questionStartedAtMs,
    leaderboard,
  }: {
    roomCode: string;
    newStatus: RoomStatus | string;
    questionIndex: number;
    questionStartedAtMs: number;
    leaderboard: RoomPlayer[];
  }): Promise<void> {
    this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    const path = `quiz_rooms/${clean}`;
    try {
      await updateDoc(doc(db, 'quiz_rooms', clean), {
        status: newStatus,
        currentQuestionIndex: questionIndex,
        questionStartedAtMs,
        leaderboard: (leaderboard || []).slice(0, 25),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  observeRoomMessages(
    roomCode: string,
    onData: (messages: RoomChatMessage[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const clean = String(roomCode || '').trim().toUpperCase();
    const path = `quiz_rooms/${clean}/messages`;
    const q = query(collection(db, 'quiz_rooms', clean, 'messages'), where('roomCode', '==', clean));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapSnapshotDoc<RoomChatMessage & Record<string, unknown>>(d))
          .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
        onData(list);
      },
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async sendRoomMessage({
    roomCode,
    senderName,
    avatarColor,
    hostSender,
    messageType,
    text,
  }: {
    roomCode: string;
    senderName: string;
    avatarColor: string;
    hostSender: boolean;
    messageType: 'TEXT' | 'REACTION';
    text: string;
  }): Promise<void> {
    const uid = this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    const cleanText = String(text || '').trim().slice(0, 240);
    if (!cleanText) return;
    const path = `quiz_rooms/${clean}/messages`;
    try {
      await addDoc(collection(db, 'quiz_rooms', clean, 'messages'), {
        roomCode: clean,
        senderUid: uid,
        senderName: String(senderName || 'Player').trim().slice(0, 50) || 'Player',
        avatarColor: String(avatarColor || 'INDIGO').slice(0, 20),
        hostSender: Boolean(hostSender),
        messageType: messageType === 'REACTION' ? 'REACTION' : 'TEXT',
        text: cleanText,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async deleteRoomMessage(roomCode: string, messageId: string): Promise<void> {
    this.requireUid();
    const cleanCode = String(roomCode).trim().toUpperCase();
    const cleanId = sanitizeId(messageId);
    try {
      await deleteDoc(doc(db, 'quiz_rooms', cleanCode, 'messages', cleanId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `quiz_rooms/${cleanCode}/messages/${cleanId}`);
    }
  }

  /**
   * Removes player doc silently without posting a public [LEAVE|...] chat message,
   * so only the host's roster diff displays a floating departure alert.
   */
  async leaveRoomPlayer({ roomCode }: { roomCode: string }): Promise<void> {
    const uid = this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) return;
    try {
      await deleteDoc(doc(db, 'quiz_rooms', clean, 'players', uid));
    } catch {
      // Ignore cleanup failure if room already closed
    }
  }

  async kickRoomPlayer(roomCode: string, playerUid: string): Promise<void> {
    this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    const target = sanitizeId(playerUid);
    if (!/^[A-Z0-9]{6}$/.test(clean)) return;
    try {
      await deleteDoc(doc(db, 'quiz_rooms', clean, 'players', target));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `quiz_rooms/${clean}/players/${target}`);
    }
  }

  // --- Team & Club Chat ---

  observeTeams(onData: (teams: Team[]) => void, onError?: (err: unknown) => void): () => void {
    const q = query(collection(db, 'teams'), where('visibility', '==', 'CLUB'));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapSnapshotDoc<Team & Record<string, unknown>>(d))
          .sort((a, b) => {
            const clubDiff = (b.channelKind === 'CLUB' ? 1 : 0) - (a.channelKind === 'CLUB' ? 1 : 0);
            if (clubDiff !== 0) return clubDiff;
            return (b.memberCount || 0) - (a.memberCount || 0);
          });
        onData(list);
      },
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, 'teams');
      }
    );
  }

  async ensureDefaultClubLounge(displayName = 'Club Lounge'): Promise<void> {
    const uid = this.requireUid();
    const hubRef = doc(db, 'teams', DEFAULT_CLUB_LOUNGE_ID);
    try {
      const snap = await getDoc(hubRef);
      if (!snap.exists()) {
        await setDoc(hubRef, {
          visibility: 'CLUB',
          name: 'Club Lounge — All Players',
          cefrLevel: CefrLevel.B1,
          motto: 'Party rooms, word challenges, stickers & hangout chat!',
          accentColor: 'INDIGO',
          leaderUid: uid,
          leaderName: String(displayName || 'Club Host').trim().slice(0, 50) || 'Club Host',
          channelKind: 'CLUB',
          memberCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teams/${DEFAULT_CLUB_LOUNGE_ID}`);
    }
  }

  async createTeam({
    name,
    cefrLevel,
    motto,
    accentColor,
    creatorName,
  }: {
    name: string;
    cefrLevel: CefrLevel | string;
    motto: string;
    accentColor: string;
    creatorName: string;
  }): Promise<string> {
    const uid = this.requireUid();
    const cleanName = String(name || '').trim().slice(0, 50);
    if (cleanName.length < 2) throw new Error('Team or club name must be at least 2 characters.');
    const allowedColors = ['INDIGO', 'CORAL', 'AMBER', 'MINT', 'PURPLE'];
    const color = allowedColors.includes(accentColor) ? accentColor : 'INDIGO';
    try {
      const docRef = await addDoc(collection(db, 'teams'), {
        visibility: 'CLUB',
        name: cleanName,
        cefrLevel,
        motto: String(motto || '').trim().slice(0, 120),
        accentColor: color,
        leaderUid: uid,
        leaderName: String(creatorName || 'Squad Lead').trim().slice(0, 50) || 'Squad Lead',
        channelKind: 'TEAM',
        memberCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'teams', docRef.id, 'members', sanitizeId(uid)), {
        teamId: docRef.id,
        displayName: String(creatorName || 'Squad Lead').trim().slice(0, 40) || 'Squad Lead',
        avatarColor: color,
        role: 'CAPTAIN',
        memberUid: uid,
        addedByUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', uid), {
        teamId: docRef.id,
        teamName: cleanName,
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'teams');
      throw err;
    }
  }

  async joinTeam(team: Team, previousTeamId?: string): Promise<void> {
    const uid = this.requireUid();
    if (!team?.id || previousTeamId === team.id) return;
    try {
      const targetRef = doc(db, 'teams', team.id);
      const snap = await getDoc(targetRef);
      const curCount = Number(snap.data()?.memberCount || team.memberCount || 0);
      await updateDoc(targetRef, {
        memberCount: Math.min(curCount + 1, 10000),
        updatedAt: serverTimestamp(),
      });
      if (previousTeamId) {
        try {
          const prevRef = doc(db, 'teams', previousTeamId);
          const prevSnap = await getDoc(prevRef);
          if (prevSnap.exists()) {
            const prevCount = Number(prevSnap.data()?.memberCount || 1);
            if (prevCount > 0) {
              await updateDoc(prevRef, {
                memberCount: Math.max(prevCount - 1, 0),
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch {
          // Ignore old team decrement cleanup
        }
      }
      await updateDoc(doc(db, 'users', uid), {
        teamId: team.id,
        teamName: String(team.name || '').slice(0, 50),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${team.id}`);
    }
  }

  async leaveTeam(teamId?: string): Promise<void> {
    const uid = this.requireUid();
    if (teamId) {
      try {
        const teamRef = doc(db, 'teams', teamId);
        const snap = await getDoc(teamRef);
        if (snap.exists()) {
          const curCount = Number(snap.data()?.memberCount || 0);
          if (curCount > 0) {
            await updateDoc(teamRef, {
              memberCount: Math.max(curCount - 1, 0),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch {
        // Ignore cleanup
      }
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        teamId: '',
        teamName: '',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  }

  observeTeamMessages(
    teamId: string,
    onData: (messages: ChatMessage[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const cleanId = sanitizeId(teamId);
    const path = `teams/${cleanId}/messages`;
    const q = query(collection(db, 'teams', cleanId, 'messages'), where('teamId', '==', cleanId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapSnapshotDoc<ChatMessage & Record<string, unknown>>(d))
          .sort((a, b) => {
            if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
            return (a.createdAtMs || 0) - (b.createdAtMs || 0);
          });
        onData(list);
      },
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async sendTeamMessage({
    teamId,
    senderName,
    senderTeamName,
    text,
    pinned = false,
  }: {
    teamId: string;
    senderName: string;
    senderTeamName: string;
    text: string;
    pinned?: boolean;
  }): Promise<void> {
    const uid = this.requireUid();
    const cleanId = sanitizeId(teamId);
    const cleanText = String(text || '').trim().slice(0, 500);
    if (!cleanText) return;
    try {
      await addDoc(collection(db, 'teams', cleanId, 'messages'), {
        teamId: cleanId,
        senderUid: uid,
        senderName: String(senderName || 'Member').trim().slice(0, 50) || 'Member',
        senderTeamName: String(senderTeamName || '').trim().slice(0, 50),
        senderRole: 'PLAYER',
        text: cleanText,
        pinned: Boolean(pinned),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `teams/${cleanId}/messages`);
    }
  }

  async toggleMessagePin(teamId: string, messageId: string, pinned: boolean): Promise<void> {
    this.requireUid();
    const cleanTeam = sanitizeId(teamId);
    const cleanMsg = sanitizeId(messageId);
    try {
      await updateDoc(doc(db, 'teams', cleanTeam, 'messages', cleanMsg), {
        pinned: Boolean(pinned),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teams/${cleanTeam}/messages/${cleanMsg}`);
    }
  }

  async deleteTeamMessage(teamId: string, messageId: string): Promise<void> {
    this.requireUid();
    const cleanTeam = sanitizeId(teamId);
    const cleanMsg = sanitizeId(messageId);
    try {
      await deleteDoc(doc(db, 'teams', cleanTeam, 'messages', cleanMsg));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teams/${cleanTeam}/messages/${cleanMsg}`);
    }
  }

  observeTeamMembers(
    teamId: string,
    onData: (members: TeamMember[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const cleanId = sanitizeId(teamId);
    const path = `teams/${cleanId}/members`;
    const q = query(collection(db, 'teams', cleanId, 'members'), where('teamId', '==', cleanId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => mapSnapshotDoc<TeamMember & Record<string, unknown>>(d))
          .sort((a, b) => {
            if (a.role !== b.role) return a.role === 'CAPTAIN' ? -1 : 1;
            return (a.createdAtMs || 0) - (b.createdAtMs || 0);
          });
        onData(list);
      },
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  }

  async addTeamPlayer({
    teamId,
    displayName,
    avatarColor = 'INDIGO',
    role = 'PLAYER',
    memberUid = '',
  }: {
    teamId: string;
    displayName: string;
    avatarColor?: string;
    role?: 'CAPTAIN' | 'PLAYER';
    memberUid?: string;
  }): Promise<string> {
    const uid = this.requireUid();
    const cleanTeam = sanitizeId(teamId);
    const cleanName = String(displayName || '').trim().slice(0, 40);
    if (!cleanName) throw new Error('Player name is required.');
    const allowedColors = ['INDIGO', 'CORAL', 'AMBER', 'MINT', 'BLUE', 'PURPLE'];
    const color = allowedColors.includes(avatarColor.toUpperCase()) ? avatarColor.toUpperCase() : 'INDIGO';
    const memberId = memberUid
      ? sanitizeId(memberUid)
      : sanitizeId(`p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);
    const path = `teams/${cleanTeam}/members/${memberId}`;
    try {
      const teamRef = doc(db, 'teams', cleanTeam);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) throw new Error('Squad does not exist.');
      const curCount = Number(teamSnap.data()?.memberCount || 0);
      await setDoc(doc(db, 'teams', cleanTeam, 'members', memberId), {
        teamId: cleanTeam,
        displayName: cleanName,
        avatarColor: color,
        role: role === 'CAPTAIN' ? 'CAPTAIN' : 'PLAYER',
        memberUid: String(memberUid || '').slice(0, 128),
        addedByUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(teamRef, {
        memberCount: Math.min(curCount + 1, 10000),
        updatedAt: serverTimestamp(),
      });
      return memberId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  }

  async removeTeamPlayer(teamId: string, memberId: string): Promise<void> {
    this.requireUid();
    const cleanTeam = sanitizeId(teamId);
    const cleanMember = sanitizeId(memberId);
    const path = `teams/${cleanTeam}/members/${cleanMember}`;
    try {
      await deleteDoc(doc(db, 'teams', cleanTeam, 'members', cleanMember));
      const teamRef = doc(db, 'teams', cleanTeam);
      const teamSnap = await getDoc(teamRef);
      if (teamSnap.exists()) {
        const curCount = Number(teamSnap.data()?.memberCount || 1);
        if (curCount > 0) {
          await updateDoc(teamRef, {
            memberCount: Math.max(curCount - 1, 0),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Global Scores ---

  observeGlobalScores(onData: (scores: ScoreRecord[]) => void, onError?: (err: unknown) => void): () => void {
    const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snap) => onData(snap.docs.map((d) => mapSnapshotDoc<ScoreRecord & Record<string, unknown>>(d))),
      (err) => {
        if (onError) onError(err);
        else handleFirestoreError(err, OperationType.LIST, 'scores');
      }
    );
  }

  async publishScoreRecord({
    quizTitle,
    cefrLevel,
    score,
    accuracyPct,
    streak,
    gameMode = 'LIVE_QUIZ',
    avatarColor = 'INDIGO',
    teamId = '',
    teamName = '',
  }: {
    quizTitle: string;
    cefrLevel: CefrLevel | string;
    score: number;
    accuracyPct: number;
    streak: number;
    gameMode?: string;
    avatarColor?: string;
    teamId?: string;
    teamName?: string;
  }): Promise<void> {
    const uid = this.requireUid();
    const displayName = String(this.getCurrentUser()?.displayName || 'Lingo Member').trim().slice(0, 50) || 'Lingo Member';
    const scoreId = sanitizeId(`${uid}_${gameMode}_${quizTitle}`);
    const ref = doc(db, 'scores', scoreId);
    const path = `scores/${scoreId}`;
    try {
      const snap = await getDoc(ref);
      const existingScore = Number(snap.data()?.score || 0);
      if (snap.exists() && score <= existingScore) return;
      await setDoc(ref, {
        userId: uid,
        playerName: displayName,
        avatarColor: String(avatarColor || 'INDIGO').slice(0, 24),
        teamId: String(teamId || '').slice(0, 60),
        teamName: String(teamName || '').slice(0, 50),
        quizTitle: String(quizTitle || 'Quiz Clash').slice(0, 100),
        cefrLevel,
        score: Math.min(Math.max(0, Math.round(score)), 500000),
        accuracyPct: Math.min(Math.max(0, Math.round(accuracyPct)), 100),
        streak: Math.min(Math.max(0, Math.round(streak)), 100),
        gameMode: String(gameMode || 'LIVE_QUIZ').slice(0, 40),
        createdAt: snap.exists() ? snap.data()?.createdAt || serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export const firebaseClient = new FirebaseClient();
