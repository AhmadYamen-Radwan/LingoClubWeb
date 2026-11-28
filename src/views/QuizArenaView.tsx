import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityType,
  DifficultyLevel,
  QuizPack,
  RevealStandingEntry,
  RoomStatus,
} from '../types';
import { useApp } from '../context/AppContext';
import { ARABIC_QUIZ_PACKS, QUIZ_PACKS } from '../data/curatedContent';
import {
  AVATAR_COLOR_HEX,
  DIFFICULTY_CONFIG,
  DIFFICULTY_LEVELS,
  avatarColorForTag,
} from '../utils/constants';
import {
  buildRevealLeaderboardStandings,
  buildSoloBlitzStandings,
  computeAdaptiveDifficulty,
  computeQuizPointsEarned,
  prepareDynamicQuizQuestions,
  resolveQuestionLimitSec,
} from '../utils/quizLogic';
import { encodeStickerMessage, parseStickerMessage } from '../utils/gameLogic';
import { downloadQuizCsv, parseKahootCsv } from '../services/csvQuiz';
import { CefrBadge, AppHeroBanner } from '../components/CefrBadge';
import { QuizGeneratorCard } from '../components/QuizGeneratorCard';
import { StickerBubble, StickerPickerDrawer } from '../components/Stickers';
import { TrophyCanvas } from '../components/Canvas3D';

