import {
  CefrLevel,
  ChatMessage,
  QuizQuestion,
  QuizRoom,
  RoomChatMessage,
  RoomPlayer,
  RoomStatus,
  Team,
} from '../types';
import { generatePin6 } from '../utils/constants';

const CHANNEL_NAME = 'lingoclub_nearby_channel_v1';
const STATE_KEY = 'lingoclub_nearby_hub_state_v1';

export interface LocalSquadRecord extends Team {
  hostTabId?: string;
  updatedAtMs?: number;
}

export interface LocalArcadeRoom {
  id: string;
  gameMode: string;
  gameTitle: string;
  teamScores: Record<string, number>;
  teamMeta: Record<string, { name?: string; motto?: string; accentColor?: string }>;
  activeTeamName?: string;
  tabId?: string;
  updatedAtMs: number;
}

export interface LocalBuzzerPacket {
  contextKey: string;
  title?: string;
  prompt?: string;
  teamId: string;
  teamName: string;
  playerUid: string;
  playerName: string;
  avatarColor: string;
  lockUntilMs: number;
  outcome?: 'PENDING' | 'AWARDED' | 'WRONG' | 'TIMEOUT';
  pointsDelta?: number;
  updatedAtMs?: number;
}

export interface LocalQuizRoomState extends QuizRoom {
  id: string;
  players: Record<string, RoomPlayer>;
  messages: RoomChatMessage[];
  updatedAtMs: number;
}

interface HubStorageState {
  squads: Record<string, LocalSquadRecord>;
  rooms: Record<string, LocalQuizRoomState>;
  arcadeRooms: Record<string, LocalArcadeRoom>;
  buzzer: LocalBuzzerPacket | null;
}

export interface HubSnapshot {
  squads: LocalSquadRecord[];
  rooms: Record<string, LocalQuizRoomState>;
  arcadeRooms: Record<string, LocalArcadeRoom>;
  buzzer: LocalBuzzerPacket | null;
  hostingSquadId: string | null;
}

export interface NearbyEvent {
  type: string;
  roomCode?: string;
  roomId?: string;
  buzz?: LocalBuzzerPacket | null;
  contextKey?: string | null;
  squad?: LocalSquadRecord;
  message?: ChatMessage;
  fromTab?: string;
}

function readHubState(): HubStorageState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { squads: {}, rooms: {}, arcadeRooms: {}, buzzer: null };
    const parsed = JSON.parse(raw) as Partial<HubStorageState>;
    return {
      squads: parsed.squads || {},
      rooms: parsed.rooms || {},
      arcadeRooms: parsed.arcadeRooms || {},
      buzzer: parsed.buzzer || null,
    };
  } catch {
    return { squads: {}, rooms: {}, arcadeRooms: {}, buzzer: null };
  }
}

function writeHubState(state: HubStorageState): void {
  try {
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
  } catch {
    // Ignore quota/storage errors
  }
}

class NearbySyncService {
  public readonly tabId: string;
  private channel: BroadcastChannel | null;
  private listeners = new Set<(event: NearbyEvent, snapshot: HubSnapshot) => void>();
  public hostingSquadId: string | null = null;

