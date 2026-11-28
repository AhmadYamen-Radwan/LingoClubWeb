// LocalStorage Offline Persistence Store (1:1 parity with OfflineLocalStore.kt)

import {
  CefrLevel,
  createDefaultProfile,
  epochDayNow,
  sanitizeId
} from '../models.js';

const PREFIX = 'lingoclub_v1_';
const SHARED_SCORES_KEY = `${PREFIX}shared_scores`;
const SHARED_TEAMS_KEY = `${PREFIX}shared_teams`;
const SHARED_MESSAGES_KEY = `${PREFIX}shared_messages`;
const SHARED_TEAM_CONTRIBS_KEY = `${PREFIX}team_contributions`;
const SHARED_TEAM_SCORES_KEY = `${PREFIX}team_scores`;
const THEME_KEY = `${PREFIX}theme_mode`;
const GEMINI_KEY = `${PREFIX}gemini_api_key`;
const LAST_EXPLORER_NAME_KEY = `${PREFIX}explorer_name`;
const DIFFICULTY_KEY = `${PREFIX}difficulty_mode`;

export const OFFLINE_DEFAULT_TEAM_ID = 'offline_explorers_hub';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[OfflineStore] Failed to write localStorage:', err);
  }
}

export class OfflineStore {
  constructor(userId = 'offline_explorer', defaultName = 'Offline Explorer') {
    this.userId = sanitizeId(userId);
    this.defaultName = defaultName;
  }

  _k(suffix) {
    return `${PREFIX}${this.userId}_${suffix}`;
  }

  loadProfile() {
    const saved = readJson(this._k('profile'), null);
    const today = epochDayNow();
    if (saved && typeof saved === 'object') {
      let streak = Math.max(1, Number(saved.streak || 1));
      const lastDay = Number(saved.lastActiveEpochDay || 0);
      if (lastDay > 0 && today === lastDay + 1) {
        streak = Math.min(streak + 1, 10000);
      } else if (lastDay > 0 && today > lastDay + 1) {
        streak = 1;
      }
      const hydrated = {
        ...createDefaultProfile({ userId: this.userId, displayName: this.defaultName, learningLevel: CefrLevel.B1 }),
        ...saved,
        userId: this.userId,
        streak,
        lastActiveEpochDay: today
      };
      this.saveProfile(hydrated);
      return hydrated;
    }
    const fresh = createDefaultProfile({
      userId: this.userId,
      displayName: this.defaultName,
      learningLevel: CefrLevel.B1
    });
    this.saveProfile(fresh);
    return fresh;
  }

  saveProfile(profile) {
    writeJson(this._k('profile'), profile);
    return profile;
  }

  updateDisplayName(name) {
    const clean = String(name || '').trim().slice(0, 50);
    if (!clean) return this.loadProfile();
    setSavedExplorerName(clean);
    const p = this.loadProfile();
    p.displayName = clean;
    return this.saveProfile(p);
  }

  updateLearningLevel(level) {
    const p = this.loadProfile();
    p.learningLevel = level;
    return this.saveProfile(p);
  }

  awardProgress({
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
    const p = this.loadProfile();
    p.xp = Math.max(0, (p.xp || 0) + xpDelta);
    p.quizzesHosted = Math.max(0, (p.quizzesHosted || 0) + quizzesHostedDelta);
    p.quizzesPlayed = Math.max(0, (p.quizzesPlayed || 0) + quizzesPlayedDelta);
    p.cardsMastered = Math.max(0, (p.cardsMastered || 0) + cardsMasteredDelta);
    p.sessionsCompleted = Math.max(0, (p.sessionsCompleted || 0) + sessionsCompletedDelta);
    p.audiobooksFinished = Math.max(0, (p.audiobooksFinished || 0) + audiobooksFinishedDelta);
    p.weeklyWordsMastered = Math.max(0, (p.weeklyWordsMastered || 0) + weeklyWordsMasteredDelta);
    p.bestLiveQuizScore = Math.max(p.bestLiveQuizScore || 0, bestLiveQuizScoreCandidate || 0);
    p.earnedBadges = [...new Set([...(p.earnedBadges || []), ...newEarnedBadgeIds])];
    return this.saveProfile(p);
  }

  togglePinEvidence(cardId, pinned) {
    const p = this.loadProfile();
    const set = new Set(p.pinnedEvidenceIds || []);
    if (pinned) set.add(cardId);
    else set.delete(cardId);
    p.pinnedEvidenceIds = [...set];
    return this.saveProfile(p);
  }

  loadSessions() {
    return readJson(this._k('sessions'), []);
  }

  logSessionRecord(rec) {
    const list = this.loadSessions();
    const item = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...rec,
      createdAtMs: Date.now()
    };
    const next = [item, ...list].slice(0, 50);
    writeJson(this._k('sessions'), next);
    return next;
  }

