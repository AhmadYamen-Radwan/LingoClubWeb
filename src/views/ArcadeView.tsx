import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityType,
  DifficultyLevel,
  Team,
} from '../types';
import { useApp } from '../context/AppContext';
import {
  ARABIC_ARCADE_WORDS,
  ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS,
  ARABIC_VAULT_WORDS,
  CRIME_MYSTERY_CASES,
  CURATED_EVIDENCE_CARDS,
  CURATED_HEIST_CIPHERS,
  CURATED_ODD_CLUE_ROUNDS,
  WHEEL_SLICES,
  WheelSliceItem,
} from '../data/curatedContent';
import { WEEKLY_CURRICULUM } from '../data/weeklyCurriculum';
import {
  avatarColorForTag,
  DEFAULT_BATTLE_TEAMS,
  DIFFICULTY_CONFIG,
  DIFFICULTY_LEVELS,
} from '../utils/constants';
import { evaluateVaultGuess, VaultCellState } from '../utils/gameLogic';
import { ttsSpeaker } from '../services/speechMedia';
import { CefrBadge } from '../components/CefrBadge';
import { SpinWheelCanvas, WordStageCanvas } from '../components/Canvas3D';
import { InGameChatModal } from '../components/InGameChatModal';
import { TranslatableText } from '../components/TranslatableText';

type ArcadeModeId =
  | 'BALLOON'
  | 'METEOR'
  | 'ROCKET'
  | 'DASH'
  | 'DETECTIVE'
  | 'CRIME'
  | 'EVIDENCE'
  | 'VAULT'
  | 'DUEL'
  | 'MEMORY'
  | 'WHEEL'
  | 'AR_RUNNER'
  | 'AR_METEOR'
  | 'AR_MAZE'
  | 'AR_BLITZ'
  | 'AR_DETECTIVE'
  | 'AR_VAULT'
  | 'AR_DUEL';

interface PoolWord {
  english: string;
  arabic: string;
  exampleSentence: string;
  cefrLevel: string;
}

const ARABIC_ALPHABET = [
  'ا', 'أ', 'إ', 'ب', 'ت', 'ة', 'ث', 'ج', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و',
  'ي', 'ى', 'ئ', 'ؤ',
];

const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildLetterPool(target: string, alphabet: string[], decoyCount = 6): string[] {
  const needed = [...new Set(Array.from(target.trim()).filter((c) => /\S/.test(c)))];
  const neededSet = new Set(needed);
  const decoys = shuffle(alphabet.filter((c) => !neededSet.has(c))).slice(0, decoyCount);
  return shuffle([...needed, ...decoys]);
}

function buildWordsPool(): PoolWord[] {
  return WEEKLY_CURRICULUM.flatMap((wk) =>
    wk.words.map((w) => ({
      english: String(w.word || w.english || '').trim(),
      arabic: String(w.arabic || '').trim(),
      exampleSentence: String(w.storyLine || w.exampleSentence || w.meaning || '').trim(),
      cefrLevel: String(w.cefrLevel || 'B1'),
    }))
  ).filter((w) => w.english && w.arabic);
}

interface CanvasWave {
  targetLabel: string;
  hintLabel?: string;
  opts: string[];
  answer: string;
  speakText?: string;
}

