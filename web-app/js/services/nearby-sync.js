// Nearby Cross-Tab Squad & Local Live Quiz Sync
// Uses BroadcastChannel + localStorage events to replicate Android TetheringHubManager LAN/Hotspot behavior across browser tabs/windows.

import { generatePin6 } from '../models.js';

const CHANNEL_NAME = 'lingoclub_nearby_channel_v1';
const STATE_KEY = 'lingoclub_nearby_hub_state_v1';

function readHubState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { squads: {}, rooms: {}, arcadeRooms: {}, buzzer: null };
    const parsed = JSON.parse(raw);
    return {
      squads: parsed.squads || {},
      rooms: parsed.rooms || {},
      arcadeRooms: parsed.arcadeRooms || {},
      buzzer: parsed.buzzer || null
    };
  } catch {
    return { squads: {}, rooms: {}, arcadeRooms: {}, buzzer: null };
  }
}

function writeHubState(state) {
  try {
    // Prune stale entries older than 6 hours (30 mins for arcadeRooms)
    const cutoff = Date.now() - 6 * 3600 * 1000;
    const arcadeCutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, sq] of Object.entries(state.squads || {})) {
      if ((sq.updatedAtMs || 0) < cutoff) delete state.squads[id];
    }
    for (const [code, rm] of Object.entries(state.rooms || {})) {
      if ((rm.updatedAtMs || 0) < cutoff) delete state.rooms[code];
    }
    for (const [aid, ar] of Object.entries(state.arcadeRooms || {})) {
      if ((ar.updatedAtMs || 0) < arcadeCutoff) delete state.arcadeRooms[aid];
    }
    if (state.buzzer && (state.buzzer.updatedAtMs || 0) < Date.now() - 5 * 60 * 1000) {
      state.buzzer = null;
    }
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (_) {}
}

