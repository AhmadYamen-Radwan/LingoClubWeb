import React, { useEffect, useRef } from 'react';
import { WheelSliceItem } from '../data/curatedContent';

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>, defaultW: number, defaultH: number) {
  const sizeRef = useRef({ w: defaultW, h: defaultH });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0) {
        sizeRef.current = {
          w: Math.round(rect.width),
          h: Math.round(rect.height || defaultH),
        };
      }
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [ref, defaultH]);

  return sizeRef;
}

export const LanguageCubeCanvas: React.FC<{ size?: number }> = ({ size = 140 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    let raf = 0;
    const render = (t: number) => {
      const s = t * 0.0011;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.27;
      const ax = Math.sin(s * 0.7) * 0.45 + 0.42;
      const ay = s;

      const verts = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ].map(([x, y, z]) => {
        const y1 = y * Math.cos(ax) - z * Math.sin(ax);
        const z1 = y * Math.sin(ax) + z * Math.cos(ax);
        const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
        const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
        const p = 2.9 / (2.9 - z2 * 0.65);
        return { x: cx + x2 * r * p, y: cy + y1 * r * p, z: z2 };
      });

      const faces: Array<{ idx: number[]; fill: string; label: string }> = [
        { idx: [0, 1, 2, 3], fill: 'rgba(86, 58, 228, 0.86)', label: 'EN' },
        { idx: [4, 5, 6, 7], fill: 'rgba(14, 159, 110, 0.86)', label: 'AR' },
        { idx: [0, 1, 5, 4], fill: 'rgba(245, 158, 11, 0.84)', label: 'B2' },
        { idx: [2, 3, 7, 6], fill: 'rgba(255, 90, 95, 0.84)', label: 'XP' },
        { idx: [1, 2, 6, 5], fill: 'rgba(124, 58, 237, 0.84)', label: '3D' },
        { idx: [0, 3, 7, 4], fill: 'rgba(19, 104, 206, 0.84)', label: 'A1' },
      ];

      const sorted = faces
        .map((f) => ({
          ...f,
          depth: f.idx.reduce((acc, i) => acc + verts[i].z, 0) / 4,
        }))
        .sort((a, b) => a.depth - b.depth);

      for (const f of sorted) {
        const pts = f.idx.map((i) => verts[i]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fillStyle = f.fill;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        const mx = pts.reduce((a, p) => a + p.x, 0) / 4;
        const my = pts.reduce((a, p) => a + p.y, 0) / 4;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `800 ${Math.round(size * 0.11)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.label, mx, my);
      }
      ctx.restore();
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="language-cube-canvas"
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-label="3D rotating language cube"
    />
  );
};

export const DailyGoalRingCanvas: React.FC<{
  progressPct: number;
  centerLabel: string;
  size?: number;
}> = ({ progressPct, centerLabel, size = 112 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.39;
    const clamped = Math.min(1, Math.max(0, progressPct / 100));

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(130, 128, 160, 0.22)';
    ctx.lineWidth = 10;
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#563AE4');
    grad.addColorStop(1, '#0E9F6E');

    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamped);
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#171625';
    ctx.font = '800 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerLabel, cx, cy);
  }, [centerLabel, progressPct, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-label={`Daily goal progress ${Math.round(progressPct)}%`}
    />
  );
};

export const TrophyCanvas: React.FC<{ size?: number }> = ({ size = 110 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    let raf = 0;
    const draw = (t: number) => {
      const bob = Math.sin(t * 0.003) * 3;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2 + bob;

      const grad = ctx.createRadialGradient(cx, cy - 8, 6, cx, cy, size * 0.45);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${Math.round(size * 0.5)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏆', cx, cy);
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} aria-label="Champion trophy visual" />;
};

export const SpinWheelCanvas: React.FC<{
  slices: WheelSliceItem[];
  rotationDeg: number;
  size?: number;
}> = ({ slices, rotationDeg, size = 280 }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const measured = useContainerSize(wrapRef, size, size);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dim = Math.max(210, Math.min(size, measured.current.w || size));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dim * dpr;
    canvas.height = dim * dpr;
    canvas.style.width = `${dim}px`;
    canvas.style.height = `${dim}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dim, dim);

    const cx = dim / 2;
    const cy = dim / 2;
    const r = dim * 0.44;
    const count = slices.length || 1;
    const arc = (Math.PI * 2) / count;
    const radOffset = ((rotationDeg - 90) * Math.PI) / 180;

    slices.forEach((sl, idx) => {
      const start = radOffset + idx * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = sl.color || '#563AE4';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 12px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(sl.shortLabel, r - 12, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#171625';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer triangle at 12 o'clock
    ctx.beginPath();
    ctx.moveTo(cx, cy - r + 8);
    ctx.lineTo(cx - 10, cy - r - 10);
    ctx.lineTo(cx + 10, cy - r - 10);
    ctx.closePath();
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }, [measured, rotationDeg, size, slices]);

  return (
    <div ref={wrapRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <canvas ref={canvasRef} data-testid="spin-wheel-canvas" aria-label="Interactive prize wheel" />
    </div>
  );
};

export const WordStageCanvas: React.FC<{
  title: string;
  subtitle: string;
  badgeText?: string;
  accentColor?: string;
}> = ({ title, subtitle, badgeText = 'LIVE', accentColor = '#563AE4' }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const measured = useContainerSize(wrapRef, 520, 128);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = Math.max(260, measured.current.w || 520);
    const h = 126;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    let raf = 0;
    const draw = (t: number) => {
      ctx.save();
      ctx.scale(dpr, dpr);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#131426');
      grad.addColorStop(1, '#231D4E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Animated ambient wave dots
      for (let i = 0; i < 14; i++) {
        const px = ((i / 13) * w + t * 0.02) % w;
        const py = h * 0.5 + Math.sin(t * 0.0025 + i * 0.8) * 26;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? accentColor : 'rgba(255,255,255,0.22)';
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(16, 16, 74, 22);
      ctx.fillStyle = '#FCD34D';
      ctx.font = '800 11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, 24, 27);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 ${w < 380 ? 18 : 22}px Outfit, sans-serif`;
      ctx.fillText(title.slice(0, 38), 16, 66);

      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.font = '600 13px Plus Jakarta Sans, sans-serif';
      ctx.fillText(subtitle.slice(0, 62), 16, 98);

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [accentColor, badgeText, measured, subtitle, title]);

  return (
    <div ref={wrapRef} className="arcade-canvas-box">
      <canvas ref={canvasRef} data-testid="word-stage-canvas" aria-label={`${title} arcade stage`} />
    </div>
  );
};