  loadWeeklyProgress() {
    return readJson(this._k('weekly'), {});
  }

  updateWeeklyWordMastery(weekNumber, masteredWordIds) {
    const map = this.loadWeeklyProgress();
    const cur = map[weekNumber] || {
      id: `week_${weekNumber}`,
      weekNumber,
      masteredWordIds: [],
      completedSessions: [],
      gamesPlayed: 0
    };
    cur.masteredWordIds = [...new Set(masteredWordIds)].slice(0, 200);
    map[weekNumber] = cur;
    writeJson(this._k('weekly'), map);
    return map;
  }

  markWeeklySessionComplete(weekNumber, sessionNumber, incrementGames = false) {
    const map = this.loadWeeklyProgress();
    const cur = map[weekNumber] || {
      id: `week_${weekNumber}`,
      weekNumber,
      masteredWordIds: [],
      completedSessions: [],
      gamesPlayed: 0
    };
    const newlyCompleted = !cur.completedSessions.includes(sessionNumber);
    if (newlyCompleted) {
      cur.completedSessions = [...cur.completedSessions, sessionNumber].sort((a, b) => a - b);
    }
    if (incrementGames) cur.gamesPlayed = (cur.gamesPlayed || 0) + 1;
    map[weekNumber] = cur;
    writeJson(this._k('weekly'), map);
    return { map, newlyCompleted };
  }

  recordWeeklyGamePlayed(weekNumber) {
    const map = this.loadWeeklyProgress();
    const cur = map[weekNumber] || {
      id: `week_${weekNumber}`,
      weekNumber,
      masteredWordIds: [],
      completedSessions: [],
      gamesPlayed: 0
    };
    cur.gamesPlayed = (cur.gamesPlayed || 0) + 1;
    map[weekNumber] = cur;
    writeJson(this._k('weekly'), map);
    return map;
  }

  loadCardMastery() {
    return readJson(this._k('card_mastery'), {});
  }

  toggleCardMastery(deckId, cardIndex, mastered) {
    const map = this.loadCardMastery();
    const id = sanitizeId(`${deckId}_${cardIndex}`);
    const prev = map[id];
    map[id] = {
      id,
      deckId,
      mastered: Boolean(mastered),
      reviewCount: (prev?.reviewCount || 0) + 1
    };
    writeJson(this._k('card_mastery'), map);
    return map;
  }

  loadCustomQuizzes() {
    return readJson(this._k('custom_quizzes'), []);
  }

  saveCustomQuiz({ title, topic, cefrLevel, customPrompt = '', language = 'EN', questions }) {
    const list = this.loadCustomQuizzes();
    const item = {
      id: `offline_quiz_${Date.now().toString(36)}`,
      title: String(title || 'Custom Quiz').trim().slice(0, 80),
      topic: String(topic || 'English').trim().slice(0, 40),
      cefrLevel,
      customPrompt: String(customPrompt || '').trim().slice(0, 400),
      language: language === 'AR' ? 'AR' : 'EN',
      questions: (questions || []).slice(0, 60),
      createdAtMs: Date.now()
    };
    const next = [item, ...list];
    writeJson(this._k('custom_quizzes'), next);
    return next;
  }

