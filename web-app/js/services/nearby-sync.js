// Nearby Cross-Tab Squad & Local Live Quiz Sync
// Uses BroadcastChannel + localStorage events to replicate Android TetheringHubManager LAN/Hotspot behavior across browser tabs/windows.

import { generatePin6 } from '../models.js';

const CHANNEL_NAME = 'lingoclub_nearby_channel_v1';
const STATE_KEY = 'lingoclub_nearby_hub_state_v1';

function readHubState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { squads: {}, rooms: {} };
    const parsed = JSON.parse(raw);
    return {
      squads: parsed.squads || {},
      rooms: parsed.rooms || {}
    };
  } catch {
    return { squads: {}, rooms: {} };
  }
}

function writeHubState(state) {
  try {
    // Prune stale entries older than 6 hours
    const cutoff = Date.now() - 6 * 3600 * 1000;
    for (const [id, sq] of Object.entries(state.squads || {})) {
      if ((sq.updatedAtMs || 0) < cutoff) delete state.squads[id];
    }
    for (const [code, rm] of Object.entries(state.rooms || {})) {
      if ((rm.updatedAtMs || 0) < cutoff) delete state.rooms[code];
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
      hostingSquadId: this.hostingSquadId
    };
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
      questions: questions.slice(0, 20),
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

  getLocalQuizRoom(roomCode) {
    const clean = String(roomCode || '').trim().toUpperCase();
    return readHubState().rooms[clean] || null;
  }

  joinLocalQuizRoom({ roomCode, playerUid, nickname, avatarColor }) {
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
