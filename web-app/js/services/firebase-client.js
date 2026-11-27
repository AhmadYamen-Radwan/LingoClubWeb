// Firebase Web SDK v11.4.0 ESM CDN client + strict firestore.rules parity
// Mirrors LingoRepository.kt using named Firestore database ID.

import {
  CefrLevel,
  RoomStatus,
  sanitizeId,
  epochDayNow,
  generatePin6
} from '../models.js';

const FIREBASE_APP_URL = 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
const FIREBASE_AUTH_URL = 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
const FIREBASE_FS_URL = 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCwitl80nEelaGraSfGgetwI1BZEvdaBkk',
  authDomain: 'gen-lang-client-0553529172.firebaseapp.com',
  projectId: 'gen-lang-client-0553529172',
  storageBucket: 'gen-lang-client-0553529172.firebasestorage.app',
  messagingSenderId: '428242500721',
  appId: '1:428242500721:web:lingoclubweb'
};

export const FIRESTORE_DATABASE_ID = 'ai-studio-android-lingoclu-71e68557-4bb9-459f-961e-8245a34f0a47';
export const BOOTSTRAPPED_TUTOR_EMAIL = 'radwana423@gmail.com';
export const DEFAULT_TEACHER_HUB_ID = 'hub_teacher_all';

let sdkPromise = null;
let sdk = null;

async function ensureSdk() {
  if (sdk) return sdk;
  if (!sdkPromise) {
    sdkPromise = (async () => {
      try {
        const [appMod, authMod, fsMod] = await Promise.all([
          import(FIREBASE_APP_URL),
          import(FIREBASE_AUTH_URL),
          import(FIREBASE_FS_URL)
        ]);
        const app = appMod.getApps().length
          ? appMod.getApp()
          : appMod.initializeApp(FIREBASE_CONFIG);
        const auth = authMod.getAuth(app);
        const db = fsMod.getFirestore(app, FIRESTORE_DATABASE_ID);
        sdk = {
          app,
          auth,
          db,
          authMod,
          fsMod
        };
        return sdk;
      } catch (err) {
        sdkPromise = null;
        throw new Error(
          'Firebase cloud SDK could not load (you may be offline). Use Offline Explorer or check internet connection. ' +
          (err?.message || '')
        );
      }
    })();
  }
  return sdkPromise;
}

function toEpochMs(val) {
  if (!val) return Date.now();
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.seconds === 'number') return val.seconds * 1000;
  if (typeof val === 'number') return val;
  return Date.now();
}

function mapSnapshotDoc(snap) {
  const data = snap.data({ serverTimestamps: 'estimate' }) || {};
  return {
    id: snap.id,
    ...data,
    createdAtMs: toEpochMs(data.createdAt),
    updatedAtMs: toEpochMs(data.updatedAt)
  };
}

function formatGoogleAuthError(err) {
  const code = err?.code || '';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  if (code === 'auth/unauthorized-domain') {
    return `Domain "${host}" is not authorized for Google Sign-In yet. Add "${host}" in Firebase Console → Authentication → Settings → Authorized domains, or use Offline Explorer below.`;
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return `Google Sign-In popup closed before completing. Try "Sign in with Redirect" below (recommended on mobile), or make sure "${host}" is added to Firebase Authorized domains.`;
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the Google sign-in popup. Try "Sign in with Redirect" below.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error while contacting Google Sign-In. Check your connection or use Offline Explorer.';
  }
  return err?.message || 'Google Sign-In failed.';
}

class FirebaseClient {
  constructor() {
    this._currentUser = null;
    this.lastAuthError = '';
  }

  async initAuthListener(onUserChanged) {
    try {
      const { auth, authMod } = await ensureSdk();
      try {
        const redir = await authMod.getRedirectResult(auth);
        if (redir?.user) {
          this.lastAuthError = '';
        }
      } catch (err) {
        this.lastAuthError = formatGoogleAuthError(err);
        console.warn('[FirebaseClient] Redirect sign-in error:', err?.code, err?.message);
      }
      return authMod.onAuthStateChanged(auth, (user) => {
        this._currentUser = user || null;
        if (user) this.lastAuthError = '';
        onUserChanged(this._currentUser);
      });
    } catch (err) {
      console.warn('[FirebaseClient] Auth SDK unavailable, staying offline-ready:', err);
      onUserChanged(null);
      return () => {};
    }
  }

  getCurrentUser() {
    return this._currentUser;
  }

  requireUid() {
    const uid = this._currentUser?.uid;
    if (!uid) throw new Error('Sign in with Google first to use cloud sync.');
    return uid;
  }

  isBootstrappedTutor() {
    const u = this._currentUser;
    return Boolean(
      u &&
      u.emailVerified &&
      String(u.email || '').toLowerCase() === BOOTSTRAPPED_TUTOR_EMAIL
    );
  }

