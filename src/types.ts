export enum CefrLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum RoomStatus {
  LOBBY = 'LOBBY',
  QUESTION = 'QUESTION',
  REVEAL = 'REVEAL',
  PODIUM = 'PODIUM',
}

export enum ActivityType {
  QUIZ = 'QUIZ',
  PUZZLE = 'PUZZLE',
  CARDS = 'CARDS',
  GUESSING = 'GUESSING',
  ROLEPLAY = 'ROLEPLAY',
  AUDIOBOOK = 'AUDIOBOOK',
  WEEKLY_SESSION = 'WEEKLY_SESSION',
  GAME = 'GAME',
}

export enum VocabDomain {
  MEDICAL = 'MEDICAL',
  ENGINEERING = 'ENGINEERING',
  SOFTWARE = 'SOFTWARE',
  BUSINESS = 'BUSINESS',
  EVERYDAY = 'EVERYDAY',
  ACADEMIC = 'ACADEMIC',
  LEGAL = 'LEGAL',
}

export type AppRoute =
  | 'auth'
  | 'home'
  | 'quiz'
  | 'arcade'
  | 'leaderboard'
  | 'teams'
  | 'curriculum'
  | 'audiobooks'
  | 'chat'
  | 'profile'
  | 'puzzles'
  | 'cards'
  | 'guessing'
  | 'roleplay'
  | 'dictionary';

export interface DifficultyPreset {
  id: DifficultyLevel;
  label: string;
  short: string;
  timeLimitSec: number;
  xpMultiplier: number;
  maxAttempts: number;
  description: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  timeLimitSec?: number;
  tip?: string;
}

export interface QuizPack {
  id: string;
  title: string;
  topic: string;
  cefrLevel: CefrLevel | string;
  language?: 'EN' | 'AR';
  difficulty?: DifficultyLevel | string;
  description?: string;
  customPrompt?: string;
  questions: QuizQuestion[];
  source?: string;
  createdAtMs?: number;
}

export interface FlashcardItem {
  term: string;
  translation?: string;
  meaning?: string;
  pronunciation?: string;
  phonetic?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  example?: string;
  teachingTip?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cefrLevel: CefrLevel | string;
  cards: FlashcardItem[];
  createdAtMs?: number;
}

export interface SentencePuzzle {
  id: string;
  topic?: string;
  cefrLevel: CefrLevel | string;
  tokens: string[];
  hint?: string;
  promptHint?: string;
  explanation?: string;
}

export interface MatchPuzzlePair {
  id?: string;
  left: string;
  right: string;
}

export interface MatchPuzzleSet {
  id: string;
  title: string;
  cefrLevel: CefrLevel | string;
  pairs: MatchPuzzlePair[];
  teachingTip?: string;
}

export interface ClozePuzzle {
  id: string;
  topic?: string;
  cefrLevel: CefrLevel | string;
  before?: string;
  after?: string;
  beforeBlank?: string;
  afterBlank?: string;
  answer?: string;
  correctWord?: string;
  options: string[];
  explanation: string;
}

export interface GuessingPrompt {
  word: string;
  arabicHint?: string;
  actClue?: string;
  clueHint?: string;
  category?: string;
  forbiddenWords?: string[];
  tabooWords?: string[];
}

export interface GuessingPack {
  id: string;
  title: string;
  category?: string;
  modeLabel?: string;
  description?: string;
  cefrLevel: CefrLevel | string;
  prompts?: GuessingPrompt[];
  cards?: GuessingPrompt[];
}

export interface RoleplayHighlight {
  phrase: string;
  meaning: string;
  example?: string;
}

export interface RoleplayLine {
  speakerRole: 'A' | 'B';
  text: string;
  keyHint?: string;
  highlights?: RoleplayHighlight[];
}

export interface RoleplayScenario {
  id: string;
  title: string;
  setting: string;
  cefrLevel: CefrLevel | string;
  roleAName: string;
  roleBName: string;
  goal: string;
  source?: 'AI' | 'OFFLINE';
  lines: RoleplayLine[];
  plotTwists: string[];
  createdAtMs?: number;
}

export interface AudiobookParagraph {
  id: string;
  english: string;
  arabic: string;
  keyVocabulary?: string[];
}