  updateCustomQuiz(id, { title, topic, cefrLevel, customPrompt, language, questions }) {
    const next = this.loadCustomQuizzes().map((q) =>
      q.id === id
        ? {
            ...q,
            ...(title !== undefined ? { title: String(title).trim().slice(0, 80) } : {}),
            ...(topic !== undefined ? { topic: String(topic).trim().slice(0, 40) } : {}),
            ...(cefrLevel !== undefined ? { cefrLevel } : {}),
            ...(customPrompt !== undefined ? { customPrompt: String(customPrompt).trim().slice(0, 400) } : {}),
            ...(language !== undefined ? { language: language === 'AR' ? 'AR' : 'EN' } : {}),
            ...(questions !== undefined ? { questions: (questions || []).slice(0, 60) } : {}),
            updatedAtMs: Date.now()
          }
        : q
    );
    writeJson(this._k('custom_quizzes'), next);
    return next;
  }

  deleteCustomQuiz(id) {
    const next = this.loadCustomQuizzes().filter((q) => q.id !== id);
    writeJson(this._k('custom_quizzes'), next);
    return next;
  }

  loadCustomDecks() {
    return readJson(this._k('custom_decks'), []);
  }

  saveCustomDeck({ title, cefrLevel, cards }) {
    const list = this.loadCustomDecks();
    const item = {
      id: `offline_deck_${Date.now().toString(36)}`,
      title: String(title || 'My Deck').trim().slice(0, 80),
      cefrLevel,
      cards: cards.slice(0, 40),
      createdAtMs: Date.now()
    };
    const next = [item, ...list];
    writeJson(this._k('custom_decks'), next);
    return next;
  }

  updateCustomDeck(deckId, { title, cefrLevel, cards }) {
    const next = this.loadCustomDecks().map((d) =>
      d.id === deckId
        ? { ...d, title: String(title).trim().slice(0, 80), cefrLevel, cards: cards.slice(0, 40) }
        : d
    );
    writeJson(this._k('custom_decks'), next);
    return next;
  }

  deleteCustomDeck(deckId) {
    const next = this.loadCustomDecks().filter((d) => d.id !== deckId);
    writeJson(this._k('custom_decks'), next);
    return next;
  }

  loadCustomRoleplays() {
    return readJson(this._k('custom_roleplays'), []);
  }

  saveCustomRoleplay({ title, setting, cefrLevel, roleAName, roleBName, goal, source, lines, plotTwists }) {
    const list = this.loadCustomRoleplays();
    const item = {
      id: `offline_rp_${Date.now().toString(36)}`,
      title,
      setting,
      cefrLevel,
      roleAName,
      roleBName,
      goal,
      source: source || 'OFFLINE',
      lines: lines.slice(0, 20),
      plotTwists: (plotTwists || []).slice(0, 10),
      createdAtMs: Date.now()
    };
    const next = [item, ...list];
    writeJson(this._k('custom_roleplays'), next);
    return next;
  }

  deleteCustomRoleplay(id) {
    const next = this.loadCustomRoleplays().filter((r) => r.id !== id);
    writeJson(this._k('custom_roleplays'), next);
    return next;
  }

  // --- Shared Local Leaderboard, Teams & Messages ---

  loadScores() {
    return readJson(SHARED_SCORES_KEY, []);
  }