  async signInWithGoogle({ preferRedirect = false } = {}) {
    const { auth, authMod } = await ensureSdk();
    this.lastAuthError = '';
    const provider = new authMod.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (preferRedirect) {
      await authMod.signInWithRedirect(auth, provider);
      return null;
    }

    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    try {
      const result = await authMod.signInWithPopup(auth, provider);
      this._currentUser = result.user;
      try { sessionStorage.removeItem('lingo_popup_fallback_used'); } catch (_) {}
      return result.user;
    } catch (err) {
      const code = err?.code || '';
      const alreadyTriedRedirect = (() => {
        try { return sessionStorage.getItem('lingo_popup_fallback_used') === '1'; } catch { return false; }
      })();

      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        (isMobile && !alreadyTriedRedirect)
      ) {
        try { sessionStorage.setItem('lingo_popup_fallback_used', '1'); } catch (_) {}
        await authMod.signInWithRedirect(auth, provider);
        return null;
      }
      throw new Error(formatGoogleAuthError(err));
    }
  }

  async signOut() {
    if (!sdk) return;
    const { auth, authMod } = sdk;
    await authMod.signOut(auth);
    this._currentUser = null;
  }

  async ensureUserProfile(displayName) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const ref = fsMod.doc(db, 'users', uid);
    const snap = await fsMod.getDoc(ref);
    const today = Math.max(1, Math.min(100000, epochDayNow()));
    const expectedRole = this.isBootstrappedTutor() ? 'TUTOR' : 'STUDENT';
    const safeName = String(displayName || 'Lingo Member').trim().slice(0, 50) || 'Lingo Member';

    if (!snap.exists()) {
      await fsMod.setDoc(ref, {
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
        accountRole: expectedRole,
        tutorUid: '',
        tutorName: '',
        lastActiveEpochDay: today,
        createdAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      });
    } else {
      const d = snap.data() || {};
      const patch = {};
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
      if (d.accountRole !== expectedRole) patch.accountRole = expectedRole;
      if (d.tutorUid == null) patch.tutorUid = '';
      if (d.tutorName == null) patch.tutorName = '';

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
        patch.updatedAt = fsMod.serverTimestamp();
        await fsMod.updateDoc(ref, patch);
      }
    }
  }

  async observeUserProfile(uid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const ref = fsMod.doc(db, 'users', uid);
    return fsMod.onSnapshot(
      ref,
      (snap) => {
        onData(snap.exists() ? mapSnapshotDoc(snap) : null);
      },
      (err) => onError?.(err)
    );
  }

  async updateLearningLevel(level) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.updateDoc(fsMod.doc(db, 'users', uid), {
      learningLevel: level,
      updatedAt: fsMod.serverTimestamp()
    });
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
    newEarnedBadgeIds = []
  }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const ref = fsMod.doc(db, 'users', uid);
    const updates = { updatedAt: fsMod.serverTimestamp() };
    if (xpDelta > 0) updates.xp = fsMod.increment(xpDelta);
    if (quizzesHostedDelta > 0) updates.quizzesHosted = fsMod.increment(quizzesHostedDelta);
    if (quizzesPlayedDelta > 0) updates.quizzesPlayed = fsMod.increment(quizzesPlayedDelta);
    if (cardsMasteredDelta !== 0) updates.cardsMastered = fsMod.increment(cardsMasteredDelta);
    if (sessionsCompletedDelta > 0) updates.sessionsCompleted = fsMod.increment(sessionsCompletedDelta);
    if (audiobooksFinishedDelta > 0) updates.audiobooksFinished = fsMod.increment(audiobooksFinishedDelta);
    if (weeklyWordsMasteredDelta !== 0) updates.weeklyWordsMastered = fsMod.increment(weeklyWordsMasteredDelta);
    if (bestLiveQuizScoreCandidate > 0) {
      const snap = await fsMod.getDoc(ref);
      const curBest = Number(snap.data()?.bestLiveQuizScore || 0);
      const bounded = Math.min(Math.max(0, bestLiveQuizScoreCandidate), 500000);
      if (bounded > curBest) updates.bestLiveQuizScore = bounded;
    }
    if (newEarnedBadgeIds.length > 0) {
      updates.earnedBadges = fsMod.arrayUnion(...newEarnedBadgeIds);
    }
    await fsMod.updateDoc(ref, updates);
  }

  async togglePinEvidence(cardId, pinned) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const cleanId = String(cardId || '').trim().slice(0, 80);
    if (!cleanId) return;
    await fsMod.updateDoc(fsMod.doc(db, 'users', uid), {
      pinnedEvidenceIds: pinned ? fsMod.arrayUnion(cleanId) : fsMod.arrayRemove(cleanId),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async observeSessionHistory(uid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const colRef = fsMod.collection(db, 'users', uid, 'session_history');
    return fsMod.onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs
          .map(mapSnapshotDoc)
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        onData(list);
      },
      (err) => onError?.(err)
    );
  }

  async logSessionRecord({
    activityType,
    title,
    cefrLevel,
    score,
    accuracyPct,
    wordsPracticed,
    durationMinutes
  }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const colRef = fsMod.collection(db, 'users', uid, 'session_history');
    await fsMod.addDoc(colRef, {
      activityType,
      title: String(title || activityType).trim().slice(0, 100) || activityType,
      cefrLevel,
      score: Math.min(Math.max(0, Math.round(score)), 500000),
      accuracyPct: Math.min(Math.max(0, Math.round(accuracyPct)), 100),
      wordsPracticed: Math.min(Math.max(0, Math.round(wordsPracticed)), 200),
      durationMinutes: Math.min(Math.max(0, Math.round(durationMinutes)), 300),
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async observeWeeklyProgress(uid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const colRef = fsMod.collection(db, 'users', uid, 'weekly_progress');
    return fsMod.onSnapshot(
      colRef,
      (snap) => {
        const out = {};
        snap.docs.forEach((d) => {
          const item = mapSnapshotDoc(d);
          out[Number(item.weekNumber)] = item;
        });
        onData(out);
      },
      (err) => onError?.(err)
    );
  }

  async updateWeeklyWordMastery(weekNumber, masteredWordIds) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const ref = fsMod.doc(db, 'users', uid, 'weekly_progress', `week_${weekNumber}`);
    const cleanIds = [...new Set(masteredWordIds)].slice(0, 200);
    const snap = await fsMod.getDoc(ref);
    if (snap.exists()) {
      await fsMod.updateDoc(ref, {
        masteredWordIds: cleanIds,
        updatedAt: fsMod.serverTimestamp()
      });
    } else {
      await fsMod.setDoc(ref, {
        weekNumber,
        masteredWordIds: cleanIds,
        completedSessions: [],
        gamesPlayed: 0,
        createdAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      });
    }
  }

  async markWeeklySessionComplete(weekNumber, sessionNumber, incrementGames = false) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const ref = fsMod.doc(db, 'users', uid, 'weekly_progress', `week_${weekNumber}`);
    const snap = await fsMod.getDoc(ref);
    const cur = snap.exists() ? (snap.data()?.completedSessions || []).map(Number) : [];
    const newlyCompleted = !cur.includes(sessionNumber);
    const next = [...new Set([...cur, sessionNumber])].sort((a, b) => a - b).slice(0, 3);
    if (snap.exists()) {
      const updates = {
        completedSessions: next,
        updatedAt: fsMod.serverTimestamp()
      };
      if (incrementGames) updates.gamesPlayed = fsMod.increment(1);
      await fsMod.updateDoc(ref, updates);
    } else {
      await fsMod.setDoc(ref, {
        weekNumber,
        masteredWordIds: [],
        completedSessions: next,
        gamesPlayed: incrementGames ? 1 : 0,
        createdAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      });
    }
    return newlyCompleted;
  }

  async recordWeeklyGamePlayed(weekNumber) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const ref = fsMod.doc(db, 'users', uid, 'weekly_progress', `week_${weekNumber}`);
    const snap = await fsMod.getDoc(ref);
    if (snap.exists()) {
      await fsMod.updateDoc(ref, {
        gamesPlayed: fsMod.increment(1),
        updatedAt: fsMod.serverTimestamp()
      });
    } else {
      await fsMod.setDoc(ref, {
        weekNumber,
        masteredWordIds: [],
        completedSessions: [],
        gamesPlayed: 1,
        createdAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      });
    }
  }

  async observeCustomRoleplays(uid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    return fsMod.onSnapshot(
      fsMod.collection(db, 'users', uid, 'custom_roleplays'),
      (snap) => onData(snap.docs.map(mapSnapshotDoc).sort((a, b) => b.createdAtMs - a.createdAtMs)),
      (err) => onError?.(err)
    );
  }

  async saveCustomRoleplay({ title, setting, cefrLevel, roleAName, roleBName, goal, source, lines, plotTwists }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.addDoc(fsMod.collection(db, 'users', uid, 'custom_roleplays'), {
      title: String(title || 'Custom Scene').trim().slice(0, 80),
      setting: String(setting || 'Interactive Stage').trim().slice(0, 160),
      cefrLevel,
      roleAName: String(roleAName || 'Speaker A').trim().slice(0, 40),
      roleBName: String(roleBName || 'Speaker B').trim().slice(0, 40),
      goal: String(goal || 'Practice English together.').trim().slice(0, 200),
      source: source === 'AI' ? 'AI' : 'OFFLINE',
      lines: lines.slice(0, 20),
      plotTwists: (plotTwists || []).slice(0, 10),
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async deleteCustomRoleplay(roleplayId) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.deleteDoc(fsMod.doc(db, 'users', uid, 'custom_roleplays', sanitizeId(roleplayId)));
  }

  async observeCustomQuizzes(uid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    return fsMod.onSnapshot(
      fsMod.collection(db, 'users', uid, 'custom_quizzes'),
      (snap) => onData(snap.docs.map(mapSnapshotDoc).sort((a, b) => b.createdAtMs - a.createdAtMs)),
      (err) => onError?.(err)
    );
  }

  async saveCustomQuiz({ title, topic, cefrLevel, questions }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.addDoc(fsMod.collection(db, 'users', uid, 'custom_quizzes'), {
      title: String(title || 'Custom Quiz').trim().slice(0, 80),
      topic: String(topic || 'English').trim().slice(0, 40) || 'English',
      cefrLevel,
      questions: questions.slice(0, 20),
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async deleteCustomQuiz(quizId) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.deleteDoc(fsMod.doc(db, 'users', uid, 'custom_quizzes', sanitizeId(quizId)));
  }

  async observeCustomDecks(uid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    return fsMod.onSnapshot(
      fsMod.collection(db, 'users', uid, 'custom_decks'),
      (snap) => onData(snap.docs.map(mapSnapshotDoc).sort((a, b) => b.createdAtMs - a.createdAtMs)),
      (err) => onError?.(err)
    );
  }

  async saveCustomDeck({ title, cefrLevel, cards }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.addDoc(fsMod.collection(db, 'users', uid, 'custom_decks'), {
      title: String(title || 'My Deck').trim().slice(0, 80),
      cefrLevel,
      cards: cards.slice(0, 40),
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async updateCustomDeck(deckId, { title, cefrLevel, cards }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.updateDoc(fsMod.doc(db, 'users', uid, 'custom_decks', sanitizeId(deckId)), {
      title: String(title || 'My Deck').trim().slice(0, 80),
      cefrLevel,
      cards: cards.slice(0, 40),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async deleteCustomDeck(deckId) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.deleteDoc(fsMod.doc(db, 'users', uid, 'custom_decks', sanitizeId(deckId)));
  }

  async observeCardMastery(uid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    return fsMod.onSnapshot(
      fsMod.collection(db, 'users', uid, 'card_mastery'),
      (snap) => {
        const out = {};
        snap.docs.forEach((d) => {
          out[d.id] = mapSnapshotDoc(d);
        });
        onData(out);
      },
      (err) => onError?.(err)
    );
  }

  async toggleCardMastery(deckId, cardIndex, mastered) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const cardKey = sanitizeId(`${deckId}_${cardIndex}`);
    const ref = fsMod.doc(db, 'users', uid, 'card_mastery', cardKey);
    const snap = await fsMod.getDoc(ref);
    if (snap.exists()) {
      await fsMod.updateDoc(ref, {
        mastered: Boolean(mastered),
        reviewCount: fsMod.increment(1),
        updatedAt: fsMod.serverTimestamp()
      });
    } else {
      await fsMod.setDoc(ref, {
        deckId: String(deckId).slice(0, 80),
        mastered: Boolean(mastered),
        reviewCount: 1,
        createdAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      });
    }
  }

  // --- Live Kahoot Rooms ---

  async createQuizRoom({ hostName, quizTitle, cefrLevel, questions }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    let code = null;
    for (let i = 0; i < 5; i++) {
      const candidate = generatePin6();
      const snap = await fsMod.getDoc(fsMod.doc(db, 'quiz_rooms', candidate));
      if (!snap.exists()) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error('Busy quiz room codes right now. Please tap Host again.');
    await fsMod.setDoc(fsMod.doc(db, 'quiz_rooms', code), {
      hostUid: uid,
      hostName: String(hostName || 'Host').trim().slice(0, 50) || 'Host',
      quizTitle: String(quizTitle || 'Quiz Clash').trim().slice(0, 80),
      cefrLevel,
      status: RoomStatus.LOBBY,
      currentQuestionIndex: 0,
      questionStartedAtMs: 0,
      questions: questions.slice(0, 20),
      leaderboard: [],
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
    return code;
  }

  async observeRoom(roomCode, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const clean = String(roomCode || '').trim().toUpperCase();
    return fsMod.onSnapshot(
      fsMod.doc(db, 'quiz_rooms', clean),
      (snap) => onData(snap.exists() ? mapSnapshotDoc(snap) : null),
      (err) => onError?.(err)
    );
  }

  async deleteQuizRoom(roomCode) {
    const { db, fsMod } = await ensureSdk();
    this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) return;
    await fsMod.deleteDoc(fsMod.doc(db, 'quiz_rooms', clean));
  }

  async observeRoomPlayers(roomCode, hostUid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const clean = String(roomCode || '').trim().toUpperCase();
    const q = fsMod.query(
      fsMod.collection(db, 'quiz_rooms', clean, 'players'),
      fsMod.where('hostUid', '==', hostUid)
    );
    return fsMod.onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(mapSnapshotDoc).sort((a, b) => (b.score || 0) - (a.score || 0));
        onData(list);
      },
      (err) => onError?.(err)
    );
  }

  async joinRoom({ roomCode, nickname, avatarColor }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) {
      throw new Error('Enter a valid 6-character Room PIN.');
    }
    const roomRef = fsMod.doc(db, 'quiz_rooms', clean);
    const roomSnap = await fsMod.getDoc(roomRef);
    if (!roomSnap.exists()) {
      throw new Error(`No active room found for PIN ${clean}.`);
    }
    const room = mapSnapshotDoc(roomSnap);
    if (room.status === RoomStatus.PODIUM) {
      throw new Error('This quiz round has already finished.');
    }
    const playerRef = fsMod.doc(db, 'quiz_rooms', clean, 'players', uid);
    const existing = await fsMod.getDoc(playerRef);
    const cleanNick = String(nickname || 'Friend').trim().slice(0, 24) || 'Friend';
    const cleanColor = String(avatarColor || 'INDIGO').slice(0, 20);
    if (!existing.exists()) {
      await fsMod.setDoc(playerRef, {
        playerUid: uid,
        roomCode: clean,
        hostUid: room.hostUid,
        nickname: cleanNick,
        avatarColor: cleanColor,
        score: 0,
        streak: 0,
        lastAnswerIndex: -1,
        lastAnsweredQuestion: -1,
        lastAnswerCorrect: false,
        lastPointsEarned: 0,
        createdAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      });
    } else {
      await fsMod.updateDoc(playerRef, {
        nickname: cleanNick,
        avatarColor: cleanColor,
        updatedAt: fsMod.serverTimestamp()
      });
    }
    return room;
  }

  async submitRoomAnswer({ roomCode, questionIndex, selectedIndex, correct, pointsEarned, newScore, newStreak }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    await fsMod.updateDoc(fsMod.doc(db, 'quiz_rooms', clean, 'players', uid), {
      score: Math.min(Math.max(0, newScore), 500000),
      streak: Math.min(Math.max(0, newStreak), 50),
      lastAnswerIndex: selectedIndex,
      lastAnsweredQuestion: questionIndex,
      lastAnswerCorrect: Boolean(correct),
      lastPointsEarned: Math.min(Math.max(0, pointsEarned), 2000),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async advanceRoomPhase({ roomCode, newStatus, questionIndex, questionStartedAtMs, leaderboard }) {
    const { db, fsMod } = await ensureSdk();
    this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    await fsMod.updateDoc(fsMod.doc(db, 'quiz_rooms', clean), {
      status: newStatus,
      currentQuestionIndex: questionIndex,
      questionStartedAtMs,
      leaderboard: (leaderboard || []).slice(0, 25),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async observeRoomMessages(roomCode, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const clean = String(roomCode || '').trim().toUpperCase();
    const q = fsMod.query(
      fsMod.collection(db, 'quiz_rooms', clean, 'messages'),
      fsMod.where('roomCode', '==', clean)
    );
    return fsMod.onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(mapSnapshotDoc).sort((a, b) => a.createdAtMs - b.createdAtMs);
        onData(list);
      },
      (err) => onError?.(err)
    );
  }

  async sendRoomMessage({ roomCode, senderName, avatarColor, hostSender, messageType, text }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const clean = String(roomCode || '').trim().toUpperCase();
    const cleanText = String(text || '').trim().slice(0, 240);
    if (!cleanText) return;
    await fsMod.addDoc(fsMod.collection(db, 'quiz_rooms', clean, 'messages'), {
      roomCode: clean,
      senderUid: uid,
      senderName: String(senderName || 'Player').trim().slice(0, 50) || 'Player',
      avatarColor: String(avatarColor || 'INDIGO').slice(0, 20),
      hostSender: Boolean(hostSender),
      messageType: messageType === 'REACTION' ? 'REACTION' : 'TEXT',
      text: cleanText,
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async deleteRoomMessage(roomCode, messageId) {
    const { db, fsMod } = await ensureSdk();
    this.requireUid();
    await fsMod.deleteDoc(fsMod.doc(db, 'quiz_rooms', String(roomCode).trim().toUpperCase(), 'messages', sanitizeId(messageId)));
  }

  // --- Tutor-Student Roster ---

  async connectToTutor({ tutorUid, tutorLabel, profile, decksCount, recentSessions }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const cleanTutorUid = String(tutorUid || '').trim();
    if (!/^[a-zA-Z0-9_-]{3,128}$/.test(cleanTutorUid)) {
      throw new Error('Enter a valid Tutor Code (3–128 letters, numbers, - or _).');
    }
    const cleanTutorName = String(tutorLabel || 'My Tutor').trim().slice(0, 50) || 'My Tutor';
    await fsMod.updateDoc(fsMod.doc(db, 'users', uid), {
      tutorUid: cleanTutorUid,
      tutorName: cleanTutorName,
      updatedAt: fsMod.serverTimestamp()
    });
    const nextProfile = { ...(profile || { userId: uid }), tutorUid: cleanTutorUid, tutorName: cleanTutorName };
    await this.syncStudentProgressToTutor({ profile: nextProfile, decksCount, recentSessions });
  }

  async disconnectFromTutor(previousTutorUid) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    await fsMod.updateDoc(fsMod.doc(db, 'users', uid), {
      tutorUid: '',
      tutorName: '',
      updatedAt: fsMod.serverTimestamp()
    });
    const cleanPrev = String(previousTutorUid || '').trim();
    if (/^[a-zA-Z0-9_-]{1,128}$/.test(cleanPrev)) {
      try {
        await fsMod.deleteDoc(fsMod.doc(db, 'tutors', cleanPrev, 'students', uid));
      } catch (_) {}
    }
  }

  async syncStudentProgressToTutor({ profile, decksCount = 0, recentSessions = [] }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const cleanTutorUid = String(profile?.tutorUid || '').trim();
    if (!cleanTutorUid || !/^[a-zA-Z0-9_-]{1,128}$/.test(cleanTutorUid)) return;
    const ref = fsMod.doc(db, 'tutors', cleanTutorUid, 'students', uid);
    const snap = await fsMod.getDoc(ref);
    const activities = (recentSessions || []).slice(0, 10).map((s) => ({
      title: String(s.title || 'Activity').slice(0, 100),
      activityType: s.activityType || 'QUIZ',
      cefrLevel: s.cefrLevel || 'B1',
      score: Math.min(Math.max(0, Number(s.score || 0)), 500000),
      accuracyPct: Math.min(Math.max(0, Number(s.accuracyPct || 100)), 100),
      wordsPracticed: Math.min(Math.max(0, Number(s.wordsPracticed || 0)), 200)
    }));
    const common = {
      studentName: String(profile.displayName || 'Student').trim().slice(0, 50) || 'Student',
      learningLevel: profile.learningLevel || 'B1',
      xp: Math.min(Math.max(0, Number(profile.xp || 0)), 10000000),
      streak: Math.min(Math.max(0, Number(profile.streak || 1)), 10000),
      sessionsCompleted: Math.min(Math.max(0, Number(profile.sessionsCompleted || 0)), 10000),
      weeklyWordsMastered: Math.min(Math.max(0, Number(profile.weeklyWordsMastered || 0)), 100000),
      quizzesPlayed: Math.min(Math.max(0, Number(profile.quizzesPlayed || 0)), 100000),
      quizzesHosted: Math.min(Math.max(0, Number(profile.quizzesHosted || 0)), 100000),
      bestLiveQuizScore: Math.min(Math.max(0, Number(profile.bestLiveQuizScore || 0)), 500000),
      cardsMastered: Math.min(Math.max(0, Number(profile.cardsMastered || 0)), 100000),
      decksCreated: Math.min(Math.max(0, Number(decksCount || 0)), 1000),
      audiobooksFinished: Math.min(Math.max(0, Number(profile.audiobooksFinished || 0)), 10000),
      teamName: String(profile.teamName || '').trim().slice(0, 50),
      earnedBadges: (profile.earnedBadges || []).slice(0, 30),
      recentActivities: activities,
      updatedAt: fsMod.serverTimestamp()
    };
    if (snap.exists()) {
      await fsMod.updateDoc(ref, common);
    } else {
      await fsMod.setDoc(ref, {
        studentUid: uid,
        tutorUid: cleanTutorUid,
        ...common,
        createdAt: fsMod.serverTimestamp()
      });
    }
  }

  async observeLinkedStudents(tutorUid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    return fsMod.onSnapshot(
      fsMod.collection(db, 'tutors', tutorUid, 'students'),
      (snap) => onData(snap.docs.map(mapSnapshotDoc).sort((a, b) => (b.xp || 0) - (a.xp || 0))),
      (err) => onError?.(err)
    );
  }

  async observeBootstrappedStudents(onData, onError) {
    if (!this.isBootstrappedTutor()) {
      onData([]);
      return () => {};
    }
    const { db, fsMod } = await ensureSdk();
    const q = fsMod.query(fsMod.collection(db, 'users'), fsMod.where('accountRole', '==', 'STUDENT'));
    return fsMod.onSnapshot(
      q,
      (snap) => onData(snap.docs.map(mapSnapshotDoc).sort((a, b) => (b.xp || 0) - (a.xp || 0))),
      (err) => onError?.(err)
    );
  }

  async observeDirectAssignedStudents(tutorUid, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const q = fsMod.query(fsMod.collection(db, 'users'), fsMod.where('tutorUid', '==', tutorUid));
    return fsMod.onSnapshot(
      q,
      (snap) => onData(snap.docs.map(mapSnapshotDoc).sort((a, b) => (b.xp || 0) - (a.xp || 0))),
      (err) => onError?.(err)
    );
  }

  async fetchStudentDetailBundle(studentUid) {
    const cleanUid = sanitizeId(studentUid);
    if (!this.isBootstrappedTutor()) {
      return { studentUid: cleanUid, sessions: [], weeklyProgress: [], customDecks: [] };
    }
    const { db, fsMod } = await ensureSdk();
    const [sessionsSnap, weeklySnap, decksSnap] = await Promise.all([
      fsMod.getDocs(fsMod.collection(db, 'users', cleanUid, 'session_history')),
      fsMod.getDocs(fsMod.collection(db, 'users', cleanUid, 'weekly_progress')),
      fsMod.getDocs(fsMod.collection(db, 'users', cleanUid, 'custom_decks'))
    ]);
    return {
      studentUid: cleanUid,
      sessions: sessionsSnap.docs.map(mapSnapshotDoc).sort((a, b) => b.createdAtMs - a.createdAtMs),
      weeklyProgress: weeklySnap.docs.map(mapSnapshotDoc).sort((a, b) => a.weekNumber - b.weekNumber),
      customDecks: decksSnap.docs.map(mapSnapshotDoc).sort((a, b) => b.createdAtMs - a.createdAtMs)
    };
  }

  // --- Team Chat & Teacher Hub ---

  async observeTeams(onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const q = fsMod.query(fsMod.collection(db, 'teams'), fsMod.where('visibility', '==', 'CLUB'));
    return fsMod.onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(mapSnapshotDoc).sort((a, b) => {
          if (a.channelKind === 'TEACHER_HUB' && b.channelKind !== 'TEACHER_HUB') return -1;
          if (b.channelKind === 'TEACHER_HUB' && a.channelKind !== 'TEACHER_HUB') return 1;
          return (b.memberCount || 0) - (a.memberCount || 0);
        });
        onData(list);
      },
      (err) => onError?.(err)
    );
  }

  async ensureDefaultTutorHubIfTutor(tutorDisplayName) {
    if (!this.isBootstrappedTutor()) return;
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const ref = fsMod.doc(db, 'teams', DEFAULT_TEACHER_HUB_ID);
    const snap = await fsMod.getDoc(ref);
    if (!snap.exists()) {
      await fsMod.setDoc(ref, {
        visibility: 'CLUB',
        name: 'Tutor <-> All Teams',
        cefrLevel: CefrLevel.B2,
        motto: 'Direct tutor announcements, speaking tips, and student Q&A',
        accentColor: 'INDIGO',
        leaderUid: uid,
        leaderName: String(tutorDisplayName || 'Tutor').trim().slice(0, 50) || 'Tutor',
        channelKind: 'TEACHER_HUB',
        memberCount: 1,
        createdAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      });
    }
  }

  async createTeam({ name, cefrLevel, motto, accentColor, channelKind, creatorName }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const cleanName = String(name || '').trim().slice(0, 50);
    if (cleanName.length < 2) throw new Error('Team name must be at least 2 characters.');
    const allowedColors = ['INDIGO', 'CORAL', 'AMBER', 'MINT', 'PURPLE'];
    const color = allowedColors.includes(accentColor) ? accentColor : 'INDIGO';
    const docRef = await fsMod.addDoc(fsMod.collection(db, 'teams'), {
      visibility: 'CLUB',
      name: cleanName,
      cefrLevel,
      motto: String(motto || '').trim().slice(0, 120),
      accentColor: color,
      leaderUid: uid,
      leaderName: String(creatorName || 'Team Lead').trim().slice(0, 50) || 'Team Lead',
      channelKind: channelKind === 'TEACHER_HUB' ? 'TEACHER_HUB' : 'TEAM',
      memberCount: 1,
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
    if (channelKind !== 'TEACHER_HUB') {
      await fsMod.updateDoc(fsMod.doc(db, 'users', uid), {
        teamId: docRef.id,
        teamName: cleanName,
        updatedAt: fsMod.serverTimestamp()
      });
    }
    return docRef.id;
  }

  async joinTeam(team, previousTeamId) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    if (!team?.id || previousTeamId === team.id) return;
    const targetRef = fsMod.doc(db, 'teams', team.id);
    const snap = await fsMod.getDoc(targetRef);
    const curCount = Number(snap.data()?.memberCount || team.memberCount || 0);
    await fsMod.updateDoc(targetRef, {
      memberCount: Math.min(curCount + 1, 10000),
      updatedAt: fsMod.serverTimestamp()
    });
    if (previousTeamId && previousTeamId !== DEFAULT_TEACHER_HUB_ID) {
      try {
        const prevRef = fsMod.doc(db, 'teams', previousTeamId);
        const prevSnap = await fsMod.getDoc(prevRef);
        if (prevSnap.exists()) {
          const prevCount = Number(prevSnap.data()?.memberCount || 1);
          await fsMod.updateDoc(prevRef, {
            memberCount: Math.max(prevCount - 1, 0),
            updatedAt: fsMod.serverTimestamp()
          });
        }
      } catch (_) {}
    }
    await fsMod.updateDoc(fsMod.doc(db, 'users', uid), {
      teamId: team.id,
      teamName: String(team.name || '').slice(0, 50),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async observeTeamMessages(teamId, onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const cleanId = sanitizeId(teamId);
    const q = fsMod.query(
      fsMod.collection(db, 'teams', cleanId, 'messages'),
      fsMod.where('teamId', '==', cleanId)
    );
    return fsMod.onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(mapSnapshotDoc).sort((a, b) => {
          if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
          return (a.createdAtMs || 0) - (b.createdAtMs || 0);
        });
        onData(list);
      },
      (err) => onError?.(err)
    );
  }

  async sendTeamMessage({ teamId, senderName, senderTeamName, senderRole, text, pinned = false }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const cleanId = sanitizeId(teamId);
    const cleanText = String(text || '').trim().slice(0, 500);
    if (!cleanText) return;
    await fsMod.addDoc(fsMod.collection(db, 'teams', cleanId, 'messages'), {
      teamId: cleanId,
      senderUid: uid,
      senderName: String(senderName || 'Member').trim().slice(0, 50) || 'Member',
      senderTeamName: String(senderTeamName || '').trim().slice(0, 50),
      senderRole: senderRole === 'TEACHER' ? 'TEACHER' : 'PLAYER',
      text: cleanText,
      pinned: Boolean(pinned),
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
  }

  async toggleMessagePin(teamId, messageId, pinned) {
    const { db, fsMod } = await ensureSdk();
    this.requireUid();
    await fsMod.updateDoc(
      fsMod.doc(db, 'teams', sanitizeId(teamId), 'messages', sanitizeId(messageId)),
      { pinned: Boolean(pinned), updatedAt: fsMod.serverTimestamp() }
    );
  }

  async deleteTeamMessage(teamId, messageId) {
    const { db, fsMod } = await ensureSdk();
    this.requireUid();
    await fsMod.deleteDoc(fsMod.doc(db, 'teams', sanitizeId(teamId), 'messages', sanitizeId(messageId)));
  }

  async observeClubContent(onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const q = fsMod.query(fsMod.collection(db, 'club_content'), fsMod.where('visibility', '==', 'CLUB'));
    return fsMod.onSnapshot(
      q,
      (snap) => onData(snap.docs.map(mapSnapshotDoc).sort((a, b) => b.createdAtMs - a.createdAtMs)),
      (err) => onError?.(err)
    );
  }

  async observeGlobalScores(onData, onError) {
    const { db, fsMod } = await ensureSdk();
    const q = fsMod.query(
      fsMod.collection(db, 'scores'),
      fsMod.orderBy('score', 'desc'),
      fsMod.limit(50)
    );
    return fsMod.onSnapshot(
      q,
      (snap) => onData(snap.docs.map(mapSnapshotDoc)),
      (err) => onError?.(err)
    );
  }

  async publishScoreRecord({ quizTitle, cefrLevel, score, accuracyPct, streak, gameMode = 'LIVE_QUIZ', avatarColor = 'INDIGO' }) {
    const { db, fsMod } = await ensureSdk();
    const uid = this.requireUid();
    const displayName = String(this._currentUser?.displayName || 'Lingo Member').trim().slice(0, 50) || 'Lingo Member';
    const scoreId = sanitizeId(`${uid}_${gameMode}_${quizTitle}`);
    const ref = fsMod.doc(db, 'scores', scoreId);
    const snap = await fsMod.getDoc(ref);
    const existingScore = Number(snap.data()?.score || 0);
    if (snap.exists() && score <= existingScore) return;
    await fsMod.setDoc(ref, {
      userId: uid,
      playerName: displayName,
      avatarColor: String(avatarColor || 'INDIGO').slice(0, 24),
      quizTitle: String(quizTitle || 'Quiz Clash').slice(0, 100),
      cefrLevel,
      score: Math.min(Math.max(0, Math.round(score)), 500000),
      accuracyPct: Math.min(Math.max(0, Math.round(accuracyPct)), 100),
      streak: Math.min(Math.max(0, Math.round(streak)), 100),
      gameMode: String(gameMode || 'LIVE_QUIZ').slice(0, 40),
      createdAt: snap.exists() ? snap.data().createdAt : fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    });
  }
}

export const firebaseClient = new FirebaseClient();