  constructor() {
    this.tabId = `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.channel =
      typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(CHANNEL_NAME)
        : null;

    if (this.channel) {
      this.channel.onmessage = (ev) => {
        this.notify(ev.data as NearbyEvent);
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (ev) => {
        if (ev.key === STATE_KEY) {
          this.notify({ type: 'STATE_SYNC' });
        }
      });
    }
  }

  subscribe(fn: (event: NearbyEvent, snapshot: HubSnapshot) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(event: NearbyEvent): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(event, snap);
      } catch {
        // Ignore subscriber error
      }
    });
  }

  private broadcast(payload: NearbyEvent): void {
    if (this.channel) {
      try {
        this.channel.postMessage({ ...payload, fromTab: this.tabId });
      } catch {
        // Ignore BroadcastChannel error
      }
    }
    this.notify(payload);
  }

  getSnapshot(): HubSnapshot {
    const state = readHubState();
    return {
      squads: Object.values(state.squads || {}).sort(
        (a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0)
      ),
      rooms: state.rooms || {},
      arcadeRooms: state.arcadeRooms || {},
      buzzer: state.buzzer || null,
      hostingSquadId: this.hostingSquadId,
    };
  }

  upsertActiveArcadeRoom({
    roomId,
    gameMode,
    gameTitle,
    teamScores = {},
    teamMeta = {},
    activeTeamName = '',
  }: {
    roomId: string;
    gameMode?: string;
    gameTitle?: string;
    teamScores?: Record<string, number>;
    teamMeta?: Record<string, { name?: string; motto?: string; accentColor?: string }>;
    activeTeamName?: string;
  }): LocalArcadeRoom | null {
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
      updatedAtMs: Date.now(),
    };
    writeHubState(state);
    this.broadcast({ type: 'ARCADE_ROOM_SYNC', roomId: id });
    return state.arcadeRooms[id];
  }

  removeActiveArcadeRoom(roomId: string): void {
    const id = String(roomId || '').trim();
    if (!id) return;
    const state = readHubState();
    if (state.arcadeRooms[id]) {
      delete state.arcadeRooms[id];
      writeHubState(state);
      this.broadcast({ type: 'ARCADE_ROOM_SYNC', roomId: id });
    }
  }

  sendBuzzerEvent(buzzPayload: LocalBuzzerPacket | null): LocalBuzzerPacket | null {
    const state = readHubState();
    const buzz: LocalBuzzerPacket | null = buzzPayload
      ? { ...buzzPayload, updatedAtMs: Date.now() }
      : null;
    state.buzzer = buzz;
    writeHubState(state);
    this.broadcast({ type: 'TEAM_BUZZER', buzz });
    return buzz;
  }

  clearBuzzerEvent(contextKey: string | null = null): void {
    const state = readHubState();
    if (!state.buzzer || !contextKey || state.buzzer.contextKey === contextKey) {
      state.buzzer = null;
      writeHubState(state);
      this.broadcast({ type: 'TEAM_BUZZER', buzz: null, contextKey });
    }
  }

  hostSquad({ team, hostName }: { team: Team; hostName: string }): LocalSquadRecord {
    const state = readHubState();
    const id = team.id;
    state.squads[id] = {
      ...team,
      leaderName: hostName || team.leaderName || 'Squad Host',
      accentColor: team.accentColor || 'INDIGO',
      channelKind: team.channelKind || 'TEAM',
      memberCount: team.memberCount || 1,
      hostTabId: this.tabId,
      updatedAtMs: Date.now(),
    };
    writeHubState(state);
    this.hostingSquadId = id;
    this.broadcast({ type: 'SQUAD_HOSTED', squad: state.squads[id] });
    return state.squads[id];
  }

  stopHostingSquad(): void {
    if (!this.hostingSquadId) return;
    const state = readHubState();
    delete state.squads[this.hostingSquadId];
    writeHubState(state);
    this.hostingSquadId = null;
    this.broadcast({ type: 'STATE_SYNC' });
  }

  sendSquadMessage(message: ChatMessage): void {
    const state = readHubState();
    if (state.squads[message.teamId]) {
      state.squads[message.teamId].updatedAtMs = Date.now();
      writeHubState(state);
    }
    this.broadcast({ type: 'SQUAD_MESSAGE', message });
  }

  createLocalQuizRoom({
    hostUid,
    hostName,
    quizTitle,
    cefrLevel,
    questions,
  }: {
    hostUid: string;
    hostName: string;
    quizTitle: string;
    cefrLevel: CefrLevel | string;
    questions: QuizQuestion[];
  }): LocalQuizRoomState {
    const state = readHubState();
    let code = generatePin6();
    while (state.rooms[code]) code = generatePin6();
    const room: LocalQuizRoomState = {
      id: code,
      roomCode: code,
      hostUid,
      hostName,
      quizTitle,
      cefrLevel,
      status: RoomStatus.LOBBY,
      currentQuestionIndex: 0,
      questionStartedAtMs: 0,
      questions: questions.slice(0, 60),
      leaderboard: [],
      players: {},
      messages: [],
      updatedAtMs: Date.now(),
    };
    state.rooms[code] = room;
    writeHubState(state);
    this.broadcast({ type: 'ROOM_UPDATED', roomCode: code });
    return room;
  }

  closeLocalQuizRoom(roomCode: string): void {
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!clean) return;
    const state = readHubState();
    if (state.rooms[clean]) {
      delete state.rooms[clean];
      writeHubState(state);
    }
    this.broadcast({ type: 'ROOM_CLOSED', roomCode: clean });
  }

  getLocalQuizRoom(roomCode: string): LocalQuizRoomState | null {
    const clean = String(roomCode || '').trim().toUpperCase();
    return readHubState().rooms[clean] || null;
  }

  joinLocalQuizRoom({
    roomCode,
    playerUid,
    nickname,
    avatarColor,
    teamId = '',
    teamName = '',
  }: {
    roomCode: string;
    playerUid: string;
    nickname: string;
    avatarColor: string;
    teamId?: string;
    teamName?: string;
  }): LocalQuizRoomState {
    const clean = String(roomCode || '').trim().toUpperCase();
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room) throw new Error(`No local squad room found for PIN ${clean}.`);
    if (room.status === RoomStatus.PODIUM) {
      throw new Error('This quiz round has already finished.');
    }
    if (!room.players[playerUid]) {
      room.players[playerUid] = {
        uid: playerUid,
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
        lastPointsEarned: 0,
      };
    } else {
      room.players[playerUid].nickname = nickname || room.players[playerUid].nickname;
      room.players[playerUid].avatarColor = avatarColor || room.players[playerUid].avatarColor;
      if (teamId) room.players[playerUid].teamId = String(teamId);
      if (teamName) room.players[playerUid].teamName = String(teamName);
    }
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this.broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
    return room;
  }

  /**
   * Removes the player silently from the room roster WITHOUT writing a [LEAVE|...]
   * message to room.messages, so only the host's departure diff detects and floats an alert.
   */
  leaveLocalQuizRoom({
    roomCode,
    playerUid,
  }: {
    roomCode: string;
    playerUid: string;
  }): LocalQuizRoomState | null {
    const clean = String(roomCode || '').trim().toUpperCase();
    if (!clean || !playerUid) return null;
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room) return null;
    if (room.players && room.players[playerUid]) {
      delete room.players[playerUid];
    }
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this.broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
    return room;
  }

  submitLocalRoomAnswer({
    roomCode,
    playerUid,
    questionIndex,
    selectedIndex,
    correct,
    pointsEarned,
    newScore,
    newStreak,
  }: {
    roomCode: string;
    playerUid: string;
    questionIndex: number;
    selectedIndex: number;
    correct: boolean;
    pointsEarned: number;
    newScore: number;
    newStreak: number;
  }): void {
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
    this.broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
  }

  advanceLocalRoomPhase({
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
  }): void {
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
    this.broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
  }

  sendLocalRoomMessage({
    roomCode,
    senderUid,
    senderName,
    avatarColor,
    hostSender,
    messageType,
    text,
  }: {
    roomCode: string;
    senderUid: string;
    senderName: string;
    avatarColor: string;
    hostSender: boolean;
    messageType: 'TEXT' | 'REACTION';
    text: string;
  }): void {
    const clean = String(roomCode || '').trim().toUpperCase();
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room) return;
    const msg: RoomChatMessage = {
      id: `rmsg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      roomCode: clean,
      senderUid,
      senderName,
      avatarColor,
      hostSender: Boolean(hostSender),
      messageType: messageType || 'TEXT',
      text,
      createdAtMs: Date.now(),
    };
    room.messages = [...(room.messages || []), msg].slice(-80);
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this.broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
  }

  rematchLocalQuizRoom({
    roomCode,
    questions,
  }: {
    roomCode: string;
    questions?: QuizQuestion[];
  }): LocalQuizRoomState | null {
    const clean = String(roomCode || '').trim().toUpperCase();
    const state = readHubState();
    const room = state.rooms[clean];
    if (!room) return null;
    room.status = RoomStatus.LOBBY;
    room.currentQuestionIndex = 0;
    room.questionStartedAtMs = 0;
    room.leaderboard = [];
    if (Array.isArray(questions) && questions.length > 0) {
      room.questions = questions.slice(0, 60);
    }
    for (const uid of Object.keys(room.players || {})) {
      room.players[uid] = {
        ...room.players[uid],
        score: 0,
        streak: 0,
        lastAnswerIndex: -1,
        lastAnsweredQuestion: -1,
        lastAnswerCorrect: false,
        lastPointsEarned: 0,
      };
    }
    room.updatedAtMs = Date.now();
    writeHubState(state);
    this.broadcast({ type: 'ROOM_UPDATED', roomCode: clean });
    return room;
  }

  broadcastSquadRosterUpdate(teamId: string): void {
    this.broadcast({ type: 'SQUAD_ROSTER_SYNC', roomId: teamId });
  }
}

export const nearbySync = new NearbySyncService();