const RANK_MEDAL = (rank: number): string => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const PostQuestionLeaderboardPanel: React.FC<{
  title: string;
  standings: RevealStandingEntry[];
}> = ({ title, standings }) => {
  return (
    <section
      className="card stack-sm"
      aria-label="Post-question reveal leaderboard"
      data-testid="post-question-leaderboard"
      style={{ border: '1.5px solid var(--primary)', background: 'var(--surface)' }}
    >
      <div className="row-between row-wrap">
        <h3 className="card-title" style={{ margin: 0 }}>
          {title}
        </h3>
        <span className="xs muted">{standings.length} contender(s)</span>
      </div>

      {standings.length === 0 ? (
        <p className="small muted" style={{ margin: 0 }}>
          No players scored on this round yet.
        </p>
      ) : (
        <div className="stack-xs">
          {standings.slice(0, 8).map((entry) => {
            const colorHex = avatarColorForTag(entry.avatarColor);
            return (
              <div
                key={entry.playerUid}
                className={`gtl-row ${entry.rank === 1 ? 'leader' : ''} ${entry.isCurrentUser ? 'mine' : ''}`}
                data-testid={`reveal-standing-row-${entry.rank}`}
              >
                <span className="mono" style={{ width: 30, fontWeight: 800, textAlign: 'center' }}>
                  {RANK_MEDAL(entry.rank)}
                </span>
                <div className="gtl-avatar" style={{ background: colorHex }}>
                  {entry.nickname.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 stack-xs" style={{ gap: 2 }}>
                  <div className="row-between row-wrap">
                    <span className="small" style={{ fontWeight: 800 }}>
                      {entry.nickname} {entry.isCurrentUser ? '(You)' : ''}
                    </span>
                    <div className="row" style={{ gap: 6 }}>
                      {entry.answeredThisQuestion ? (
                        <span
                          className="badge-pill"
                          style={{
                            background: entry.lastAnswerCorrect ? 'var(--tertiary-soft)' : 'var(--secondary-soft)',
                            color: entry.lastAnswerCorrect ? 'var(--on-tertiary-soft)' : 'var(--on-secondary-soft)',
                          }}
                        >
                          {entry.lastAnswerCorrect ? `+${entry.lastPointsEarned}` : '+0'}
                        </span>
                      ) : null}
                      {entry.streak >= 2 ? (
                        <span className="badge-pill" style={{ background: 'var(--accent-soft)', color: 'var(--on-accent-soft)' }}>
                          🔥 {entry.streak}
                        </span>
                      ) : null}
                      <span className="mono small tabular-nums" style={{ fontWeight: 800 }}>
                        {entry.score.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

interface SoloRunState {
  quiz: QuizPack;
  index: number;
  score: number;
  streak: number;
  correctCount: number;
  selectedOption: number | null;
  revealed: boolean;
  lastPointsEarned: number;
  lastCorrect: boolean;
  timeRemaining: number;
  finished: boolean;
}

export const QuizArenaView: React.FC = () => {
  const {
    profile,
    customQuizzes,
    globalScores,
    saveCustomQuiz,
    deleteCustomQuiz,
    awardActivity,
    isOfflineMode,
    currentUid,
    roomSession,
    hostRoom,
    joinRoomByPin,
    leaveRoom,
    advanceRoomPhase,
    submitRoomAnswer,
    sendRoomChatMessage,
    deleteRoomChatMessage,
    toast,
    sfx,
    triggerConfetti,
  } = useApp();

  const [tab, setTab] = useState<'EN' | 'AR' | 'CUSTOM'>('EN');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [soloRun, setSoloRun] = useState<SoloRunState | null>(null);

  // Join form
  const [joinPin, setJoinPin] = useState('');
  const [joinNick, setJoinNick] = useState(profile.displayName || 'Explorer');
  const [joinColor, setJoinColor] = useState('INDIGO');
  const [joining, setJoining] = useState(false);

  // Room chat & WhatsApp Stickers
  const [roomChatText, setRoomChatText] = useState('');
  const [showRoomStickers, setShowRoomStickers] = useState(false);
  const [roomTimeLeft, setRoomTimeLeft] = useState<number>(20);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  // Live solo countdown
  useEffect(() => {
    if (!soloRun || soloRun.revealed || soloRun.finished) return;
    const timer = window.setInterval(() => {
      setSoloRun((prev) => {
        if (!prev || prev.revealed || prev.finished) return prev;
        if (prev.timeRemaining <= 1) {
          sfx.playReveal();
          return {
            ...prev,
            timeRemaining: 0,
            revealed: true,
            lastPointsEarned: 0,
            lastCorrect: false,
            streak: 0,
          };
        }
        if (prev.timeRemaining <= 5) {
          sfx.playTick();
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sfx, soloRun?.finished, soloRun?.index, soloRun?.revealed]);

  // Live room question countdown clock
  useEffect(() => {
    if (!roomSession?.room || roomSession.room.status !== RoomStatus.QUESTION) return;
    const q = roomSession.room.questions[roomSession.room.currentQuestionIndex];
    const limit = resolveQuestionLimitSec(q, difficulty);
    const update = () => {
      const elapsedSec = Math.floor((Date.now() - (roomSession.room?.questionStartedAtMs || Date.now())) / 1000);
      setRoomTimeLeft(Math.max(0, limit - elapsedSec));
    };
    update();
    const id = window.setInterval(update, 400);
    return () => window.clearInterval(id);
  }, [difficulty, roomSession?.room?.currentQuestionIndex, roomSession?.room?.questionStartedAtMs, roomSession?.room?.status]);

  const startSoloBlitz = (pack: QuizPack) => {
    const prepared = {
      ...pack,
      questions: prepareDynamicQuizQuestions(pack.questions),
    };
    const firstLimit = resolveQuestionLimitSec(prepared.questions[0], difficulty);
    sfx.playClick();
    setSoloRun({
      quiz: prepared,
      index: 0,
      score: 0,
      streak: 0,
      correctCount: 0,
      selectedOption: null,
      revealed: false,
      lastPointsEarned: 0,
      lastCorrect: false,
      timeRemaining: firstLimit,
      finished: false,
    });
  };

  const handleSoloSelect = (optIdx: number) => {
    if (!soloRun || soloRun.revealed || soloRun.finished) return;
    const q = soloRun.quiz.questions[soloRun.index];
    const isCorrect = optIdx === Number(q.correctIndex);
    const limit = resolveQuestionLimitSec(q, difficulty);
    const nextStreak = isCorrect ? soloRun.streak + 1 : 0;
    const earned = computeQuizPointsEarned(isCorrect, soloRun.timeRemaining, limit, nextStreak);
    const diffMult = DIFFICULTY_CONFIG[difficulty].xpMultiplier;
    const finalEarned = Math.round(earned * diffMult);

    if (isCorrect) sfx.playSuccess();
    else sfx.playError();

    setSoloRun({
      ...soloRun,
      selectedOption: optIdx,
      revealed: true,
      lastCorrect: isCorrect,
      lastPointsEarned: finalEarned,
      score: soloRun.score + finalEarned,
      streak: nextStreak,
      correctCount: soloRun.correctCount + (isCorrect ? 1 : 0),
    });
  };

  const handleSoloNext = () => {
    if (!soloRun) return;
    const nextIdx = soloRun.index + 1;
    if (nextIdx >= soloRun.quiz.questions.length) {
      const accuracyPct = Math.round((soloRun.correctCount / soloRun.quiz.questions.length) * 100);
      sfx.playFanfare();
      triggerConfetti();
      void awardActivity({
        activityType: ActivityType.QUIZ,
        title: soloRun.quiz.title,
        cefrLevel: soloRun.quiz.cefrLevel,
        score: soloRun.score,
        xpDelta: Math.max(40, Math.round(soloRun.score / 25)),
        accuracyPct,
        wordsPracticed: soloRun.quiz.questions.length,
        quizzesPlayedDelta: 1,
        bestLiveQuizScoreCandidate: soloRun.score,
        publishLeaderboard: true,
        gameMode: 'SOLO_BLITZ',
      });
      setSoloRun({ ...soloRun, finished: true });
      return;
    }

    const accuracyNow = Math.round((soloRun.correctCount / nextIdx) * 100);
    const adapted = computeAdaptiveDifficulty(soloRun.streak, accuracyNow);
    const nextLimit = resolveQuestionLimitSec(soloRun.quiz.questions[nextIdx], adapted);
    sfx.playClick();
    setSoloRun({
      ...soloRun,
      index: nextIdx,
      selectedOption: null,
      revealed: false,
      lastPointsEarned: 0,
      lastCorrect: false,
      timeRemaining: nextLimit,
    });
  };

  const handleHostQuiz = async (pack: QuizPack, mode: 'LOCAL' | 'CLOUD') => {
    sfx.playClick();
    try {
      const prepared = prepareDynamicQuizQuestions(pack.questions);
      const pin = await hostRoom({
        mode,
        quizTitle: pack.title,
        cefrLevel: pack.cefrLevel,
        questions: prepared,
      });
      toast(`Room ${pin} open (${mode === 'LOCAL' ? 'Cross-Tab Local' : 'Cloud Live'})!`, 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not host room.', 'error');
    }
  };

  const handleJoinForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinPin.trim().length !== 6) {
      toast('Enter a 6-character Room PIN.', 'error');
      return;
    }
    setJoining(true);
    try {
      await joinRoomByPin({
        roomCode: joinPin,
        nickname: joinNick,
        avatarColor: joinColor,
      });
      sfx.playSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not join room.', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseKahootCsv(text, {
        title: file.name.replace(/\.csv$/i, ''),
        cefrLevel: profile.learningLevel,
      });
      await saveCustomQuiz(parsed);
      setTab('CUSTOM');
      sfx.playSuccess();
      toast(`Imported ${parsed.questions.length} questions from CSV!`, 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Invalid Kahoot CSV.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const soloRevealStandings = useMemo(() => {
    if (!soloRun) return [];
    return buildSoloBlitzStandings({
      currentUid,
      playerName: profile.displayName,
      avatarColor: 'INDIGO',
      liveScore: soloRun.score,
      lastPointsEarned: soloRun.lastPointsEarned,
      streak: soloRun.streak,
      isCorrect: soloRun.lastCorrect,
      recentRecords: globalScores,
    });
  }, [currentUid, globalScores, profile.displayName, soloRun]);

  // --- LIVE ROOM ACTIVE VIEW ---
  if (roomSession?.room) {
    const { room, players, roomMessages, isHost, answeredQuestionIndex, selectedOptionIndex } = roomSession;
    const q = room.questions[room.currentQuestionIndex];
    const hasAnsweredCurrent = answeredQuestionIndex === room.currentQuestionIndex;
    const answeredCount = players.filter(
      (p) => Number(p.lastAnsweredQuestion ?? -1) === room.currentQuestionIndex
    ).length;

    const revealStandings = buildRevealLeaderboardStandings(
      players,
      room.leaderboard || [],
      room.currentQuestionIndex,
      currentUid
    );

    const handlePlayerAnswer = async (optIdx: number) => {
      if (!q || hasAnsweredCurrent || room.status !== RoomStatus.QUESTION) return;
      const me = players.find((p) => (p.playerUid || p.uid) === currentUid);
      const curStreak = Number(me?.streak || 0);
      const isCorrect = optIdx === Number(q.correctIndex);
      const nextStreak = isCorrect ? curStreak + 1 : 0;
      const limit = resolveQuestionLimitSec(q, difficulty);
      const points = computeQuizPointsEarned(isCorrect, roomTimeLeft, limit, nextStreak);
      await submitRoomAnswer(optIdx, isCorrect, points, nextStreak);
    };

    const handleSendRoomChat = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!roomChatText.trim()) return;
      sfx.playClick();
      await sendRoomChatMessage(roomChatText.trim(), 'TEXT');
      setRoomChatText('');
    };

    return (
      <div className="stack-lg">
        {/* Room Header */}
        <div className="card card-soft-primary row-between row-wrap">
          <div className="stack-xs">
            <div className="row-wrap">
              <span className="badge-pill" style={{ background: 'var(--primary)', color: '#FFFFFF' }}>
                PIN: <span className="mono" data-testid="live-room-pin">{room.roomCode}</span>
              </span>
              <CefrBadge level={room.cefrLevel} />
              <span className="badge-pill">{isHost ? '🎙️ Host View' : '🙋 Player View'}</span>
              <span className="badge-pill">{roomSession.mode}</span>
            </div>
            <h1 className="section-title" style={{ margin: 0 }}>
              {room.quizTitle}
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-danger-soft btn-sm"
            onClick={() => void leaveRoom()}
          >
            {isHost ? 'Close Room' : 'Leave Room'}
          </button>
        </div>

        {/* LOBBY PHASE */}
        {room.status === RoomStatus.LOBBY ? (
          <div className="card stack-md">
            <div className="row-between row-wrap">
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>
                  Waiting Lobby ({players.length} joined)
                </h2>
                <span className="small muted">
                  Share PIN <strong className="mono">{room.roomCode}</strong> so friends can join from another tab or device.
                </span>
              </div>
              {isHost ? (
                <button
                  type="button"
                  className="btn btn-mint"
                  onClick={() => void advanceRoomPhase(RoomStatus.QUESTION, 0)}
                >
                  ▶ Start Question 1
                </button>
              ) : (
                <span className="badge-pill">Waiting for host {room.hostName} to start...</span>
              )}
            </div>

            {players.length === 0 ? (
              <p className="small muted" style={{ margin: 0 }}>
                No contenders in the lobby yet. Invite friends with PIN {room.roomCode}!
              </p>
            ) : (
              <div className="row-wrap">
                {players.map((p) => (
                  <div key={p.playerUid || p.uid} className="badge-pill" style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: avatarColorForTag(p.avatarColor),
                        display: 'inline-block',
                      }}
                    />
                    <span>{p.nickname}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* QUESTION PHASE */}
        {room.status === RoomStatus.QUESTION && q ? (
          <div className="card stack-md">
            <div className="row-between row-wrap">
              <span className="mono small" style={{ fontWeight: 800 }}>
                Question {room.currentQuestionIndex + 1} / {room.questions.length}
              </span>
              <div className="row" style={{ gap: 10 }}>
                <span className="badge-pill">
                  {answeredCount}/{players.length} answered
                </span>
                <span className="mono badge-pill tabular-nums" style={{ fontWeight: 800 }}>
                  ⏱ {roomTimeLeft}s
                </span>
              </div>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, Math.round((roomTimeLeft / resolveQuestionLimitSec(q, difficulty)) * 100))}%`,
                }}
              />
            </div>

            <h2 className="section-title" style={{ margin: 0 }}>
              {q.prompt}
            </h2>

            <div className="kahoot-grid">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={hasAnsweredCurrent}
                  onClick={() => void handlePlayerAnswer(idx)}
                  className={`kahoot-tile c-${idx % 4} ${
                    hasAnsweredCurrent && selectedOptionIndex !== idx ? 'dimmed' : ''
                  } ${selectedOptionIndex === idx ? 'selected-ring' : ''}`}
                >
                  <span>{opt}</span>
                </button>
              ))}
            </div>

            {hasAnsweredCurrent ? (
              <div className="card card-soft-primary" style={{ padding: 12 }}>
                <span className="small" style={{ fontWeight: 700 }}>
                  Answer locked in! Waiting for host to reveal scores & standings...
                </span>
              </div>
            ) : null}

            {isHost ? (
              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void advanceRoomPhase(RoomStatus.REVEAL, room.currentQuestionIndex)}
                >
                  Reveal Answer & Standings →
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* REVEAL PHASE + POST-QUESTION LEADERBOARD */}
        {room.status === RoomStatus.REVEAL && q ? (
          <div className="stack-md">
            <div className="card stack-md">
              <div className="row-between">
                <span className="mono small" style={{ fontWeight: 800 }}>
                  Answer Revealed · Q{room.currentQuestionIndex + 1}
                </span>
                <span className="badge-pill" style={{ background: 'var(--tertiary-soft)', color: 'var(--on-tertiary-soft)' }}>
                  ✓ {q.options[q.correctIndex]}
                </span>
              </div>
              <h2 className="section-title" style={{ margin: 0 }}>
                {q.prompt}
              </h2>
              {q.tip ? (
                <div className="card card-soft-mint" style={{ padding: 12 }}>
                  <span className="small">💡 {q.tip}</span>
                </div>
              ) : null}

              {isHost ? (
                <div className="row-wrap">
                  {room.currentQuestionIndex + 1 < room.questions.length ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void advanceRoomPhase(RoomStatus.QUESTION, room.currentQuestionIndex + 1)}
                    >
                      Next Question ({room.currentQuestionIndex + 2}/{room.questions.length}) →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-mint"
                      onClick={() => void advanceRoomPhase(RoomStatus.PODIUM, room.currentQuestionIndex)}
                    >
                      🏆 Show Final Podium
                    </button>
                  )}
                </div>
              ) : (
                <span className="small muted">Waiting for host to advance to the next question...</span>
              )}
            </div>

            <PostQuestionLeaderboardPanel
              title={`Leaderboard After Question ${room.currentQuestionIndex + 1}`}
              standings={revealStandings}
            />
          </div>
        ) : null}

        {/* PODIUM PHASE */}
        {room.status === RoomStatus.PODIUM ? (
          <div className="card stack-md" style={{ alignItems: 'center', textAlign: 'center' }}>
            <TrophyCanvas size={112} />
            <h2 className="display-title" style={{ margin: 0 }}>
              Final Club Podium!
            </h2>
            <div style={{ width: '100%' }}>
              <PostQuestionLeaderboardPanel title="Final Rankings" standings={revealStandings} />
            </div>
            <button type="button" className="btn btn-primary" onClick={() => void leaveRoom()}>
              Exit Podium
            </button>
          </div>
        ) : null}

        {/* LIVE ROOM CHAT & WHATSAPP STICKERS */}
        <section className="card stack-sm" aria-label="Room chat and stickers">
          <div className="row-between">
            <h3 className="card-title" style={{ margin: 0 }}>
              Room Chat & Stickers
            </h3>
            <span className="xs muted">{roomMessages.length} message(s)</span>
          </div>

          <div className="chat-scroll card" style={{ padding: 10, maxHeight: 240 }}>
            {roomMessages.length === 0 ? (
              <p className="small muted" style={{ textAlign: 'center', margin: '12px 0' }}>
                Drop a cheer or WhatsApp sticker during the round!
              </p>
            ) : (
              roomMessages.map((m) => {
                const mine = m.senderUid === currentUid;
                const st = parseStickerMessage(m.text);
                return (
                  <div key={m.id} className={`chat-bubble ${mine ? 'mine' : ''}`}>
                    <div className="row-between" style={{ gap: 8, marginBottom: 4 }}>
                      <span className="xs muted" style={{ fontWeight: 700 }}>
                        {m.senderName} {m.hostSender ? '· Host' : ''}
                      </span>
                      {(mine || isHost) ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ minHeight: 24, padding: '0 6px', fontSize: '0.72rem' }}
                          aria-label={`Delete message from ${m.senderName}`}
                          onClick={() => void deleteRoomChatMessage(m.id)}
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    {st ? (
                      <StickerBubble stickerId={st.id} label={st.label} emoji={st.emoji} />
                    ) : (
                      <span>{m.text}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {showRoomStickers ? (
            <StickerPickerDrawer
              onClose={() => setShowRoomStickers(false)}
              onSelect={(st) => {
                void sendRoomChatMessage(encodeStickerMessage(st), 'REACTION');
                setShowRoomStickers(false);
              }}
            />
          ) : null}

          <form onSubmit={handleSendRoomChat} className="row">
            <button
              type="button"
              className="btn-icon"
              aria-label="Open room stickers"
              onClick={() => {
                sfx.playClick();
                setShowRoomStickers((v) => !v);
              }}
            >
              😊
            </button>
            <input
              type="text"
              className="field flex-1"
              value={roomChatText}
              onChange={(e) => setRoomChatText(e.target.value)}
              placeholder="Send a reaction or chat line..."
              aria-label="Room chat message"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Send
            </button>
          </form>
        </section>
      </div>
    );
  }

  // --- SOLO BLITZ ACTIVE VIEW ---
  if (soloRun) {
    const q = soloRun.quiz.questions[soloRun.index];
    const limit = resolveQuestionLimitSec(q, difficulty);

    if (soloRun.finished) {
      const accuracy = Math.round((soloRun.correctCount / soloRun.quiz.questions.length) * 100);
      return (
        <div className="stack-lg">
          <div className="card stack-md" style={{ alignItems: 'center', textAlign: 'center' }}>
            <TrophyCanvas size={110} />
            <h1 className="display-title" style={{ margin: 0 }}>
              Blitz Complete!
            </h1>
            <p className="small muted" style={{ margin: 0 }}>
              {soloRun.quiz.title} · {soloRun.correctCount}/{soloRun.quiz.questions.length} correct ({accuracy}%)
            </p>
            <div className="badge-pill" style={{ fontSize: '1.1rem', padding: '10px 18px' }}>
              Final Score: <span className="mono tabular-nums">{soloRun.score.toLocaleString()}</span> pts
            </div>
            <div style={{ width: '100%', textAlign: 'left' }}>
              <PostQuestionLeaderboardPanel title="Club Standings Comparison" standings={soloRevealStandings} />
            </div>
            <div className="row-wrap">
              <button type="button" className="btn btn-primary" onClick={() => startSoloBlitz(soloRun.quiz)}>
                Play Again
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setSoloRun(null)}>
                Back to Quiz Clash
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="stack-lg">
        <div className="card row-between row-wrap">
          <div className="row-wrap">
            <span className="mono small" style={{ fontWeight: 800 }}>
              Q{soloRun.index + 1} / {soloRun.quiz.questions.length}
            </span>
            <CefrBadge level={soloRun.quiz.cefrLevel} />
            <span className="badge-pill tabular-nums">Score: {soloRun.score.toLocaleString()}</span>
            {soloRun.streak >= 2 ? (
              <span className="badge-pill" style={{ background: 'var(--accent-soft)', color: 'var(--on-accent-soft)' }}>
                🔥 {soloRun.streak}x streak
              </span>
            ) : null}
          </div>
          <div className="row">
            <span className="mono badge-pill tabular-nums">⏱ {soloRun.timeRemaining}s</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setSoloRun(null)}>
              Quit
            </button>
          </div>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.round((soloRun.timeRemaining / limit) * 100))}%` }}
          />
        </div>

        <div className="card stack-md">
          <h2 className="section-title" style={{ margin: 0 }}>
            {q.prompt}
          </h2>

          <div className="kahoot-grid">
            {q.options.map((opt, idx) => {
              const isCorrectOption = idx === Number(q.correctIndex);
              const isSelected = idx === soloRun.selectedOption;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={soloRun.revealed}
                  onClick={() => handleSoloSelect(idx)}
                  className={`kahoot-tile c-${idx % 4} ${
                    soloRun.revealed && !isCorrectOption ? 'dimmed' : ''
                  } ${isSelected ? 'selected-ring' : ''}`}
                >
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {soloRun.revealed ? (
            <div className="stack-md">
              <div
                className={`card ${soloRun.lastCorrect ? 'card-soft-mint' : 'card-soft-secondary'}`}
                style={{ padding: 14 }}
              >
                <strong>
                  {soloRun.lastCorrect
                    ? `✓ Spot on! +${soloRun.lastPointsEarned} pts`
                    : `✕ Correct answer: ${q.options[q.correctIndex]}`}
                </strong>
                {q.tip ? <p className="small" style={{ margin: '6px 0 0' }}>💡 {q.tip}</p> : null}
              </div>

              <PostQuestionLeaderboardPanel
                title={`Standings After Question ${soloRun.index + 1}`}
                standings={soloRevealStandings}
              />

              <button type="button" className="btn btn-primary btn-full" onClick={handleSoloNext}>
                {soloRun.index + 1 >= soloRun.quiz.questions.length
                  ? 'View Final Podium →'
                  : 'Next Question →'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // --- QUIZ ARENA BROWSE & HOST HUB ---
  const activePacks =
    tab === 'AR' ? ARABIC_QUIZ_PACKS : tab === 'CUSTOM' ? customQuizzes : QUIZ_PACKS;

  return (
    <div className="stack-lg">
      <AppHeroBanner
        imageSrc="/assets/img_quiz_arena.jpg"
        alt="Live Quiz Clash stage"
        eyebrow="KAHOOT-STYLE ARENA"
        title="Host PIN Rooms or Solo Blitz"
        subtitle="Real-time post-question standings, CSV import/export, and cross-tab local or Firebase rooms."
      />

      {/* Join PIN + CSV + Difficulty Bar */}
      <div className="grid-2">
        <form onSubmit={handleJoinForm} className="card stack-sm">
          <h2 className="card-title" style={{ margin: 0 }}>
            Join by Room PIN
          </h2>
          <div className="grid-2">
            <div className="stack-xs">
              <label htmlFor="quiz-join-pin" className="field-label">
                Room PIN
              </label>
              <input
                id="quiz-join-pin"
                type="text"
                className="field mono"
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}
              />
            </div>
            <div className="stack-xs">
              <label htmlFor="quiz-join-nick" className="field-label">
                Nickname
              </label>
              <input
                id="quiz-join-nick"
                type="text"
                className="field"
                value={joinNick}
                onChange={(e) => setJoinNick(e.target.value)}
                maxLength={24}
              />
            </div>
          </div>

          <div className="row-between row-wrap">
            <div className="row" style={{ gap: 6 }}>
              {Object.keys(AVATAR_COLOR_HEX).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-label={`Select ${tag} avatar color`}
                  onClick={() => setJoinColor(tag)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: joinColor === tag ? '3px solid var(--ink)' : '2px solid transparent',
                    background: AVATAR_COLOR_HEX[tag],
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={joining}>
              {joining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>

        <div className="card stack-sm">
          <h2 className="card-title" style={{ margin: 0 }}>
            Difficulty & Kahoot CSV
          </h2>
          <div className="row-wrap">
            {DIFFICULTY_LEVELS.map((d) => (
              <button
                key={d}
                type="button"
                className={`chip ${difficulty === d ? 'selected' : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setDifficulty(d);
                }}
              >
                {DIFFICULTY_CONFIG[d].label} ({DIFFICULTY_CONFIG[d].timeLimitSec}s)
              </button>
            ))}
          </div>
          <div className="row-wrap">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => csvInputRef.current?.click()}
            >
              📥 Import Kahoot CSV
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="row-wrap" role="tablist" aria-label="Quiz library category">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'EN'}
          className={`chip ${tab === 'EN' ? 'selected' : ''}`}
          onClick={() => setTab('EN')}
        >
          🇬🇧 English Quizzes ({QUIZ_PACKS.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'AR'}
          className={`chip ${tab === 'AR' ? 'selected' : ''}`}
          onClick={() => setTab('AR')}
        >
          🌙 Arabic Mysteries & Facts ({ARABIC_QUIZ_PACKS.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'CUSTOM'}
          className={`chip ${tab === 'CUSTOM' ? 'selected' : ''}`}
          onClick={() => setTab('CUSTOM')}
        >
          ✨ My Saved & CSV ({customQuizzes.length})
        </button>
      </div>

      {/* Quiz Pack Grid */}
      {activePacks.length === 0 ? (
        <div className="card">
          <p className="small muted" style={{ margin: 0 }}>
            No custom quizzes saved yet. Generate one below or import a Kahoot CSV!
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {activePacks.map((pack) => (
            <article key={pack.id} className="card stack-sm">
              <div className="row-between">
                <div className="row-wrap">
                  <CefrBadge level={pack.cefrLevel} />
                  <span className="badge-pill">{pack.questions.length} Qs</span>
                  {pack.language === 'AR' ? <span className="badge-pill">AR</span> : null}
                </div>
                {tab === 'CUSTOM' ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label={`Delete quiz ${pack.title}`}
                    onClick={() => void deleteCustomQuiz(pack.id)}
                  >
                    🗑️
                  </button>
                ) : null}
              </div>

              <div className="stack-xs">
                <h3 className={`card-title ${pack.language === 'AR' ? 'arabic-text' : ''}`} style={{ margin: 0 }}>
                  {pack.title}
                </h3>
                <p className="xs muted" style={{ margin: 0 }}>
                  {pack.description || pack.topic}
                </p>
              </div>

              <div className="row-wrap" style={{ marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => startSoloBlitz(pack)}
                >
                  ⚡ Solo Blitz
                </button>
                <button
                  type="button"
                  className="btn btn-mint btn-sm"
                  onClick={() => void handleHostQuiz(pack, 'LOCAL')}
                >
                  📡 Host Local Room
                </button>
                {!isOfflineMode ? (
                  <button
                    type="button"
                    className="btn btn-soft btn-sm"
                    onClick={() => void handleHostQuiz(pack, 'CLOUD')}
                  >
                    ☁️ Cloud Room
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  aria-label={`Export ${pack.title} as Kahoot CSV`}
                  onClick={() => {
                    downloadQuizCsv(pack);
                    toast('Exported Kahoot CSV!', 'info');
                  }}
                >
                  CSV ↓
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Prompt Quiz Generator Studio */}
      <QuizGeneratorCard
        onStartNow={(draft) => startSoloBlitz(draft)}
      />
    </div>
  );
};