export interface AudiobookChapter {
  id?: string;
  chapterNumber?: number;
  title: string;
  durationMin?: number;
  arabicSummary?: string;
  paragraphs: Array<AudiobookParagraph | string>;
  keyVocabulary?: string[];
  reflectionPrompt?: string;
}

export interface AudiobookItem {
  id: string;
  title: string;
  arabicTitle?: string;
  subtitle?: string;
  narrator?: string;
  genre?: string;
  cefrLevel: CefrLevel | string;
  durationMinutes?: number;
  synopsis?: string;
  chapters: AudiobookChapter[];
}

export interface WeeklyWord {
  id: string;
  word?: string;
  english?: string;
  arabic: string;
  meaning?: string;
  phonetic?: string;
  exampleSentence?: string;
  storyLine?: string;
  cefrLevel?: CefrLevel | string;
  domain: VocabDomain | string;
  sessionNumber: number;
}

export interface WeeklySessionInfo {
  sessionNumber: number;
  dayLabel?: string;
  title: string;
  storyTitle?: string;
  storyOpening?: string;
  storyClosing?: string;
  storyParagraphs?: string[];
  storyPrompt?: string;
  teachingTip?: string;
}

export interface WeeklyCurriculumWeek {
  weekNumber: number;
  title: string;
  cefrLevel?: string;
  subtitle?: string;
  theme?: string;
  themeStory?: string;
  sessions: WeeklySessionInfo[];
  words: WeeklyWord[];
}

export interface DictionaryEntry {
  id: string;
  english: string;
  arabic: string;
  meaning?: string;
  partOfSpeech?: string;
  cefrLevel: CefrLevel | string;
  levelLabel?: string;
  category?: string;
  topic?: string;
  phonetic?: string;
  transliteration?: string;
  example?: string;
  exampleEn?: string;
  exampleAr?: string;
}

export interface CrimeSuspect {
  id: string;
  name: string;
  role: string;
  alibi: string;
  suspiciousDetail: string;
  isGuilty: boolean;
}

export interface CrimeCase {
  id: string;
  title: string;
  cefrLevel: CefrLevel | string;
  crimeType?: string;
  crimeSceneSummary?: string;
  summary?: string;
  clues?: string[];
  question?: string;
  suspects: CrimeSuspect[];
  correctSuspectId: string;
  detectiveClue: string;
  vocabularyTip: string;
}

export interface EvidenceCardItem {
  id: string;
  title: string;
  category: string;
  cefrLevel: CefrLevel | string;
  description?: string;
  englishClue?: string;
  arabicMeaning?: string;
  arabicTag?: string;
  summary?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  learningLevel: CefrLevel | string;
  xp: number;
  streak: number;
  quizzesHosted: number;
  quizzesPlayed: number;
  cardsMastered: number;
  sessionsCompleted: number;
  audiobooksFinished: number;
  weeklyWordsMastered: number;
  bestLiveQuizScore: number;
  earnedBadges: string[];
  pinnedEvidenceIds: string[];
  teamId: string;
  teamName: string;
  sfxMuted?: boolean;
  sfxVolume?: number;
  lastActiveEpochDay: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  displayName: string;
  avatarColor: string;
  role: 'CAPTAIN' | 'PLAYER' | string;
  memberUid?: string;
  addedByUid?: string;
  createdAtMs?: number;
}

export interface Team {
  id: string;
  visibility?: string;
  name: string;
  cefrLevel: CefrLevel | string;
  motto: string;
  accentColor: 'INDIGO' | 'CORAL' | 'AMBER' | 'MINT' | 'PURPLE' | string;
  leaderUid: string;
  leaderName: string;
  channelKind: 'TEAM' | 'CLUB' | string;
  memberCount: number;
  createdAtMs?: number;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  senderUid: string;
  senderName: string;
  senderTeamName: string;
  senderRole: 'LEADER' | 'PLAYER' | string;
  text: string;
  pinned: boolean;
  createdAtMs: number;
}

export interface RoomPlayer {
  uid: string;
  playerUid?: string;
  roomCode?: string;
  hostUid?: string;
  nickname: string;
  avatarColor: string;
  teamId?: string;
  teamName?: string;
  score: number;
  streak: number;
  lastAnswerIndex: number;
  lastAnsweredQuestion: number;
  lastAnswerCorrect: boolean;
  lastPointsEarned: number;
}