  publishScoreRecord({ playerName, quizTitle, cefrLevel, score, accuracyPct, streak, gameMode, avatarColor = 'INDIGO', teamId = '', teamName = '' }) {
    const list = this.loadScores();
    const entry = {
      id: `score_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: this.userId,
      playerName: playerName || this.loadProfile().displayName,
      avatarColor,
      teamId: String(teamId || '').trim(),
      teamName: String(teamName || '').trim(),
      quizTitle: String(quizTitle || 'Quiz').slice(0, 100),
      cefrLevel,
      score: Math.max(0, Math.round(score)),
      accuracyPct: Math.min(Math.max(0, Math.round(accuracyPct)), 100),
      streak: Math.max(0, Math.round(streak)),
      gameMode: gameMode || 'LIVE_QUIZ',
      createdAtMs: Date.now()
    };
    const next = [...list, entry].sort((a, b) => b.score - a.score).slice(0, 100);
    writeJson(SHARED_SCORES_KEY, next);
    return next;
  }

  loadTeamContributions() {
    return readJson(SHARED_TEAM_CONTRIBS_KEY, []);
  }

  loadTeamScoresMap() {
    return readJson(SHARED_TEAM_SCORES_KEY, {});
  }

  recordTeamContribution({ teamId, teamName, playerName, avatarColor = 'INDIGO', title, gameMode = 'ARCADE_TEAM', points = 0, accuracyPct = 100, cefrLevel = 'B1' }) {
    const cleanTeamId = String(teamId || '').trim();
    const cleanPts = Math.round(Number(points || 0));
    if (!cleanTeamId || cleanPts <= 0) {
      return {
        contributions: this.loadTeamContributions(),
        teamScoresMap: this.loadTeamScoresMap()
      };
    }
    const list = this.loadTeamContributions();
    const entry = {
      id: `tcontrib_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      teamId: cleanTeamId,
      teamName: String(teamName || 'Squad').slice(0, 60),
      userId: this.userId,
      playerName: String(playerName || this.loadProfile().displayName || 'Player').slice(0, 50),
      avatarColor,
      title: String(title || 'Team Play').slice(0, 100),
      gameMode: String(gameMode || 'ARCADE_TEAM').slice(0, 40),
      points: cleanPts,
      accuracyPct: Math.min(Math.max(0, Math.round(accuracyPct)), 100),
      cefrLevel: cefrLevel || 'B1',
      createdAtMs: Date.now()
    };
    const nextList = [entry, ...list].slice(0, 120);
    writeJson(SHARED_TEAM_CONTRIBS_KEY, nextList);

    const scoresMap = this.loadTeamScoresMap();
    scoresMap[cleanTeamId] = Math.max(0, Number(scoresMap[cleanTeamId] || 0) + cleanPts);
    writeJson(SHARED_TEAM_SCORES_KEY, scoresMap);
    return { contributions: nextList, teamScoresMap: scoresMap };
  }

  loadTeams() {
    const saved = readJson(SHARED_TEAMS_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) return saved;
    const defaults = [
      {
        id: OFFLINE_DEFAULT_TEAM_ID,
        visibility: 'OFFLINE',
        name: 'Offline Explorers',
        cefrLevel: CefrLevel.B1,
        motto: 'Practice English & Arabic offline or sync across browser tabs with Nearby Squad!',
        accentColor: 'INDIGO',
        leaderUid: this.userId,
        leaderName: this.defaultName,
        channelKind: 'TEAM',
        memberCount: 1
      },
      {
        id: 'offline_club_lounge',
        visibility: 'OFFLINE',
        name: 'LingoClub Open Lounge',
        cefrLevel: CefrLevel.B1,
        motto: 'Open bilingual club for quizzes, crime riddles, and daily practice',
        accentColor: 'MINT',
        leaderUid: this.userId,
        leaderName: this.defaultName,
        channelKind: 'CLUB',
        memberCount: 3
      }
    ];
    writeJson(SHARED_TEAMS_KEY, defaults);
    return defaults;
  }

  upsertTeam(team, joinImmediately = true) {
    const teams = this.loadTeams();
    const idx = teams.findIndex((t) => t.id === team.id);
    if (idx >= 0) teams[idx] = team;
    else teams.unshift(team);
    writeJson(SHARED_TEAMS_KEY, teams);
    if (joinImmediately) {
      const p = this.loadProfile();
      p.teamId = team.id;
      p.teamName = team.name;
      this.saveProfile(p);
    }
    return teams;
  }