// Reusable 60FPS Animated Canvas Stage for Balloon Pop, Meteor Defense (EN/AR), Rocket Race, and Galaxy Runner
const AnimatedArcadeCanvas: React.FC<{
  kind: 'BALLOON' | 'METEOR' | 'ROCKET' | 'AR_RUNNER';
  wave: CanvasWave | null;
  progressNorm: number; // balloonY / meteorY / gateX
  hearts: number;
  maxHearts: number;
  lanes?: Array<{ id: string; name: string; color: string; dist: number; goal: number }>;
  runnerLane?: number;
  runnerOpts?: string[];
  onCanvasOptionHit?: (opt: string) => void;
  onRunnerLanePick?: (laneIdx: number) => void;
}> = ({
  kind,
  wave,
  progressNorm,
  hearts,
  maxHearts,
  lanes = [],
  runnerLane = 1,
  runnerOpts = [],
  onCanvasOptionHit,
  onRunnerLanePick,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitboxesRef = useRef<Array<{ cx: number; cy: number; rx: number; ry: number; opt: string; laneIdx?: number }>>([]);
  const propsRef = useRef({ kind, wave, progressNorm, hearts, maxHearts, lanes, runnerLane, runnerOpts });
  propsRef.current = { kind, wave, progressNorm, hearts, maxHearts, lanes, runnerLane, runnerOpts };

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    let raf = 0;

    const draw = (now: number) => {
      const { kind: k, wave: wv, progressNorm: pn, lanes: ln, runnerLane: rl, runnerOpts: ro } = propsRef.current;
      const rect = box.getBoundingClientRect();
      const w = Math.max(260, Math.round(rect.width || 420));
      const h = 232;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      if (k === 'BALLOON') {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0284C7');
        sky.addColorStop(1, '#BAE6FD');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        for (let i = 0; i < 4; i++) {
          const cx = ((now * 0.018 * (i % 2 === 0 ? 1 : 0.7) + i * 140) % (w + 100)) - 50;
          const cy = 38 + (i % 3) * 48;
          ctx.beginPath();
          ctx.arc(cx, cy, 20, 0, Math.PI * 2);
          ctx.arc(cx + 16, cy - 6, 24, 0, Math.PI * 2);
          ctx.arc(cx + 34, cy + 2, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        const palette = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];
        const boxes: typeof hitboxesRef.current = [];
        const opts = wv?.opts || [];
        const colW = w / Math.max(1, opts.length);
        opts.forEach((opt, idx) => {
          const bx = colW * idx + colW / 2;
          const bob = Math.sin(now * 0.004 + idx * 1.4) * 7;
          const by = Math.max(46, Math.min(h - 46, pn * h + bob));
          const rx = Math.min(44, colW * 0.42);
          const ry = 35;
          boxes.push({ cx: bx, cy: by, rx, ry, opt });

          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx, by + ry);
          ctx.quadraticCurveTo(bx + Math.sin(now * 0.006 + idx) * 6, by + ry + 16, bx, by + ry + 30);
          ctx.stroke();

          ctx.fillStyle = palette[idx % 4];
          ctx.beginPath();
          ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 12px "Noto Sans Arabic", Tahoma, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(opt, bx, by - 4, rx * 1.75);
          ctx.font = '800 10px "JetBrains Mono", monospace';
          ctx.fillText(`[${idx + 1}]`, bx, by + 16);
        });
        hitboxesRef.current = boxes;
      } else if (k === 'METEOR') {
        const space = ctx.createLinearGradient(0, 0, 0, h);
        space.addColorStop(0, '#0F172A');
        space.addColorStop(1, '#1E1B4B');
        ctx.fillStyle = space;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 24; i++) {
          const sx = ((i * 73 + now * 0.01) % w);
          const sy = (i * 41) % (h - 32);
          ctx.fillRect(sx, sy, 2, 2);
        }

        // Shield bar at bottom
        ctx.fillStyle = 'rgba(14, 159, 110, 0.35)';
        ctx.fillRect(0, h - 18, w, 18);
        ctx.fillStyle = '#34D399';
        ctx.fillRect(w / 2 - 22, h - 28, 44, 14);

        const my = Math.max(42, Math.min(h - 48, pn * (h - 40)));
        const mx = w / 2 + Math.sin(now * 0.003) * Math.min(54, w * 0.16);
        const glow = ctx.createRadialGradient(mx, my, 8, mx, my, 52);
        glow.addColorStop(0, 'rgba(255, 90, 95, 0.85)');
        glow.addColorStop(1, 'rgba(255, 90, 95, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mx, my, 52, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF5A5F';
        ctx.beginPath();
        ctx.arc(mx, my, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FCD34D';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 15px "Outfit", "Noto Sans Arabic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(wv?.targetLabel || 'METEOR', mx, my, w * 0.72);
        hitboxesRef.current = [];
      } else if (k === 'ROCKET') {
        const bg = ctx.createLinearGradient(0, 0, w, 0);
        bg.addColorStop(0, '#111827');
        bg.addColorStop(1, '#312E81');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        for (let i = 0; i < 20; i++) {
          const sx = w - ((now * 0.08 + i * 65) % w);
          const sy = (i * 37) % h;
          ctx.fillRect(sx, sy, 4, 2);
        }

        // Finish line
        ctx.strokeStyle = '#FCD34D';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(w - 30, 12);
        ctx.lineTo(w - 30, h - 12);
        ctx.stroke();
        ctx.setLineDash([]);

        const laneH = (h - 24) / Math.max(1, ln.length);
        ln.forEach((lane, idx) => {
          const cy = 12 + idx * laneH + laneH / 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.moveTo(20, cy + laneH * 0.42);
          ctx.lineTo(w - 20, cy + laneH * 0.42);
          ctx.stroke();

          const pct = Math.min(1, Math.max(0, lane.dist / Math.max(1, lane.goal)));
          const rx = 34 + pct * (w - 86);
          ctx.fillStyle = lane.color;
          ctx.beginPath();
          ctx.roundRect(rx - 18, cy - 12, 36, 24, 10);
          ctx.fill();
          ctx.font = '16px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚀', rx, cy);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${lane.name} (${lane.dist}m)`, 16, cy - laneH * 0.25);
        });
        hitboxesRef.current = [];
      } else if (k === 'AR_RUNNER') {
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, '#0F172A');
        bg.addColorStop(1, '#2E1065');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const laneH = h / 3;
        const boxes: typeof hitboxesRef.current = [];
        for (let i = 0; i < 3; i++) {
          const yTop = i * laneH;
          ctx.fillStyle = rl === i ? 'rgba(86, 58, 228, 0.28)' : 'rgba(255,255,255,0.04)';
          ctx.fillRect(0, yTop + 4, w, laneH - 8);

          const gx = Math.max(96, pn * (w - 90));
          const optText = ro[i] || `مسار ${i + 1}`;
          ctx.fillStyle = rl === i ? '#7C3AED' : '#1E293B';
          ctx.strokeStyle = rl === i ? '#FCD34D' : 'rgba(255,255,255,0.28)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(gx - 58, yTop + 14, 116, laneH - 28, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 12px "Noto Sans Arabic", Tahoma, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(optText, gx, yTop + laneH / 2, 108);

          boxes.push({ cx: w / 2, cy: yTop + laneH / 2, rx: w / 2, ry: laneH / 2, opt: optText, laneIdx: i });
        }

        // Player spaceship in active lane
        const shipY = rl * laneH + laneH / 2;
        ctx.font = '26px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛸', 44, shipY);
        hitboxesRef.current = boxes;
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (kind === 'BALLOON' && onCanvasOptionHit) {
      const hit = hitboxesRef.current.find(
        (hb) => Math.abs(x - hb.cx) <= hb.rx + 10 && Math.abs(y - hb.cy) <= hb.ry + 10
      );
      if (hit) onCanvasOptionHit(hit.opt);
    } else if (kind === 'AR_RUNNER' && onRunnerLanePick) {
      const laneIdx = Math.min(2, Math.max(0, Math.floor((y / Math.max(1, rect.height)) * 3)));
      onRunnerLanePick(laneIdx);
    }
  };

  return (
    <div ref={boxRef} className="arcade-canvas-box" style={{ height: 232, cursor: kind === 'BALLOON' || kind === 'AR_RUNNER' ? 'pointer' : 'default' }}>
      <canvas ref={canvasRef} onClick={handleClick} data-testid={`arcade-canvas-${kind.toLowerCase()}`} />
    </div>
  );
};

interface ArcadeCardDef {
  id: ArcadeModeId;
  lang: 'EN' | 'AR';
  cat: 'BLITZ' | 'DETECTIVE' | 'MEMORY';
  icon: string;
  title: string;
  desc: string;
  bg: string;
  ink: string;
}

export const ArcadeView: React.FC = () => {
  const {
    profile,
    navigate,
    sfx,
    toast,
    triggerConfetti,
    awardActivity,
    togglePinEvidence,
    openTeamBuzzer,
    upsertArcadeRoomScore,
    removeArcadeRoomScore,
    teamContributions,
  } = useApp();

  const [activeMode, setActiveMode] = useState<ArcadeModeId | null>(null);
  const [hubLang, setHubLang] = useState<'ALL' | 'EN' | 'AR'>('ALL');
  const [hubCat, setHubCat] = useState<'ALL' | 'BLITZ' | 'DETECTIVE' | 'MEMORY'>('ALL');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [playFormat, setPlayFormat] = useState<'SOLO' | 'TEAM'>('SOLO');
  const [squadCount, setSquadCount] = useState<number>(2);
  const [chatOpen, setChatOpen] = useState(false);

  // Team play live HUD state
  const [teamLineup, setTeamLineup] = useState<Team[]>([]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [teamScores, setTeamScores] = useState<Record<string, number>>({});
  const arcadeRoomIdRef = useRef<string | null>(null);

  // Shared run state for active mini-games
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finished, setFinished] = useState(false);

  // Blitz / Wave games state (DASH, AR_BLITZ, BALLOON, METEOR, AR_METEOR)
  const [waves, setWaves] = useState<CanvasWave[]>([]);
  const [waveIdx, setWaveIdx] = useState(0);
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);
  const [used5050, setUsed5050] = useState(false);
  const [usedFreeze, setUsedFreeze] = useState(false);
  const [frozenUntilMs, setFrozenUntilMs] = useState(0);
  const [progressNorm, setProgressNorm] = useState(0.15);

  // Rocket Race state
  const [rocketLanes, setRocketLanes] = useState<Array<{ id: string; name: string; color: string; dist: number; goal: number }>>([]);
  const [rocketWinner, setRocketWinner] = useState('');

  // Detective EN & AR state
  const [detectiveTarget, setDetectiveTarget] = useState('');
  const [detectiveClue, setDetectiveClue] = useState('');
  const [detectiveMeaning, setDetectiveMeaning] = useState('');
  const [detectivePool, setDetectivePool] = useState<string[]>([]);
  const [detectiveGuessed, setDetectiveGuessed] = useState<string[]>([]);
  const [detectiveWrong, setDetectiveWrong] = useState(0);
  const [detectiveHintUsed, setDetectiveHintUsed] = useState(false);

  // Crime Mystery state
  const [casesPool, setCasesPool] = useState(CRIME_MYSTERY_CASES);
  const [caseIdx, setCaseIdx] = useState(0);
  const [interrogatedIds, setInterrogatedIds] = useState<string[]>([]);
  const [pickedSuspectId, setPickedSuspectId] = useState<string | null>(null);
  const [showCaseTip, setShowCaseTip] = useState(false);

  // Evidence Board state
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(CURATED_EVIDENCE_CARDS[0].id);
  const [evidenceScanned, setEvidenceScanned] = useState(false);
  const [evidenceSolvedIds, setEvidenceSolvedIds] = useState<string[]>([]);
  const [pickedEvidenceCulprit, setPickedEvidenceCulprit] = useState<string | null>(null);

  // Vault EN & AR state
  const [vaultWord, setVaultWord] = useState('');
  const [vaultClue, setVaultClue] = useState('');
  const [vaultGuesses, setVaultGuesses] = useState<string[]>([]);
  const [vaultInput, setVaultInput] = useState('');
  const [vaultHintUsed, setVaultHintUsed] = useState(false);

  // Duel EN & AR state
  const [duelRounds, setDuelRounds] = useState<Array<{ prompt: string; opts: string[]; oddIndex: number; explanation: string }>>([]);
  const [duelIdx, setDuelIdx] = useState(0);

  // Memory Flip state
  const [memTiles, setMemTiles] = useState<Array<{ uid: string; pairId: number; text: string; kind: 'en' | 'ar' }>>([]);
  const [memFlipped, setMemFlipped] = useState<number[]>([]);
  const [memMatched, setMemMatched] = useState<number[]>([]);
  const [memMoves, setMemMoves] = useState(0);
  const [memLocked, setMemLocked] = useState(false);

  // Spin Wheel state
  const [wheelRot, setWheelRot] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelSlice, setWheelSlice] = useState<WheelSliceItem | null>(null);

  // Arabic Space Runner + Treasure Maze state
  const [runnerLane, setRunnerLane] = useState(1);
  const [mazePos, setMazePos] = useState({ r: 0, c: 0 });
  const [mazeVisited, setMazeVisited] = useState<string[]>(['0,0']);
  const [mazeAwaitingMove, setMazeAwaitingMove] = useState(false);

  const diffCfg = DIFFICULTY_CONFIG[difficulty];
  const wordsPool = useMemo(() => buildWordsPool(), []);

  const cards = useMemo<ArcadeCardDef[]>(
    () => [
      { id: 'BALLOON', lang: 'EN', cat: 'BLITZ', icon: '🎈', title: 'Balloon Pop Vocab', desc: 'Rising sky balloons — tap right on the canvas to pop!', bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
      { id: 'METEOR', lang: 'EN', cat: 'BLITZ', icon: '☄️', title: 'Meteor Word Defense', desc: 'Laser turret defense: blast word meteors before impact!', bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)' },
      { id: 'ROCKET', lang: 'EN', cat: 'BLITZ', icon: '🚀', title: 'Rocket Fuel Race', desc: 'Starfield squad race to 1,000m on every right answer!', bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
      { id: 'DASH', lang: 'EN', cat: 'BLITZ', icon: '⚡', title: 'Word Dash Blitz', desc: `${diffCfg.dashDurationSec}s rapid fire with 50/50 & Freeze lifelines`, bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)' },
      { id: 'DETECTIVE', lang: 'EN', cat: 'DETECTIVE', icon: '🔍', title: 'Word Detective', desc: `Guess hidden words (${diffCfg.detectiveLives} orbs) with decoy tiles`, bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)' },
      { id: 'CRIME', lang: 'EN', cat: 'DETECTIVE', icon: '🕵️', title: 'Crime Mystery', desc: '8 interactive whodunits with suspect interrogation', bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)' },
      { id: 'EVIDENCE', lang: 'EN', cat: 'DETECTIVE', icon: '📌', title: 'Evidence Board', desc: 'Run forensic scans, crack suspects & pin evidence', bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
      { id: 'VAULT', lang: 'EN', cat: 'MEMORY', icon: '🔐', title: 'Vault Codebreaker', desc: `${diffCfg.vaultRows}-row cipher cracker with color hints`, bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
      { id: 'DUEL', lang: 'EN', cat: 'BLITZ', icon: '⚔️', title: 'Mystery Speed Duel', desc: `${diffCfg.duelDurationSec}s odd-one-out squad duel`, bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)' },
      { id: 'MEMORY', lang: 'EN', cat: 'MEMORY', icon: '🃏', title: '3D Memory Flip', desc: '3x4 English–Arabic board (keep turn on match!)', bg: 'var(--blue-soft)', ink: 'var(--on-blue-soft)' },
      { id: 'WHEEL', lang: 'EN', cat: 'BLITZ', icon: '🎡', title: 'Daily Spin Wheel', desc: 'Spin the interactive wheel for XP & club challenges', bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
      { id: 'AR_RUNNER', lang: 'AR', cat: 'BLITZ', icon: '🛸', title: 'مطاردة المجرة السريعة', desc: 'وجّه مركبة الفضاء عبر 3 مسارات لاختراق البوابات الصحيحة', bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)' },
      { id: 'AR_METEOR', lang: 'AR', cat: 'BLITZ', icon: '☄️', title: 'دفاع النيازك الفضائي', desc: 'ليزر فضائي لتدمير نيازك المرادفات والأضداد العربية', bg: 'var(--secondary-soft)', ink: 'var(--on-secondary-soft)' },
      { id: 'AR_MAZE', lang: 'AR', cat: 'DETECTIVE', icon: '🧭', title: 'متاهة الكنز والفضاء', desc: 'حل ألغاز العلوم والجرائم لتتجنب الفخاخ وتصل للكنز 💎', bg: 'var(--accent-soft)', ink: 'var(--on-accent-soft)' },
      { id: 'AR_BLITZ', lang: 'AR', cat: 'BLITZ', icon: '⚡', title: 'سباق المعاني السريع', desc: `${diffCfg.dashDurationSec}ث للمرادفات والأضداد العربية بالكامل`, bg: 'var(--tertiary-soft)', ink: 'var(--on-tertiary-soft)' },
      { id: 'AR_DETECTIVE', lang: 'AR', cat: 'DETECTIVE', icon: '🔍', title: 'كاشف الكلمة العربية', desc: `خمّن الكلمة العربية (${diffCfg.detectiveLives} محاولات) بلوحة حروف`, bg: 'var(--primary-soft)', ink: 'var(--on-primary-soft)' },
      { id: 'AR_VAULT', lang: 'AR', cat: 'MEMORY', icon: '🔐', title: 'خزنة الحروف العربية', desc: `تحدي تخمين الكلمة العربية (${diffCfg.vaultRows} صفوف)`, bg: 'var(--sky-soft)', ink: 'var(--on-sky-soft)' },
      { id: 'AR_DUEL', lang: 'AR', cat: 'BLITZ', icon: '⚔️', title: 'تحدي الجرائم والحقائق', desc: `${diffCfg.duelDurationSec}ث في ألغاز الجرائم والعلوم والتاريخ`, bg: 'var(--purple-soft)', ink: 'var(--on-purple-soft)' },
    ],
    [diffCfg]
  );

  const visibleCards = useMemo(
    () =>
      cards.filter(
        (c) => (hubLang === 'ALL' || c.lang === hubLang) && (hubCat === 'ALL' || c.cat === hubCat)
      ),
    [cards, hubCat, hubLang]
  );

  const initTeamPlaySession = useCallback(
    (modeId: ArcadeModeId, title: string) => {
      if (arcadeRoomIdRef.current) {
        removeArcadeRoomScore(arcadeRoomIdRef.current);
        arcadeRoomIdRef.current = null;
      }
      if (playFormat !== 'TEAM') {
        setTeamLineup([]);
        setTeamScores({});
        setActiveTeamIdx(0);
        return;
      }
      const chosen = DEFAULT_BATTLE_TEAMS.slice(0, squadCount).map((t) => ({
        id: t.id,
        name: t.name,
        cefrLevel: profile.learningLevel,
        motto: t.motto,
        accentColor: t.accentColor,
        leaderUid: 'arcade',
        leaderName: 'Squad Lead',
        channelKind: 'TEAM',
        memberCount: 4,
      }));
      const initScores: Record<string, number> = {};
      const meta: Record<string, { name: string; motto: string; accentColor: string }> = {};
      chosen.forEach((t) => {
        initScores[t.id] = 0;
        meta[t.id] = { name: t.name, motto: t.motto, accentColor: t.accentColor };
      });
      const rId = `arc_${Date.now().toString(36)}`;
      arcadeRoomIdRef.current = rId;
      setTeamLineup(chosen);
      setTeamScores(initScores);
      setActiveTeamIdx(0);
      upsertArcadeRoomScore({
        roomId: rId,
        gameMode: modeId,
        gameTitle: title,
        teamScores: initScores,
        teamMeta: meta,
        activeTeamName: chosen[0]?.name || '',
      });
    },
    [playFormat, profile.learningLevel, removeArcadeRoomScore, squadCount, upsertArcadeRoomScore]
  );

  useEffect(() => {
    return () => {
      if (arcadeRoomIdRef.current) {
        removeArcadeRoomScore(arcadeRoomIdRef.current);
      }
    };
  }, [removeArcadeRoomScore]);

  const awardActiveSquad = useCallback(
    (pts: number) => {
      if (playFormat !== 'TEAM' || teamLineup.length === 0 || pts <= 0) return;
      const curTeam = teamLineup[activeTeamIdx % teamLineup.length];
      if (!curTeam) return;
      setTeamScores((prev) => {
        const next = { ...prev, [curTeam.id]: (prev[curTeam.id] || 0) + pts };
        if (arcadeRoomIdRef.current && activeMode) {
          upsertArcadeRoomScore({
            roomId: arcadeRoomIdRef.current,
            gameMode: activeMode,
            gameTitle: cards.find((c) => c.id === activeMode)?.title || 'Arcade Match',
            teamScores: next,
            activeTeamName: curTeam.name,
          });
        }
        return next;
      });
    },
    [activeMode, activeTeamIdx, cards, playFormat, teamLineup, upsertArcadeRoomScore]
  );

  const rotateTurn = useCallback(
    (silent = false) => {
      if (playFormat !== 'TEAM' || teamLineup.length === 0) return;
      setActiveTeamIdx((i) => (i + 1) % teamLineup.length);
      if (!silent) sfx.playPop();
    },
    [playFormat, sfx, teamLineup.length]
  );

  const completeArcadeRun = useCallback(
    async (modeTitle: string, finalScore: number, accuracyPct: number, practiced: number, bestStreak: number) => {
      setFinished(true);
      sfx.playFanfare();
      triggerConfetti();
      const xp = Math.round(Math.max(18, Math.round(finalScore / 14)) * diffCfg.xpMultiplier);
      const activeTeam = playFormat === 'TEAM' ? teamLineup[activeTeamIdx % Math.max(1, teamLineup.length)] : undefined;
      await awardActivity({
        activityType: ActivityType.GAME,
        title: modeTitle,
        cefrLevel: profile.learningLevel,
        score: finalScore,
        xpDelta: xp,
        accuracyPct,
        wordsPracticed: Math.max(1, practiced),
        durationMinutes: 2,
        arcadePlayed: true,
        highCombo: bestStreak,
        publishLeaderboard: true,
        gameMode: playFormat === 'TEAM' ? 'ARCADE_TEAM' : 'ARCADE',
        teamId: activeTeam?.id || profile.teamId,
        teamName: activeTeam?.name || profile.teamName,
      });
    },
    [activeTeamIdx, awardActivity, diffCfg.xpMultiplier, playFormat, profile.learningLevel, profile.teamId, profile.teamName, sfx, teamLineup, triggerConfetti]
  );

  const startMode = useCallback(
    (modeId: ArcadeModeId) => {
      const def = cards.find((c) => c.id === modeId);
      initTeamPlaySession(modeId, def?.title || modeId);
      setActiveMode(modeId);
      setScore(0);
      setCombo(0);
      setBestCombo(0);
      setCorrectCount(0);
      setTotalAnswered(0);
      setHearts(3);
      setFinished(false);
      setHiddenIndices([]);
      setUsed5050(false);
      setUsedFreeze(false);
      setFrozenUntilMs(0);
      sfx.playClick();

      const enPool = shuffle(wordsPool);
      const arPool = shuffle(ARABIC_ARCADE_WORDS);

      if (modeId === 'DASH' || modeId === 'BALLOON' || modeId === 'METEOR' || modeId === 'ROCKET') {
        const count = modeId === 'DASH' ? 30 : modeId === 'ROCKET' ? 24 : 10;
        const built: CanvasWave[] = Array.from({ length: count }, (_, idx) => {
          const target = enPool[idx % enPool.length];
          const distractors = shuffle(enPool.filter((w) => w.english !== target.english)).slice(0, 3);
          return {
            targetLabel: target.english,
            hintLabel: target.exampleSentence,
            opts: shuffle([target.arabic, ...distractors.map((d) => d.arabic)]),
            answer: target.arabic,
            speakText: target.english,
          };
        });
        setWaves(built);
        setWaveIdx(0);
        setTimeLeft(diffCfg.dashDurationSec);
        setProgressNorm(modeId === 'BALLOON' ? 0.78 : 0.12);
        if (modeId === 'ROCKET') {
          const lanesInit =
            playFormat === 'TEAM'
              ? DEFAULT_BATTLE_TEAMS.slice(0, squadCount).map((t) => ({
                  id: t.id,
                  name: t.name,
                  color: avatarColorForTag(t.accentColor),
                  dist: 0,
                  goal: 1000,
                }))
              : [
                  { id: 'you', name: profile.displayName || 'You', color: '#563AE4', dist: 0, goal: 1000 },
                  { id: 'bot', name: 'Turbo Bot', color: '#FF5A5F', dist: 0, goal: 1000 },
                ];
          setRocketLanes(lanesInit);
          setRocketWinner('');
        }
      } else if (modeId === 'AR_BLITZ' || modeId === 'AR_METEOR') {
        const count = modeId === 'AR_BLITZ' ? 24 : 10;
        const built: CanvasWave[] = Array.from({ length: count }, (_, idx) => {
          const target = arPool[idx % arPool.length];
          const askAntonym = idx % 2 === 1;
          const answer = askAntonym ? target.antonym : target.synonym;
          const distractors = shuffle(
            arPool
              .filter((w) => w.word !== target.word)
              .map((w) => (askAntonym ? w.antonym : w.synonym))
              .filter((v) => v && v !== answer)
          ).slice(0, 3);
          return {
            targetLabel: `${askAntonym ? 'ضد' : 'مرادف'}: ${target.word}`,
            hintLabel: target.clue,
            opts: shuffle([answer, ...distractors]),
            answer,
          };
        });
        setWaves(built);
        setWaveIdx(0);
        setTimeLeft(diffCfg.dashDurationSec);
        setProgressNorm(0.12);
      } else if (modeId === 'AR_RUNNER') {
        const built: CanvasWave[] = shuffle(ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS)
          .slice(0, 8)
          .map((r) => {
            const answer = r.options[Number(r.oddIndex || 0)];
            const wrong = shuffle(r.options.filter((_, idx) => idx !== Number(r.oddIndex || 0))).slice(0, 2);
            return {
              targetLabel: r.scenarioPrompt,
              hintLabel: r.explanation,
              opts: shuffle([answer, ...wrong]),
              answer,
            };
          });
        setWaves(built);
        setWaveIdx(0);
        setRunnerLane(1);
        setProgressNorm(0.88);
      } else if (modeId === 'AR_MAZE') {
        const built: CanvasWave[] = shuffle(ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS).map((r) => ({
          targetLabel: r.scenarioPrompt,
          hintLabel: r.explanation,
          opts: shuffle(r.options),
          answer: r.options[Number(r.oddIndex || 0)],
        }));
        setWaves(built);
        setWaveIdx(0);
        setMazePos({ r: 0, c: 0 });
        setMazeVisited(['0,0']);
        setMazeAwaitingMove(false);
        setHearts(difficulty === DifficultyLevel.HARD ? 2 : 3);
      } else if (modeId === 'DETECTIVE') {
        const picked = enPool.find((w) => /^[a-zA-Z]{4,9}$/.test(w.english)) || {
          english: 'EVIDENCE',
          arabic: 'دليل',
          exampleSentence: 'The detective found a key piece of evidence.',
          cefrLevel: 'B1',
        };
        const upper = picked.english.toUpperCase();
        setDetectiveTarget(upper);
        setDetectiveMeaning(picked.arabic);
        setDetectiveClue(picked.exampleSentence.replace(new RegExp(picked.english, 'ig'), '_____'));
        setDetectivePool(buildLetterPool(upper, EN_ALPHABET, 6));
        setDetectiveGuessed([]);
        setDetectiveWrong(0);
        setDetectiveHintUsed(false);
      } else if (modeId === 'AR_DETECTIVE') {
        const picked = arPool[0];
        setDetectiveTarget(picked.word.trim());
        setDetectiveMeaning(picked.synonym);
        setDetectiveClue(picked.clue);
        setDetectivePool(buildLetterPool(picked.word.trim(), ARABIC_ALPHABET, 6));
        setDetectiveGuessed([]);
        setDetectiveWrong(0);
        setDetectiveHintUsed(false);
      } else if (modeId === 'CRIME') {
        setCasesPool(shuffle(CRIME_MYSTERY_CASES));
        setCaseIdx(0);
        setInterrogatedIds([]);
        setPickedSuspectId(null);
        setShowCaseTip(false);
      } else if (modeId === 'EVIDENCE') {
        setSelectedEvidenceId(CURATED_EVIDENCE_CARDS[0].id);
        setEvidenceScanned(false);
        setEvidenceSolvedIds([]);
        setPickedEvidenceCulprit(null);
      } else if (modeId === 'VAULT') {
        const c = shuffle(CURATED_HEIST_CIPHERS)[0];
        setVaultWord(c.word.toUpperCase());
        setVaultClue(`${c.clue} (${c.arabic})`);
        setVaultGuesses([]);
        setVaultInput('');
        setVaultHintUsed(false);
      } else if (modeId === 'AR_VAULT') {
        const c = shuffle(ARABIC_VAULT_WORDS)[0];
        setVaultWord(c.word.trim());
        setVaultClue(c.arabicClue);
        setVaultGuesses([]);
        setVaultInput('');
        setVaultHintUsed(false);
      } else if (modeId === 'DUEL' || modeId === 'AR_DUEL') {
        const raw = modeId === 'DUEL' ? CURATED_ODD_CLUE_ROUNDS : ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS;
        setDuelRounds(
          shuffle(raw).map((r) => ({
            prompt: r.scenarioPrompt,
            opts: r.options,
            oddIndex: r.oddIndex,
            explanation: r.explanation,
          }))
        );
        setDuelIdx(0);
        setTimeLeft(diffCfg.duelDurationSec);
      } else if (modeId === 'MEMORY') {
        const picked = enPool.slice(0, 6);
        const tiles = shuffle(
          picked.flatMap((w, i) => [
            { uid: `en_${i}`, pairId: i, text: w.english, kind: 'en' as const },
            { uid: `ar_${i}`, pairId: i, text: w.arabic, kind: 'ar' as const },
          ])
        );
        setMemTiles(tiles);
        setMemFlipped([]);
        setMemMatched([]);
        setMemMoves(0);
        setMemLocked(false);
      } else if (modeId === 'WHEEL') {
        setWheelSlice(null);
        setWheelSpinning(false);
      }
    },
    [cards, diffCfg.dashDurationSec, diffCfg.duelDurationSec, difficulty, initTeamPlaySession, playFormat, profile.displayName, sfx, squadCount, wordsPool]
  );

  // Countdown timers for DASH / AR_BLITZ / DUEL / AR_DUEL
  useEffect(() => {
    if (!activeMode || finished) return;
    if (activeMode !== 'DASH' && activeMode !== 'AR_BLITZ' && activeMode !== 'DUEL' && activeMode !== 'AR_DUEL') {
      return;
    }
    const id = window.setInterval(() => {
      if (Date.now() < frozenUntilMs) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          const title = cards.find((c) => c.id === activeMode)?.title || activeMode;
          const acc = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;
          void completeArcadeRun(title, score, acc, totalAnswered, bestCombo);
          return 0;
        }
        if (prev <= 5) sfx.playTick();
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeMode, bestCombo, cards, completeArcadeRun, correctCount, finished, frozenUntilMs, score, sfx, totalAnswered]);

  // Motion tick for BALLOON / METEOR / AR_METEOR / AR_RUNNER
  useEffect(() => {
    if (!activeMode || finished) return;
    if (activeMode !== 'BALLOON' && activeMode !== 'METEOR' && activeMode !== 'AR_METEOR' && activeMode !== 'AR_RUNNER') {
      return;
    }
    const stepMs = 80;
    const speedPerStep = difficulty === DifficultyLevel.HARD ? 0.011 : difficulty === DifficultyLevel.EASY ? 0.0055 : 0.008;
    const id = window.setInterval(() => {
      if (Date.now() < frozenUntilMs) return;
      setProgressNorm((p) => {
        const next = activeMode === 'BALLOON' || activeMode === 'AR_RUNNER' ? p - speedPerStep : p + speedPerStep;
        const missed = activeMode === 'BALLOON' || activeMode === 'AR_RUNNER' ? next <= 0.14 : next >= 0.88;
        if (missed) {
          sfx.playError();
          setCombo(0);
          setHearts((h) => {
            const rem = h - 1;
            if (rem <= 0 || waveIdx + 1 >= waves.length) {
              const title = cards.find((c) => c.id === activeMode)?.title || activeMode;
              void completeArcadeRun(title, score, Math.round((correctCount / Math.max(1, waveIdx + 1)) * 100), waveIdx + 1, bestCombo);
            } else {
              setWaveIdx((w) => w + 1);
            }
            return rem;
          });
          return activeMode === 'BALLOON' ? 0.78 : activeMode === 'AR_RUNNER' ? 0.88 : 0.12;
        }
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [activeMode, bestCombo, cards, completeArcadeRun, correctCount, difficulty, finished, frozenUntilMs, score, sfx, waveIdx, waves.length]);

  const handleWaveOption = useCallback(
    (opt: string) => {
      if (finished || !waves[waveIdx]) return;
      const cur = waves[waveIdx];
      const isRight = opt === cur.answer;
      setTotalAnswered((n) => n + 1);
      setHiddenIndices([]);

      if (isRight) {
        sfx.playSuccess();
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setBestCombo((b) => Math.max(b, nextCombo));
        setCorrectCount((c) => c + 1);
        const pts = 60 + Math.min(nextCombo, 5) * 20;
        const nextScore = score + pts;
        setScore(nextScore);
        awardActiveSquad(pts);

        if (activeMode === 'ROCKET') {
          setRocketLanes((prev) => {
            const laneIndex = playFormat === 'TEAM' ? activeTeamIdx % prev.length : 0;
            const updated = prev.map((ln, idx) =>
              idx === laneIndex
                ? { ...ln, dist: Math.min(ln.goal, ln.dist + 165) }
                : playFormat === 'SOLO' && idx === 1
                ? { ...ln, dist: Math.min(ln.goal, ln.dist + 75) }
                : ln
            );
            const winner = updated.find((l) => l.dist >= l.goal);
            if (winner) {
              setRocketWinner(winner.name);
              void completeArcadeRun('Rocket Fuel Race', nextScore, 95, waveIdx + 1, Math.max(bestCombo, nextCombo));
            }
            return updated;
          });
          rotateTurn(true);
        }
      } else {
        sfx.playError();
        setCombo(0);
        rotateTurn(true);
        if (activeMode === 'BALLOON' || activeMode === 'METEOR' || activeMode === 'AR_METEOR') {
          setHearts((h) => {
            const rem = h - 1;
            if (rem <= 0) {
              const title = cards.find((c) => c.id === activeMode)?.title || activeMode;
              void completeArcadeRun(title, score, Math.round((correctCount / Math.max(1, totalAnswered + 1)) * 100), waveIdx + 1, bestCombo);
            }
            return rem;
          });
        } else if (activeMode === 'ROCKET' && playFormat === 'SOLO') {
          setRocketLanes((prev) =>
            prev.map((ln, idx) => (idx === 1 ? { ...ln, dist: Math.min(ln.goal, ln.dist + 130) } : ln))
          );
        }
        toast(`Correct answer: ${cur.answer}`, 'error');
      }

      const nextWave = waveIdx + 1;
      setProgressNorm(activeMode === 'BALLOON' ? 0.78 : activeMode === 'AR_RUNNER' ? 0.88 : 0.12);
      if (activeMode !== 'DASH' && activeMode !== 'AR_BLITZ' && nextWave >= waves.length) {
        const title = cards.find((c) => c.id === activeMode)?.title || activeMode || 'Arcade';
        const acc = Math.round(((correctCount + (isRight ? 1 : 0)) / Math.max(1, totalAnswered + 1)) * 100);
        void completeArcadeRun(title, score + (isRight ? 60 : 0), acc, waves.length, bestCombo);
      } else {
        setWaveIdx(nextWave % waves.length);
      }
    },
    [activeMode, activeTeamIdx, awardActiveSquad, bestCombo, cards, combo, completeArcadeRun, correctCount, finished, playFormat, rotateTurn, score, sfx, toast, totalAnswered, waveIdx, waves]
  );

  // Render Team Play HUD inside games
  const renderTeamHud = () => {
    if (playFormat !== 'TEAM' || teamLineup.length === 0) return null;
    const totalPts = teamLineup.reduce((sum, t) => sum + (teamScores[t.id] || 0), 0);
    const activeSquad = teamLineup[activeTeamIdx % teamLineup.length];

    return (
      <div className="team-hud stack-sm">
        <div className="row-between row-wrap">
          <div className="row">
            <span className="badge-pill card-soft-primary">🛡️ TEAM PLAY</span>
            {activeSquad ? (
              <span className="small" style={{ fontWeight: 800 }}>
                Turn: {activeSquad.name}
              </span>
            ) : null}
          </div>
          <div className="row">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => rotateTurn(false)}>
              🔄 Next Turn
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                openTeamBuzzer({
                  contextKey: `arcade_${activeMode || 'hub'}`,
                  title: cards.find((c) => c.id === activeMode)?.title || 'Arcade Buzzer',
                  prompt: waves[waveIdx]?.targetLabel || 'Fastest squad to buzz wins +100 pts!',
                  teams: teamLineup,
                  sessionScores: teamScores,
                })
              }
            >
              🚨 Buzzer (5s)
            </button>
          </div>
        </div>
        {totalPts > 0 ? (
          <div className="tug-bar-track">
            {teamLineup.map((t) => {
              const pts = teamScores[t.id] || 0;
              const pct = Math.max(8, Math.round((pts / totalPts) * 100));
              return (
                <div
                  key={t.id}
                  style={{ width: `${pct}%`, background: avatarColorForTag(t.accentColor) }}
                  title={`${t.name}: ${pts} pts`}
                />
              );
            })}
          </div>
        ) : null}
        <div className="team-hud-pills">
          {teamLineup.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              className={`team-hud-pill ${idx === activeTeamIdx % teamLineup.length ? 'active' : ''}`}
              onClick={() => {
                sfx.playClick();
                setActiveTeamIdx(idx);
              }}
            >
              <span className="xs" style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.name}
              </span>
              <span className="mono xs" style={{ fontWeight: 800 }}>
                {teamScores[t.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Finish Banner
  const renderFinishScreen = (subtitle: string) => (
    <div className="card card-soft-mint stack-md" style={{ textAlign: 'center', padding: 26 }}>
      <h2 className="display-title">🏆 Round Complete!</h2>
      <div className="display-title mono tabular-nums">{score.toLocaleString()} pts</div>
      <p className="small muted" style={{ margin: 0 }}>
        {subtitle}
      </p>
      {playFormat === 'TEAM' && teamLineup.length > 0 ? (
        <div className="card stack-xs" style={{ textAlign: 'left' }}>
          <div className="card-title">Squad Match Standings</div>
          {[...teamLineup]
            .sort((a, b) => (teamScores[b.id] || 0) - (teamScores[a.id] || 0))
            .map((t, i) => (
              <div key={t.id} className="row-between">
                <span className="small" style={{ fontWeight: 800 }}>
                  {['🥇', '🥈', '🥉', '🏅'][i] || '🏅'} {t.name}
                </span>
                <span className="mono small" style={{ fontWeight: 800 }}>
                  {teamScores[t.id] || 0} pts
                </span>
              </div>
            ))}
        </div>
      ) : null}
      <div className="row-between row-wrap">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            if (arcadeRoomIdRef.current) {
              removeArcadeRoomScore(arcadeRoomIdRef.current);
              arcadeRoomIdRef.current = null;
            }
            setActiveMode(null);
          }}
        >
          ← Back to Arcade
        </button>
        <button type="button" className="btn btn-primary" onClick={() => activeMode && startMode(activeMode)}>
          Play Again
        </button>
      </div>
    </div>
  );

  // ---------------- RENDER ACTIVE MINI-GAME ----------------
  if (activeMode) {
    const activeDef = cards.find((c) => c.id === activeMode);
    const isArabicMode = activeDef?.lang === 'AR';

    const renderBody = () => {
      if (finished) {
        return renderFinishScreen(
          rocketWinner
            ? `Winner: ${rocketWinner}! Best Streak: ${bestCombo}x`
            : `${correctCount}/${Math.max(1, totalAnswered)} hits · Best Streak: ${bestCombo}x`
        );
      }

      // 1) Timed Blitz (DASH & AR_BLITZ)
      if (activeMode === 'DASH' || activeMode === 'AR_BLITZ') {
        const cur = waves[waveIdx];
        if (!cur) return null;
        return (
          <div className="stack-md">
            <div className="row-between row-wrap">
              <span className="badge-pill card-soft-secondary mono">⏱ {timeLeft}s</span>
              <span className="mono" style={{ fontWeight: 800 }}>
                Score: {score} · 🔥{combo}x
              </span>
              <div className="row">
                <button
                  type="button"
                  className="chip"
                  disabled={used5050}
                  onClick={() => {
                    if (used5050) return;
                    const wrongIdxs = cur.opts
                      .map((o, i) => (o !== cur.answer ? i : -1))
                      .filter((i) => i >= 0);
                    setHiddenIndices(wrongIdxs.slice(0, 2));
                    setUsed5050(true);
                    sfx.playPop();
                  }}
                >
                  50/50
                </button>
                <button
                  type="button"
                  className="chip"
                  disabled={usedFreeze}
                  onClick={() => {
                    if (usedFreeze) return;
                    setFrozenUntilMs(Date.now() + 5000);
                    setUsedFreeze(true);
                    sfx.playReveal();
                    toast('❄️ Clock frozen for 5s!', 'info');
                  }}
                >
                  ❄️ Freeze
                </button>
              </div>
            </div>
            <WordStageCanvas
              title={cur.targetLabel}
              subtitle={cur.hintLabel || 'Select the exact matching translation!'}
              badgeText={isArabicMode ? 'عربي' : 'BLITZ'}
            />
            <div className="grid-2" dir={isArabicMode ? 'rtl' : 'ltr'}>
              {cur.opts.map((opt, idx) => (
                <button
                  key={`${opt}_${idx}`}
                  type="button"
                  disabled={hiddenIndices.includes(idx)}
                  className="btn btn-outline arabic-text"
                  style={{
                    minHeight: 56,
                    opacity: hiddenIndices.includes(idx) ? 0.25 : 1,
                    justifyContent: 'space-between',
                  }}
                  onClick={() => handleWaveOption(opt)}
                >
                  <span className="badge-pill card-soft-primary mono">{idx + 1}</span>
                  <span className="flex-1" style={{ textAlign: 'center' }}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      }

      // 2) Canvas Animated Games: BALLOON / METEOR / AR_METEOR / ROCKET / AR_RUNNER
      if (
        activeMode === 'BALLOON' ||
        activeMode === 'METEOR' ||
        activeMode === 'AR_METEOR' ||
        activeMode === 'ROCKET' ||
        activeMode === 'AR_RUNNER'
      ) {
        const cur = waves[waveIdx];
        if (!cur) return null;
        const canvasKind =
          activeMode === 'BALLOON'
            ? 'BALLOON'
            : activeMode === 'ROCKET'
            ? 'ROCKET'
            : activeMode === 'AR_RUNNER'
            ? 'AR_RUNNER'
            : 'METEOR';

        return (
          <div className="stack-md">
            <div className="row-between row-wrap">
              {activeMode !== 'ROCKET' ? (
                <span className="badge-pill card-soft-secondary mono">
                  {'❤️'.repeat(Math.max(0, hearts))}
                </span>
              ) : (
                <span className="badge-pill card-soft-primary">🚀 First to 1,000m</span>
              )}
              <span className="badge-pill card-soft-primary mono">
                Wave {waveIdx + 1}/{waves.length}
              </span>
              <span className="mono" style={{ fontWeight: 800 }}>
                {score} pts · 🔥{combo}x
              </span>
            </div>

            <div className="card card-soft-primary row-between">
              <div className="stack-xs" style={{ gap: 2 }}>
                <span className="xs muted">
                  {activeMode === 'BALLOON'
                    ? 'Tap the matching balloon on the canvas or below:'
                    : activeMode === 'AR_RUNNER'
                    ? 'Tap the matching space lane on the canvas or buttons below:'
                    : 'Choose the right target to fire!'}
                </span>
                <div className="display-title arabic-text" style={{ fontSize: '1.35rem' }}>
                  {cur.targetLabel}
                </div>
              </div>
              {cur.speakText ? (
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Speak prompt"
                  onClick={() => ttsSpeaker.speak(cur.speakText || '')}
                >
                  🔊
                </button>
              ) : null}
            </div>

            <AnimatedArcadeCanvas
              kind={canvasKind}
              wave={cur}
              progressNorm={progressNorm}
              hearts={hearts}
              maxHearts={3}
              lanes={rocketLanes}
              runnerLane={runnerLane}
              runnerOpts={cur.opts}
              onCanvasOptionHit={handleWaveOption}
              onRunnerLanePick={(laneIdx) => {
                setRunnerLane(laneIdx);
                const opt = cur.opts[laneIdx];
                if (opt) handleWaveOption(opt);
              }}
            />

            <div className="grid-2" dir={isArabicMode ? 'rtl' : 'ltr'}>
              {cur.opts.map((opt, idx) => (
                <button
                  key={`${opt}_${idx}`}
                  type="button"
                  className="btn btn-outline arabic-text"
                  style={{ minHeight: 54, justifyContent: 'space-between' }}
                  onClick={() => {
                    if (activeMode === 'AR_RUNNER') setRunnerLane(idx);
                    handleWaveOption(opt);
                  }}
                >
                  <span className="badge-pill card-soft-primary mono">{idx + 1}</span>
                  <span className="flex-1" style={{ textAlign: 'center' }}>
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      }

      // 3) Detective (EN & AR)
      if (activeMode === 'DETECTIVE' || activeMode === 'AR_DETECTIVE') {
        const chars = Array.from(detectiveTarget);
        const allFound = chars.length > 0 && chars.every((c) => detectiveGuessed.includes(c));
        const lost = detectiveWrong >= diffCfg.detectiveLives;
        return (
          <div className="stack-md">
            <div className="row-between">
              <span className="badge-pill card-soft-secondary mono">
                Lives: {Math.max(0, diffCfg.detectiveLives - detectiveWrong)}/{diffCfg.detectiveLives}
              </span>
              <div className="row">
                {!isArabicMode ? (
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label="Hear target word"
                    onClick={() => ttsSpeaker.speak(detectiveTarget)}
                  >
                    🔊
                  </button>
                ) : null}
                <button
                  type="button"
                  className="chip"
                  disabled={detectiveHintUsed || allFound || lost}
                  onClick={() => {
                    const unguessed = chars.find((c) => !detectiveGuessed.includes(c));
                    if (unguessed) {
                      setDetectiveGuessed((prev) => [...prev, unguessed]);
                      setDetectiveHintUsed(true);
                      sfx.playReveal();
                    }
                  }}
                >
                  💡 Hint
                </button>
              </div>
            </div>

            <div className="card card-soft-primary stack-xs">
              <span className="xs muted">CLUE</span>
              <p className="card-title arabic-text" style={{ margin: 0 }}>
                {detectiveMeaning} — {detectiveClue}
              </p>
            </div>

            <div className="row row-wrap" style={{ justifyContent: 'center', gap: 8 }} dir={isArabicMode ? 'rtl' : 'ltr'}>
              {chars.map((ch, idx) => {
                const shown = detectiveGuessed.includes(ch) || lost;
                return (
                  <div
                    key={idx}
                    className={`vault-cell ${shown ? (allFound ? 'hit' : 'filled') : ''}`}
                    style={{ width: 42, height: 48 }}
                  >
                    {shown ? ch : ''}
                  </div>
                );
              })}
            </div>

            <div className="alpha-pad" dir={isArabicMode ? 'rtl' : 'ltr'}>
              {detectivePool.map((ch) => {
                const picked = detectiveGuessed.includes(ch);
                const hit = picked && detectiveTarget.includes(ch);
                const miss = picked && !detectiveTarget.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    disabled={picked || allFound || lost}
                    className={`alpha-key ${hit ? 'hit' : miss ? 'miss' : ''}`}
                    onClick={() => {
                      const nextGuessed = [...detectiveGuessed, ch];
                      setDetectiveGuessed(nextGuessed);
                      if (detectiveTarget.includes(ch)) {
                        sfx.playSuccess();
                        setScore((s) => s + 30);
                        awardActiveSquad(30);
                        if (chars.every((c) => nextGuessed.includes(c))) {
                          const finalS = score + 140;
                          setScore(finalS);
                          setCorrectCount(1);
                          setTotalAnswered(1);
                          void completeArcadeRun(
                            isArabicMode ? 'كاشف الكلمة العربية' : 'Word Detective',
                            finalS,
                            Math.round(((diffCfg.detectiveLives - detectiveWrong) / diffCfg.detectiveLives) * 100),
                            1,
                            1
                          );
                        }
                      } else {
                        sfx.playError();
                        const nextWrong = detectiveWrong + 1;
                        setDetectiveWrong(nextWrong);
                        rotateTurn(true);
                        if (nextWrong >= diffCfg.detectiveLives) {
                          toast(`Word was: ${detectiveTarget}`, 'error');
                          void completeArcadeRun(
                            isArabicMode ? 'كاشف الكلمة العربية' : 'Word Detective',
                            score,
                            40,
                            1,
                            0
                          );
                        }
                      }
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // 4) Crime Mystery
      if (activeMode === 'CRIME') {
        const curCase = casesPool[caseIdx % casesPool.length];
        if (!curCase) return null;
        return (
          <div className="stack-md">
            <div className="row-between">
              <span className="badge-pill card-soft-secondary">
                Case {caseIdx + 1}/{casesPool.length} · {curCase.crimeType || 'Investigation'}
              </span>
              <CefrBadge level={curCase.cefrLevel} />
            </div>
            <div className="card stack-xs">
              <div className="row-between">
                <h2 className="card-title" style={{ margin: 0 }}>
                  {curCase.title}
                </h2>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="Read case summary aloud"
                  onClick={() => ttsSpeaker.speak(`${curCase.title}. ${curCase.crimeSceneSummary || ''}`)}
                >
                  🔊
                </button>
              </div>
              <TranslatableText text={curCase.crimeSceneSummary || curCase.summary || ''} />
              <div className="row row-wrap">
                <button type="button" className="chip" onClick={() => setShowCaseTip((v) => !v)}>
                  {showCaseTip ? 'Hide Clue Tip' : '💡 Detective Tip'}
                </button>
              </div>
              {showCaseTip ? (
                <div className="card card-soft-amber stack-xs">
                  <div className="xs">{curCase.detectiveClue}</div>
                  <div className="xs muted arabic-text">{curCase.vocabularyTip}</div>
                </div>
              ) : null}
            </div>

            <div className="stack-sm">
              {curCase.suspects.map((sus) => {
                const interrogated = interrogatedIds.includes(sus.id);
                const chosen = pickedSuspectId === sus.id;
                return (
                  <div
                    key={sus.id}
                    className={`card stack-xs ${
                      pickedSuspectId
                        ? sus.isGuilty
                          ? 'card-soft-mint'
                          : chosen
                          ? 'card-soft-secondary'
                          : ''
                        : ''
                    }`}
                  >
                    <div className="row-between row-wrap">
                      <div>
                        <div className="card-title" style={{ margin: 0 }}>
                          {sus.name}
                        </div>
                        <span className="xs muted">{sus.role}</span>
                      </div>
                      <div className="row">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            sfx.playClick();
                            if (!interrogated) setInterrogatedIds((p) => [...p, sus.id]);
                          }}
                        >
                          {interrogated ? 'Questioned' : '🔍 Interrogate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={Boolean(pickedSuspectId)}
                          onClick={() => {
                            setPickedSuspectId(sus.id);
                            setTotalAnswered((n) => n + 1);
                            if (sus.isGuilty) {
                              sfx.playSuccess();
                              setScore((s) => s + 250);
                              setCorrectCount((c) => c + 1);
                              awardActiveSquad(250);
                              toast(`Case solved! ${sus.name} was guilty!`, 'info');
                            } else {
                              sfx.playError();
                              rotateTurn(true);
                              toast('Wrong suspect! Check the forensic tip.', 'error');
                            }
                          }}
                        >
                          Accuse
                        </button>
                      </div>
                    </div>
                    <div className="small muted">Alibi: {sus.alibi}</div>
                    {interrogated ? (
                      <div className="small" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                        Detail: {sus.suspiciousDetail}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {pickedSuspectId ? (
              <div className="row-between">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    void completeArcadeRun(
                      'Crime Mystery',
                      score,
                      Math.round((correctCount / Math.max(1, totalAnswered)) * 100),
                      totalAnswered,
                      correctCount
                    )
                  }
                >
                  Finish Investigation
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (caseIdx + 1 >= casesPool.length) {
                      void completeArcadeRun(
                        'Crime Mystery',
                        score,
                        Math.round((correctCount / Math.max(1, totalAnswered)) * 100),
                        casesPool.length,
                        correctCount
                      );
                    } else {
                      setCaseIdx((i) => i + 1);
                      setInterrogatedIds([]);
                      setPickedSuspectId(null);
                      setShowCaseTip(false);
                    }
                  }}
                >
                  Next Case →
                </button>
              </div>
            ) : null}
          </div>
        );
      }

      // 5) Evidence Board
      if (activeMode === 'EVIDENCE') {
        const selected = CURATED_EVIDENCE_CARDS.find((c) => c.id === selectedEvidenceId) || CURATED_EVIDENCE_CARDS[0];
        const linkedIdx = CURATED_EVIDENCE_CARDS.findIndex((c) => c.id === selected.id);
        const linkedCase = CRIME_MYSTERY_CASES[linkedIdx % CRIME_MYSTERY_CASES.length];
        const culprit = linkedCase.suspects.find((s) => s.isGuilty)?.name || linkedCase.suspects[0].name;
        const isPinned = profile.pinnedEvidenceIds.includes(selected.id);
        const isSolved = evidenceSolvedIds.includes(selected.id);

        return (
          <div className="stack-md">
            <div className="scroll-x">
              {CURATED_EVIDENCE_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`chip ${selected.id === card.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedEvidenceId(card.id);
                    setEvidenceScanned(false);
                    setPickedEvidenceCulprit(null);
                    sfx.playClick();
                  }}
                >
                  {evidenceSolvedIds.includes(card.id) ? '✅ ' : ''}
                  {card.title}
                </button>
              ))}
            </div>

            <div className="card stack-sm">
              <div className="row-between row-wrap">
                <div>
                  <span className="xs muted">{selected.category}</span>
                  <h2 className="card-title" style={{ margin: 0 }}>
                    {selected.title}
                  </h2>
                </div>
                <div className="row">
                  <CefrBadge level={selected.cefrLevel} />
                  <button
                    type="button"
                    className={`chip ${isPinned ? 'selected' : ''}`}
                    onClick={() => void togglePinEvidence(selected.id)}
                  >
                    {isPinned ? '📌 Pinned' : '📍 Pin Card'}
                  </button>
                </div>
              </div>
              <p className="small">{selected.description}</p>
              <div className="card card-soft-primary stack-xs">
                <span className="xs muted">FORENSIC ENGLISH CLUE</span>
                <TranslatableText text={selected.englishClue || ''} />
                <span className="small arabic-text" style={{ fontWeight: 700 }}>
                  {selected.arabicMeaning}
                </span>
              </div>

              {!evidenceScanned ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEvidenceScanned(true);
                    sfx.playReveal();
                  }}
                >
                  🔬 Run Forensic Lab Scan
                </button>
              ) : (
                <div className="stack-xs">
                  <div className="xs muted" style={{ fontWeight: 800 }}>
                    LINKED CASE: {linkedCase.title} — WHO IS THE CULPRIT?
                  </div>
                  <div className="grid-2">
                    {linkedCase.suspects.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={Boolean(pickedEvidenceCulprit) || isSolved}
                        className={`btn btn-outline ${
                          pickedEvidenceCulprit === s.name
                            ? s.name === culprit
                              ? 'card-soft-mint'
                              : 'card-soft-secondary'
                            : ''
                        }`}
                        onClick={() => {
                          setPickedEvidenceCulprit(s.name);
                          setTotalAnswered((n) => n + 1);
                          if (s.name === culprit) {
                            sfx.playSuccess();
                            setEvidenceSolvedIds((p) => [...new Set([...p, selected.id])]);
                            setCorrectCount((c) => c + 1);
                            setScore((sc) => sc + 160);
                            awardActiveSquad(160);
                            toast(`Matched evidence to ${culprit}!`, 'info');
                          } else {
                            sfx.playError();
                            rotateTurn(true);
                            toast(`Check the clue again — culprit was ${culprit}.`, 'error');
                          }
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="row-between">
              <span className="small muted">
                Solved {evidenceSolvedIds.length}/{CURATED_EVIDENCE_CARDS.length} evidence items
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  void completeArcadeRun(
                    'Evidence Board',
                    score || evidenceSolvedIds.length * 160,
                    Math.round((correctCount / Math.max(1, totalAnswered)) * 100),
                    Math.max(1, totalAnswered),
                    evidenceSolvedIds.length
                  )
                }
              >
                Save Lab Report
              </button>
            </div>
          </div>
        );
      }

      // 6) Vault Codebreaker (EN & AR)
      if (activeMode === 'VAULT' || activeMode === 'AR_VAULT') {
        const targetChars = Array.from(vaultWord);
        const rowsCount = diffCfg.vaultRows;
        const padLetters = isArabicMode ? ARABIC_ALPHABET : EN_ALPHABET;
        const charStatusMap = new Map<string, VaultCellState>();
        vaultGuesses.forEach((guess) => {
          const states = evaluateVaultGuess(vaultWord, guess, isArabicMode);
          Array.from(guess).forEach((ch, idx) => {
            const st = states[idx];
            const prev = charStatusMap.get(ch);
            if (st === 'exact' || !prev || (st === 'present' && prev === 'absent')) {
              charStatusMap.set(ch, st);
            }
          });
        });

        const submitVault = () => {
          const clean = isArabicMode ? vaultInput.trim() : vaultInput.trim().toUpperCase();
          if (Array.from(clean).length !== targetChars.length) {
            toast(`Enter ${targetChars.length} letters first.`, 'error');
            return;
          }
          const nextGuesses = [...vaultGuesses, clean];
          setVaultGuesses(nextGuesses);
          setVaultInput('');
          setTotalAnswered(nextGuesses.length);
          const won = clean === vaultWord;
          if (won) {
            const finalS = Math.max(120, 420 - (nextGuesses.length - 1) * 60);
            setScore(finalS);
            setCorrectCount(1);
            awardActiveSquad(finalS);
            void completeArcadeRun(
              isArabicMode ? 'خزنة الحروف العربية' : 'Vault Codebreaker',
              finalS,
              100,
              nextGuesses.length,
              1
            );
          } else if (nextGuesses.length >= rowsCount) {
            sfx.playError();
            toast(`Vault code was: ${vaultWord}`, 'error');
            void completeArcadeRun(
              isArabicMode ? 'خزنة الحروف العربية' : 'Vault Codebreaker',
              60,
              30,
              nextGuesses.length,
              0
            );
          } else {
            sfx.playFlip();
            rotateTurn(true);
          }
        };

        return (
          <div className="stack-md">
            <div className="row-between">
              <span className="badge-pill card-soft-primary">
                Attempts: {vaultGuesses.length}/{rowsCount}
              </span>
              <button
                type="button"
                className="chip"
                disabled={vaultHintUsed}
                onClick={() => {
                  const idx = Array.from(vaultInput).length;
                  if (idx < targetChars.length) {
                    setVaultInput((v) => v + targetChars[idx]);
                    setVaultHintUsed(true);
                    sfx.playReveal();
                  }
                }}
              >
                💡 Reveal Next Letter
              </button>
            </div>
            <div className="card card-soft-amber arabic-text">
              <span className="xs muted">CIPHER CLUE: </span>
              <strong>{vaultClue}</strong>
            </div>

            <div className="stack-xs" style={{ alignItems: 'center' }} dir={isArabicMode ? 'rtl' : 'ltr'}>
              {Array.from({ length: rowsCount }, (_, rIdx) => {
                const gStr = vaultGuesses[rIdx];
                const isCurrent = rIdx === vaultGuesses.length;
                const evalStates = gStr ? evaluateVaultGuess(vaultWord, gStr, isArabicMode) : [];
                const displayChars = gStr
                  ? Array.from(gStr)
                  : isCurrent
                  ? Array.from(vaultInput)
                  : [];

                return (
                  <div
                    key={rIdx}
                    className="vault-row"
                    style={{ gridTemplateColumns: `repeat(${targetChars.length}, minmax(0, 1fr))` }}
                  >
                    {targetChars.map((_, cIdx) => {
                      const st = evalStates[cIdx];
                      const cls =
                        st === 'exact'
                          ? 'hit'
                          : st === 'present'
                          ? 'present'
                          : st === 'absent'
                          ? 'miss'
                          : displayChars[cIdx]
                          ? 'filled'
                          : '';
                      return (
                        <div key={cIdx} className={`vault-cell ${cls}`}>
                          {displayChars[cIdx] || ''}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="alpha-pad" dir={isArabicMode ? 'rtl' : 'ltr'}>
              {padLetters.map((ch) => {
                const st = charStatusMap.get(ch);
                const cls = st === 'exact' ? 'hit' : st === 'present' ? 'present' : st === 'absent' ? 'miss' : '';
                return (
                  <button
                    key={ch}
                    type="button"
                    className={`alpha-key ${cls}`}
                    onClick={() => {
                      if (Array.from(vaultInput).length < targetChars.length) {
                        sfx.playClick();
                        setVaultInput((v) => v + ch);
                      }
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>

            <div className="row-between">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  const arr = Array.from(vaultInput);
                  arr.pop();
                  setVaultInput(arr.join(''));
                }}
              >
                ⌫ Delete
              </button>
              <button type="button" className="btn btn-primary" onClick={submitVault}>
                Unlock Vault →
              </button>
            </div>
          </div>
        );
      }

      // 7) Speed Duel (EN & AR)
      if (activeMode === 'DUEL' || activeMode === 'AR_DUEL') {
        const round = duelRounds[duelIdx % Math.max(1, duelRounds.length)];
        if (!round) return null;
        return (
          <div className="stack-md">
            <div className="row-between">
              <span className="badge-pill card-soft-secondary mono">⏱ {timeLeft}s</span>
              <span className="mono" style={{ fontWeight: 800 }}>
                Score: {score} · 🔥{combo}x
              </span>
            </div>
            <div className="card card-soft-primary stack-xs" dir={isArabicMode ? 'rtl' : 'ltr'}>
              <span className="xs muted">{isArabicMode ? 'اختر الإجابة الدقيقة' : 'SPOT THE ODD CLUE'}</span>
              <h2 className="card-title arabic-text" style={{ margin: 0 }}>
                {round.prompt}
              </h2>
            </div>
            <div className="grid-2" dir={isArabicMode ? 'rtl' : 'ltr'}>
              {round.opts.map((opt, idx) => (
                <button
                  key={`${opt}_${idx}`}
                  type="button"
                  className="btn btn-outline arabic-text"
                  style={{ minHeight: 58 }}
                  onClick={() => {
                    setTotalAnswered((n) => n + 1);
                    if (idx === round.oddIndex) {
                      sfx.playSuccess();
                      const nextC = combo + 1;
                      setCombo(nextC);
                      setBestCombo((b) => Math.max(b, nextC));
                      setCorrectCount((c) => c + 1);
                      const pts = 90 + Math.min(nextC, 4) * 20;
                      setScore((s) => s + pts);
                      awardActiveSquad(pts);
                    } else {
                      sfx.playError();
                      setCombo(0);
                      rotateTurn(true);
                      toast(round.explanation, 'error');
                    }
                    setDuelIdx((i) => i + 1);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      }

      // 8) 3D Memory Flip
      if (activeMode === 'MEMORY') {
        return (
          <div className="stack-md">
            <div className="row-between">
              <span className="badge-pill card-soft-primary">
                Pairs: {memMatched.length}/6
              </span>
              <span className="mono small" style={{ fontWeight: 800 }}>
                Moves: {memMoves} · Score: {score}
              </span>
            </div>
            <div className="memory-grid">
              {memTiles.map((tile, idx) => {
                const isMatched = memMatched.includes(tile.pairId);
                const isOpen = isMatched || memFlipped.includes(idx);
                return (
                  <button
                    key={tile.uid}
                    type="button"
                    className="memory-tile-scene"
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                    onClick={() => {
                      if (memLocked || isOpen || memFlipped.includes(idx)) return;
                      sfx.playFlip();
                      const nextFlipped = [...memFlipped, idx];
                      setMemFlipped(nextFlipped);
                      if (nextFlipped.length === 2) {
                        setMemMoves((m) => m + 1);
                        setMemLocked(true);
                        const [aIdx, bIdx] = nextFlipped;
                        const a = memTiles[aIdx];
                        const b = memTiles[bIdx];
                        if (a && b && a.pairId === b.pairId) {
                          const nextMatched = [...memMatched, a.pairId];
                          setTimeout(() => {
                            sfx.playSuccess();
                            setMemMatched(nextMatched);
                            setMemFlipped([]);
                            setMemLocked(false);
                            const pts = 110;
                            const nextS = score + pts;
                            setScore(nextS);
                            setCorrectCount(nextMatched.length);
                            setTotalAnswered(memMoves + 1);
                            awardActiveSquad(pts);
                            if (nextMatched.length === 6) {
                              void completeArcadeRun('3D Memory Flip', nextS, 100, 6, 6);
                            }
                          }, 420);
                        } else {
                          setTimeout(() => {
                            sfx.playError();
                            setMemFlipped([]);
                            setMemLocked(false);
                            rotateTurn(true);
                          }, 720);
                        }
                      }
                    }}
                  >
                    <div className={`memory-tile ${isOpen ? 'flipped' : ''}`}>
                      <div className="memory-face memory-back">?</div>
                      <div
                        className={`memory-face memory-front ${tile.kind === 'ar' ? 'ar arabic-text' : ''} ${
                          isMatched ? 'matched' : ''
                        }`}
                      >
                        {tile.text}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // 9) Spin Wheel
      if (activeMode === 'WHEEL') {
        return (
          <div className="stack-md" style={{ alignItems: 'center' }}>
            <SpinWheelCanvas slices={WHEEL_SLICES} rotationDeg={wheelRot} size={280} />
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={wheelSpinning}
              onClick={() => {
                setWheelSpinning(true);
                sfx.playClick();
                const pickedIdx = Math.floor(Math.random() * WHEEL_SLICES.length);
                const sliceDeg = 360 / WHEEL_SLICES.length;
                const extra = 720 + (360 - pickedIdx * sliceDeg - sliceDeg / 2);
                const targetRot = wheelRot + extra;
                setWheelRot(targetRot);
                setTimeout(() => {
                  setWheelSpinning(false);
                  const chosen = WHEEL_SLICES[pickedIdx];
                  setWheelSlice(chosen);
                  sfx.playFanfare();
                  triggerConfetti();
                  setScore((s) => s + chosen.bonusXp * 5);
                  awardActiveSquad(chosen.bonusXp * 5);
                  void awardActivity({
                    activityType: ActivityType.GAME,
                    title: `Spin Wheel · ${chosen.title}`,
                    cefrLevel: profile.learningLevel,
                    score: chosen.bonusXp * 5,
                    xpDelta: chosen.bonusXp,
                    arcadePlayed: true,
                  });
                }, 850);
              }}
            >
              {wheelSpinning ? 'Spinning...' : '🎡 Spin the Wheel!'}
            </button>
            {wheelSlice ? (
              <div className="card card-soft-mint stack-xs" style={{ width: '100%' }}>
                <div className="row-between">
                  <strong className="card-title">{wheelSlice.title}</strong>
                  <span className="badge-pill card-soft-amber">+{wheelSlice.bonusXp} XP</span>
                </div>
                <p className="small" style={{ margin: 0 }}>
                  {wheelSlice.challengePrompt}
                </p>
              </div>
            ) : null}
          </div>
        );
      }

      // 10) Arabic Treasure Maze (5x5 grid)
      if (activeMode === 'AR_MAZE') {
        const curQ = waves[waveIdx % Math.max(1, waves.length)];
        const traps = new Set(['1,0', '3,1', '1,3', '3,3']);
        const tryMove = (dr: number, dc: number) => {
          if (!mazeAwaitingMove) return;
          const nr = mazePos.r + dr;
          const nc = mazePos.c + dc;
          if (nr < 0 || nr > 4 || nc < 0 || nc > 4) return;
          const key = `${nr},${nc}`;
          setMazePos({ r: nr, c: nc });
          setMazeVisited((prev) => [...new Set([...prev, key])]);
          setMazeAwaitingMove(false);
          setWaveIdx((w) => w + 1);
          if (traps.has(key)) {
            sfx.playError();
            setHearts((h) => {
              const rem = h - 1;
              if (rem <= 0) {
                void completeArcadeRun('متاهة الكنز والفضاء', score, 60, waveIdx + 1, bestCombo);
              }
              return rem;
            });
            toast('⚠️ فخ فضائي! خسرت قلباً!', 'error');
          } else if (nr === 4 && nc === 4) {
            const winScore = score + 300;
            setScore(winScore);
            awardActiveSquad(300);
            void completeArcadeRun('متاهة الكنز والفضاء', winScore, 100, waveIdx + 1, bestCombo);
          } else {
            sfx.playPop();
          }
        };

        return (
          <div className="stack-md">
            <div className="row-between">
              <span className="badge-pill card-soft-secondary">{'❤️'.repeat(Math.max(0, hearts))}</span>
              <span className="mono small" style={{ fontWeight: 800 }}>
                Score: {score} · Goal: 💎(5,5)
              </span>
            </div>
            <div className="maze-grid">
              {Array.from({ length: 25 }, (_, idx) => {
                const r = Math.floor(idx / 5);
                const c = idx % 5;
                const key = `${r},${c}`;
                const isPlayer = mazePos.r === r && mazePos.c === c;
                const isGoal = r === 4 && c === 4;
                const isTrap = traps.has(key) && mazeVisited.includes(key);
                const isVisited = mazeVisited.includes(key);
                return (
                  <div
                    key={key}
                    className={`maze-tile ${isPlayer ? 'player' : isGoal ? 'goal' : isTrap ? 'trap' : isVisited ? 'visited' : ''}`}
                  >
                    {isPlayer ? '🧭' : isGoal ? '💎' : isTrap ? '⚠️' : isVisited ? '✓' : '·'}
                  </div>
                );
              })}
            </div>

            {mazeAwaitingMove ? (
              <div className="card card-soft-mint stack-sm" style={{ alignItems: 'center' }}>
                <span className="small" style={{ fontWeight: 800 }}>
                  ✅ طريق مفتوح! اختر اتجاه التحرك في المتاهة:
                </span>
                <div className="row">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => tryMove(-1, 0)}>
                    ⬆️ شمال
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => tryMove(1, 0)}>
                    ⬇️ جنوب
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => tryMove(0, 1)}>
                    ➡️ يمين
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => tryMove(0, -1)}>
                    ⬅️ يسار
                  </button>
                </div>
              </div>
            ) : curQ ? (
              <div className="stack-sm" dir="rtl">
                <div className="card card-soft-primary arabic-text">
                  <strong>{curQ.targetLabel}</strong>
                </div>
                <div className="grid-2">
                  {curQ.opts.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className="btn btn-outline arabic-text"
                      onClick={() => {
                        setTotalAnswered((n) => n + 1);
                        if (opt === curQ.answer) {
                          sfx.playSuccess();
                          setScore((s) => s + 95);
                          setCorrectCount((c) => c + 1);
                          awardActiveSquad(95);
                          setMazeAwaitingMove(true);
                        } else {
                          sfx.playError();
                          rotateTurn(true);
                          setHearts((h) => {
                            const rem = h - 1;
                            if (rem <= 0) {
                              void completeArcadeRun('متاهة الكنز والفضاء', score, 50, waveIdx + 1, bestCombo);
                            }
                            return rem;
                          });
                          setWaveIdx((w) => w + 1);
                        }
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      }

      return null;
    };

    return (
      <div className="stack-lg" data-testid="arcade-stage">
        <div className="row-between row-wrap">
          <h1 className="display-title" style={{ margin: 0, fontSize: '1.4rem' }}>
            {activeDef?.icon} {activeDef?.title}
          </h1>
          <div className="row">
            <button
              type="button"
              className="btn btn-soft btn-sm"
              onClick={() =>
                openTeamBuzzer({
                  contextKey: `arcade_${activeMode}`,
                  title: activeDef?.title || 'Arcade Buzzer',
                  prompt: 'Buzz in first to win +100 team points!',
                  teams: teamLineup.length ? teamLineup : undefined,
                  sessionScores: teamLineup.length ? teamScores : undefined,
                })
              }
            >
              🚨 Buzzer
            </button>
            <button
              type="button"
              className="btn-icon"
              aria-label="Open Squad Chat"
              onClick={() => setChatOpen(true)}
            >
              💬
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                if (arcadeRoomIdRef.current) {
                  removeArcadeRoomScore(arcadeRoomIdRef.current);
                  arcadeRoomIdRef.current = null;
                }
                setActiveMode(null);
              }}
            >
              ← Arcade
            </button>
          </div>
        </div>

        {renderTeamHud()}
        {renderBody()}
        <InGameChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    );
  }

  // ---------------- ARCADE HUB DIRECTORY ----------------
  return (
    <div className="stack-lg" data-testid="arcade-hub">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            🎮 Interactive Arcade
          </h1>
          <span className="small muted">
            18 bilingual English & Arabic games · Solo or 2–4 Squad Pass-and-Play
          </span>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btn-soft btn-sm"
            onClick={() =>
              openTeamBuzzer({
                contextKey: 'arcade_hub',
                title: 'Arcade Team Buzzer',
                prompt: 'Fastest squad to buzz wins the turn!',
              })
            }
          >
            🚨 Team Buzzer
          </button>
          <button
            type="button"
            className="btn-icon"
            aria-label="Open Squad Chat"
            onClick={() => setChatOpen(true)}
          >
            💬
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
            ← Home
          </button>
        </div>
      </div>

      {/* Play Format, Squads, Language & Difficulty Controls */}
      <section className="card stack-sm">
        <div className="row-between row-wrap">
          <div className="row-wrap">
            <button
              type="button"
              className={`chip ${playFormat === 'SOLO' ? 'selected' : ''}`}
              onClick={() => {
                sfx.playClick();
                setPlayFormat('SOLO');
              }}
            >
              🧑 Solo Play
            </button>
            <button
              type="button"
              className={`chip ${playFormat === 'TEAM' ? 'selected' : ''}`}
              onClick={() => {
                sfx.playClick();
                setPlayFormat('TEAM');
              }}
            >
              🛡️ Team Play (2–4 Squads)
            </button>
          </div>

          {playFormat === 'TEAM' ? (
            <div className="row-wrap">
              {[2, 3, 4].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  className={`chip ${squadCount === cnt ? 'selected' : ''}`}
                  onClick={() => {
                    sfx.playClick();
                    setSquadCount(cnt);
                  }}
                >
                  {cnt} Squads
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="row-between row-wrap">
          <div className="row-wrap">
            <button
              type="button"
              className={`chip ${hubLang === 'ALL' ? 'selected' : ''}`}
              onClick={() => setHubLang('ALL')}
            >
              🌐 All ({cards.length})
            </button>
            <button
              type="button"
              className={`chip ${hubLang === 'EN' ? 'selected' : ''}`}
              onClick={() => setHubLang('EN')}
            >
              🇬🇧 English (11)
            </button>
            <button
              type="button"
              className={`chip ${hubLang === 'AR' ? 'selected' : ''}`}
              onClick={() => setHubLang('AR')}
            >
              🇸🇦 ألعاب عربية (7)
            </button>
          </div>

          <div className="row-wrap">
            {DIFFICULTY_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`chip ${difficulty === lvl ? 'selected' : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setDifficulty(lvl);
                }}
              >
                {DIFFICULTY_CONFIG[lvl].label}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-x">
          {(
            [
              { id: 'ALL', label: 'All Types' },
              { id: 'BLITZ', label: 'Fast Blitz' },
              { id: 'DETECTIVE', label: 'Detective' },
              { id: 'MEMORY', label: 'Brain & Memory' },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${hubCat === c.id ? 'selected' : ''}`}
              onClick={() => setHubCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <span className="xs muted">
          {diffCfg.label} Preset · {diffCfg.dashDurationSec}s Blitz · {diffCfg.detectiveLives} Lives ·{' '}
          {diffCfg.vaultRows} Cipher Rows · {diffCfg.xpMultiplier}x XP
          {teamContributions.length > 0 ? ` · ${teamContributions.length} squad logs recorded` : ''}
        </span>
      </section>

      <div className="grid-modes">
        {visibleCards.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`tactile-card ${g.lang === 'AR' ? 'arabic-text' : ''}`}
            dir={g.lang === 'AR' ? 'rtl' : 'ltr'}
            style={{ background: g.bg, color: g.ink }}
            onClick={() => startMode(g.id)}
            data-testid={`arcade-card-${g.id.toLowerCase()}`}
          >
            <div className="row-between" dir="ltr">
              <span style={{ fontSize: '1.9rem' }}>{g.icon}</span>
              <div className="row" style={{ gap: 4 }}>
                {playFormat === 'TEAM' ? (
                  <span className="badge-pill" style={{ background: '#563AE4', color: '#FFFFFF' }}>
                    🛡️ TEAM
                  </span>
                ) : null}
                <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.7)', color: '#171625' }}>
                  {g.lang === 'AR' ? '🇸🇦 عربي' : '🇬🇧 EN'}
                </span>
              </div>
            </div>
            <div className="stack-xs">
              <div className="card-title" style={{ margin: 0 }}>
                {g.title}
              </div>
              <div className="xs" style={{ opacity: 0.88 }}>
                {g.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      <InGameChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};