export interface RoomChatMessage {
  id: string;
  roomCode: string;
  senderUid: string;
  senderName: string;
  avatarColor: string;
  hostSender: boolean;
  messageType: 'TEXT' | 'REACTION';
  text: string;
  createdAtMs: number;
}

export interface QuizRoom {
  roomCode: string;
  hostUid: string;
  hostName: string;
  quizTitle: string;
  cefrLevel: CefrLevel | string;
  status: RoomStatus | string;
  currentQuestionIndex: number;
  questionStartedAtMs: number;
  questions: QuizQuestion[];
  leaderboard: RoomPlayer[];
}

export interface RoomSession {
  mode: 'LOCAL' | 'CLOUD';
  roomCode: string;
  isHost: boolean;
  nickname: string;
  avatarColor: string;
  room: QuizRoom | null;
  players: RoomPlayer[];
  roomMessages: RoomChatMessage[];
  answeredQuestionIndex: number;
  selectedOptionIndex: number | null;
}

export interface HostAlert {
  id: string;
  playerUid: string;
  nickname: string;
  roomCode: string;
  message: string;
  createdAtMs: number;
}

export interface TeamBuzzerState {
  open: boolean;
  contextKey: string;
  title: string;
  prompt: string;
  teams: Team[];
  activeBuzz: {
    teamId: string;
    teamName: string;
    playerUid: string;
    playerName: string;
    avatarColor: string;
    lockUntilMs: number;
  } | null;
  sessionScores: Record<string, number>;
  buzzHistory: Array<{
    id: string;
    teamId: string;
    teamName: string;
    playerName: string;
    outcome: 'PENDING' | 'AWARDED' | 'WRONG' | 'TIMEOUT';
    pointsDelta: number;
    atMs: number;
  }>;
}

export interface RevealStandingEntry {
  playerUid: string;
  nickname: string;
  avatarColor: string;
  score: number;
  streak: number;
  lastPointsEarned: number;
  lastAnswerCorrect: boolean;
  answeredThisQuestion: boolean;
  rank: number;
  isCurrentUser: boolean;
}

export interface GlobalTeamEntry {
  id: string;
  name: string;
  motto: string;
  accentColor: string;
  memberCount: number;
  totalPoints: number;
  livePoints: number;
  basePoints: number;
  gamesCount: number;
  activeRoomsCount: number;
  isMine: boolean;
}

export interface ScoreRecord {
  id?: string;
  userId: string;
  playerName: string;
  avatarColor: string;
  teamId?: string;
  teamName?: string;
  quizTitle: string;
  cefrLevel: string;
  score: number;
  accuracyPct: number;
  streak: number;
  gameMode: string;
  createdAtMs?: number;
}

export interface SessionRecord {
  id?: string;
  activityType: ActivityType | string;
  title: string;
  cefrLevel: string;
  score: number;
  accuracyPct: number;
  wordsPracticed: number;
  durationMinutes: number;
  createdAtMs?: number;
}

export interface WeeklyProgressRecord {
  weekNumber: number;
  masteredWordIds: string[];
  completedSessions: number[];
  gamesPlayed: number;
}

export interface TeamContribution {
  teamId: string;
  teamName: string;
  playerName: string;
  avatarColor: string;
  points: number;
  title: string;
  gameMode: string;
  cefrLevel: string;
  accuracyPct: number;
  createdAtMs: number;
}

export type StickerCategoryId =
  | 'RECENTS'
  | 'MASCOT'
  | 'REACTIONS'
  | 'VICTORY'
  | 'ARABIC'
  | 'ARCADE';

export interface StickerItem {
  id: string;
  category: Exclude<StickerCategoryId, 'RECENTS'>;
  emoji: string;
  label: string;
  keywords: string[];
  bg: string;
  accent: string;
  ink: string;
  anim: 'bounce' | 'wiggle' | 'pulse' | 'float';
  motif: 'trophy' | 'sparkles' | 'bolt' | 'rocket' | 'detective' | 'flame' | 'crown' | 'book' | 'shield' | 'coffee' | 'owl' | 'target';
}

export interface SpeechEvaluationResult {
  score: number;
  summary: string;
  clarityFeedback: string;
  naturalnessFeedback: string;
  practiceTip: string;
}

export interface ToastItem {
  id: string;
  message: string;
  kind: 'info' | 'badge' | 'error';
}