  createTeam({ name, cefrLevel, motto, accentColor, kind = 'TEAM' }) {
    const team = {
      id: `offline_${kind === 'CLUB' ? 'club' : 'team'}_${Date.now().toString(36)}`,
      visibility: 'OFFLINE',
      name: String(name || 'My Squad').trim().slice(0, 50),
      cefrLevel,
      motto: String(motto || '').trim().slice(0, 120),
      accentColor: accentColor || 'INDIGO',
      leaderUid: this.userId,
      leaderName: this.loadProfile().displayName,
      channelKind: kind === 'CLUB' ? 'CLUB' : 'TEAM',
      memberCount: 1
    };
    return { team, teams: this.upsertTeam(team, true) };
  }

  joinTeam(team) {
    const p = this.loadProfile();
    const prevId = p.teamId;
    let teams = this.loadTeams();
    if (prevId && prevId !== team.id) {
      teams = teams.map((t) => (t.id === prevId ? { ...t, memberCount: Math.max(0, (t.memberCount || 1) - 1) } : t));
      writeJson(SHARED_TEAMS_KEY, teams);
    }
    const updated = prevId !== team.id
      ? { ...team, memberCount: (team.memberCount || 0) + 1 }
      : team;
    return this.upsertTeam(updated, true);
  }

  leaveTeam(teamId) {
    const teams = this.loadTeams().map((t) =>
      t.id === teamId ? { ...t, memberCount: Math.max(0, (t.memberCount || 1) - 1) } : t
    );
    writeJson(SHARED_TEAMS_KEY, teams);
    const p = this.loadProfile();
    if (p.teamId === teamId) {
      p.teamId = '';
      p.teamName = '';
      this.saveProfile(p);
    }
    return { teams, profile: p };
  }

  loadMessagesMap() {
    return readJson(SHARED_MESSAGES_KEY, {});
  }

  appendMessage(msg) {
    const map = this.loadMessagesMap();
    const existing = map[msg.teamId] || [];
    if (existing.some((m) => m.id === msg.id)) return map;
    map[msg.teamId] = [...existing, msg].slice(-120);
    writeJson(SHARED_MESSAGES_KEY, map);
    return map;
  }

  toggleMessagePin(teamId, messageId, pinned) {
    const map = this.loadMessagesMap();
    map[teamId] = (map[teamId] || []).map((m) => (m.id === messageId ? { ...m, pinned } : m));
    writeJson(SHARED_MESSAGES_KEY, map);
    return map;
  }

  deleteMessage(teamId, messageId) {
    const map = this.loadMessagesMap();
    map[teamId] = (map[teamId] || []).filter((m) => m.id !== messageId);
    writeJson(SHARED_MESSAGES_KEY, map);
    return map;
  }
}

export function getThemeMode() {
  return localStorage.getItem(THEME_KEY) || 'auto';
}

export function setThemeMode(mode) {
  localStorage.setItem(THEME_KEY, mode);
  if (mode === 'light' || mode === 'dark') {
    document.documentElement.setAttribute('data-theme', mode);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function getSavedGeminiKey() {
  return localStorage.getItem(GEMINI_KEY) || '';
}

export function setSavedGeminiKey(key) {
  const clean = String(key || '').trim();
  if (clean) localStorage.setItem(GEMINI_KEY, clean);
  else localStorage.removeItem(GEMINI_KEY);
}

export function getSavedExplorerName() {
  return localStorage.getItem(LAST_EXPLORER_NAME_KEY) || 'Offline Explorer';
}

export function setSavedExplorerName(name) {
  const clean = String(name || '').trim().slice(0, 50);
  if (clean) localStorage.setItem(LAST_EXPLORER_NAME_KEY, clean);
}

export function getSavedDifficulty() {
  const val = localStorage.getItem(DIFFICULTY_KEY);
  return val === 'EASY' || val === 'HARD' ? val : 'MEDIUM';
}

export function setSavedDifficulty(diff) {
  const clean = diff === 'EASY' || diff === 'HARD' ? diff : 'MEDIUM';
  localStorage.setItem(DIFFICULTY_KEY, clean);
  return clean;
}