class NearbySyncService {
  constructor() {
    this.tabId = `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
    this.listeners = new Set();
    this.hostingSquadId = null;

    if (this.channel) {
      this.channel.onmessage = (ev) => {
        this._notify(ev.data);
      };
    }
    window.addEventListener('storage', (ev) => {
      if (ev.key === STATE_KEY) {
        this._notify({ type: 'STATE_SYNC' });
      }
    });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify(event) {
    this.listeners.forEach((fn) => {
      try {
        fn(event, this.getSnapshot());
      } catch (_) {}
    });
  }

  _broadcast(payload) {
    if (this.channel) {
      try {
        this.channel.postMessage({ ...payload, fromTab: this.tabId });
      } catch (_) {}
    }
    this._notify(payload);
  }

  getSnapshot() {
    const state = readHubState();
    return {
      squads: Object.values(state.squads || {}).sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0)),
      rooms: state.rooms || {},
      arcadeRooms: state.arcadeRooms || {},
      buzzer: state.buzzer || null,
      hostingSquadId: this.hostingSquadId
    };
  }

  // --- Active Arcade Game Rooms Aggregation ---

  upsertActiveArcadeRoom({ roomId, gameMode, gameTitle, teamScores = {}, teamMeta = {}, activeTeamName = '' }) {
    const id = String(roomId || '').trim();
    if (!id) return null;
    const state = readHubState();
    state.arcadeRooms[id] = {
      id,
      gameMode: gameMode || 'ARCADE',
      gameTitle: gameTitle || 'Arcade Battle',
      teamScores: { ...teamScores },
      teamMeta: { ...teamMeta },
      activeTeamName,
      tabId: this.tabId,
      updatedAtMs: Date.now()
    };
    writeHubState(state);
    this._broadcast({ type: 'ARCADE_ROOM_SYNC', roomId: id });
    return state.arcadeRooms[id];
  }

  removeActiveArcadeRoom(roomId) {
    const id = String(roomId || '').trim();
    if (!id) return;
    const state = readHubState();
    if (state.arcadeRooms[id]) {
      delete state.arcadeRooms[id];
      writeHubState(state);
      this._broadcast({ type: 'ARCADE_ROOM_SYNC', roomId: id });
    }
  }

  // --- Cross-Tab Team Buzzer (5s Lockout) ---

  sendBuzzerEvent(buzzPayload) {
    const state = readHubState();
    const buzz = buzzPayload
      ? { ...buzzPayload, updatedAtMs: Date.now() }
      : null;
    state.buzzer = buzz;
    writeHubState(state);
    this._broadcast({ type: 'TEAM_BUZZER', buzz });
    return buzz;
  }

  clearBuzzerEvent(contextKey = null) {
    const state = readHubState();
    if (!state.buzzer || !contextKey || state.buzzer.contextKey === contextKey) {
      state.buzzer = null;
      writeHubState(state);
      this._broadcast({ type: 'TEAM_BUZZER', buzz: null, contextKey });
    }
  }

  // --- Squad Discovery & Cross-Tab Chat ---

  hostSquad({ team, hostName }) {
    const state = readHubState();
    const id = team.id;
    state.squads[id] = {
      id,
      name: team.name,
      cefrLevel: team.cefrLevel,
      motto: team.motto,
      accentColor: team.accentColor || 'INDIGO',
      leaderName: hostName || team.leaderName || 'Squad Host',
      leaderUid: team.leaderUid,
      channelKind: team.channelKind || 'TEAM',
      memberCount: team.memberCount || 1,
      hostTabId: this.tabId,
      updatedAtMs: Date.now()
    };
    writeHubState(state);
    this.hostingSquadId = id;
    this._broadcast({ type: 'SQUAD_HOSTED', squad: state.squads[id] });
    return state.squads[id];
  }

  stopHostingSquad() {
    if (!this.hostingSquadId) return;
    const state = readHubState();
    delete state.squads[this.hostingSquadId];
    writeHubState(state);
    this.hostingSquadId = null;
    this._broadcast({ type: 'STATE_SYNC' });
  }

  sendSquadMessage(message) {
    const state = readHubState();
    if (state.squads[message.teamId]) {
      state.squads[message.teamId].updatedAtMs = Date.now();
      writeHubState(state);
    }
    this._broadcast({ type: 'SQUAD_MESSAGE', message });
  }

  // --- Nearby / Offline Cross-Tab Live Quiz Rooms ---

  createLocalQuizRoom({ hostUid, hostName, quizTitle, cefrLevel, questions }) {
    const state = readHubState();
    let code = generatePin6();
    while (state.rooms[code]) code = generatePin6();
    const room = {
      id: code,
      roomCode: code,
      hostUid,
      hostName,
      quizTitle,
      cefrLevel,
      status: 'LOBBY',
      currentQuestionIndex: 0,
      questionStartedAtMs: 0,
      questions: questions.slice(0, 60),
      leaderboard: [],
      players: {},
      messages: [],
      updatedAtMs: Date.now()
    };
    state.rooms[code] = room;
    writeHubState(state);
    this._broadcast({ type: 'ROOM_UPDATED', roomCode: code });
    return room;
  }

  closeLocalQuizRoom(roomCode) {
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!clean) return;
    const state = readHubState();
    if (state.rooms[clean]) {
      delete state.rooms[clean];
      writeHubState(state);
    }
    this._broadcast({ type: 'ROOM_CLOSED', roomCode: clean });
  }

  getLocalQuizRoom(roomCode) {
    const clean = String(roomCode || '').trim().toUpperCase();
    return readHubState().rooms[clean] || null;
  }

  joinLocalQuizRoom({ roomCode, playerUid, nickname, avatarColor, teamId = '', teamName = '' }) {
    const clean = String(roomCode || '').trim().toUpperCase();
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room) throw new Error(`No local squad room found for PIN ${clean}.`);
    if (room.status === 'PODIUM') throw new Error('This quiz round has already finished.');
    if (!room.players[playerUid]) {
      room.players[playerUid] = {
        id: playerUid,
        playerUid,
        roomCode: clean,
        hostUid: room.hostUid,
        nickname: nickname || 'Explorer',
        avatarColor: avatarColor || 'INDIGO',
        teamId: String(teamId || ''),
        teamName: String(teamName || ''),
        score: 0,
        streak: 0,
        lastAnswerIndex: -1,
        lastAnsweredQuestion: -1,
        lastAnswerCorrect: false,
        lastPointsEarned: 0
      };
    } else {
      room.players[playerUid].nickname = nickname || room.players[playerUid].nickname;
      room.players[playerUid].avatarColor = avatarColor || room.players[playerUid].avatarColor;
      if (teamId) room.players[playerUid].teamId = String(teamId);
      if (teamName) room.players[playerUid].teamName = String(teamName);
    }
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this._broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
    return room;
  }

  submitLocalRoomAnswer({ roomCode, playerUid, questionIndex, selectedIndex, correct, pointsEarned, newScore, newStreak }) {
    const clean = String(roomCode || '').trim().toUpperCase();
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room || !room.players[playerUid]) return;
    const p = room.players[playerUid];
    p.score = newScore;
    p.streak = newStreak;
    p.lastAnswerIndex = selectedIndex;
    p.lastAnsweredQuestion = questionIndex;
    p.lastAnswerCorrect = Boolean(correct);
    p.lastPointsEarned = pointsEarned;
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this._broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
  }

  advanceLocalRoomPhase({ roomCode, newStatus, questionIndex, questionStartedAtMs, leaderboard }) {
    const clean = String(roomCode || '').trim().toUpperCase();
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room) return;
    room.status = newStatus;
    room.currentQuestionIndex = questionIndex;
    room.questionStartedAtMs = questionStartedAtMs;
    room.leaderboard = leaderboard || [];
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this._broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
  }

  sendLocalRoomMessage({ roomCode, senderUid, senderName, avatarColor, hostSender, messageType, text }) {
    const clean = String(roomCode || '').trim().toUpperCase();
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room) return;
    const msg = {
      id: `rmsg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      roomCode: clean,
      senderUid,
      senderName,
      avatarColor,
      hostSender: Boolean(hostSender),
      messageType: messageType || 'TEXT',
      text,
      createdAtMs: Date.now()
    };
    room.messages = [...(room.messages || []), msg].slice(-80);
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this._broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
  }
}

export const nearbySync = new NearbySyncService();
