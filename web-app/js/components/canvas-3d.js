// Interactive HTML5 Canvas 3D Visuals & Celebration Effects
// Self-disposing requestAnimationFrame loops (auto-stop when canvas leaves DOM)

export function createLanguageCubeCanvas({ size = 88, onTap = null } = {}) {
  const wrapper = document.createElement('div');
  wrapper.style.width = `${size}px`;
  wrapper.style.height = `${size}px`;
  wrapper.style.position = 'relative';
  wrapper.style.cursor = 'grab';
  wrapper.style.touchAction = 'none';
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('aria-label', 'Interactive 3D English Arabic language cube. Drag or tap to spin.');

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  wrapper.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const vertices = [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]
  ];
  const faces = [
    { idx: [0, 1, 2, 3], color: '#563AE4', label: 'A1' },
    { idx: [5, 4, 7, 6], color: '#FF5A5F', label: 'B2' },
    { idx: [4, 5, 1, 0], color: '#F59E0B', label: 'EN' },
    { idx: [3, 2, 6, 7], color: '#0E9F6E', label: 'AR' },
    { idx: [1, 5, 6, 2], color: '#0EA5E9', label: 'A2' },
    { idx: [4, 0, 3, 7], color: '#A855F7', label: 'B1' }
  ];

  let dragYaw = 0.45;
  let dragPitch = -0.38;
  let spinBoost = 0;
  let targetBoost = 0;
  let pointerDown = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;

  wrapper.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    moved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    wrapper.setPointerCapture?.(e.pointerId);
  });
  wrapper.addEventListener('pointermove', (e) => {
    if (!pointerDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    dragYaw += dx * 0.015;
    dragPitch = Math.max(-1.2, Math.min(1.2, dragPitch + dy * 0.015));
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const endDrag = () => {
    if (pointerDown && !moved) {
      targetBoost += Math.PI * 1.5;
      onTap?.();
    }
    pointerDown = false;
  };
  wrapper.addEventListener('pointerup', endDrag);
  wrapper.addEventListener('pointercancel', () => { pointerDown = false; });
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      targetBoost += Math.PI * 1.5;
      onTap?.();
    }
  });

  const rotX = ([x, y, z], a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [x, y * c - z * s, y * s + z * c];
  };
  const rotY = ([x, y, z], a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [x * c + z * s, y, -x * s + z * c];
  };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const light = norm([-0.45, -0.65, 0.85]);

  const startMs = performance.now();
  const draw = (now) => {
    if (!wrapper.isConnected) return;
    const t = (now - startMs) / 1000;
    spinBoost += (targetBoost - spinBoost) * 0.1;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const bob = Math.sin(t * 2) * (size * 0.03);
    const cy = size / 2 + bob;
    const radius = size * 0.27;
    const yaw = t * 0.7 + dragYaw + spinBoost;
    const pitch = dragPitch + Math.sin(t * 2) * 0.08;
    const cam = 4.6;

    // Ground oval shadow
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(cx, size * 0.86, radius * 1.02, radius * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const rotated = vertices.map((v) => rotY(rotX(v, pitch), yaw));
    const proj = (v) => {
      const f = cam / (cam - v[2]);
      return [cx + v[0] * radius * f, cy + v[1] * radius * f];
    };

    const visible = [];
    for (const face of faces) {
      const [v0, v1, v2, v3] = face.idx.map((i) => rotated[i]);
      const n = norm(cross(sub(v1, v0), sub(v2, v0)));
      if (n[2] > -0.05) {
        const cz = (v0[2] + v1[2] + v2[2] + v3[2]) * 0.25;
        const center = [
          (v0[0] + v1[0] + v2[0] + v3[0]) * 0.25,
          (v0[1] + v1[1] + v2[1] + v3[1]) * 0.25,
          cz
        ];
        visible.push({ face, n, cz, center, pts: [v0, v1, v2, v3].map(proj) });
      }
    }
    visible.sort((a, b) => a.cz - b.cz);

    for (const item of visible) {
      const { face, n, pts, center } = item;
      const diff = Math.max(0, Math.min(1, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();

      ctx.fillStyle = face.color;
      ctx.fill();
      // Specular shading tint
      ctx.fillStyle = `rgba(255,255,255,${(diff * 0.24).toFixed(2)})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      if (n[2] > 0.42 && size >= 58) {
        const c2 = proj(center);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0.45, Math.min(1, n[2])).toFixed(2)})`;
        ctx.font = `800 ${Math.round(radius * 0.56)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(face.label, c2[0], c2[1]);
      }
    }

    // Orbiting accent orbs
    const orbColors = ['#F59E0B', '#0E9F6E', '#FF5A5F'];
    for (let i = 0; i < 3; i++) {
      const ang = yaw * 1.4 + i * ((Math.PI * 2) / 3);
      const op = rotX([Math.cos(ang) * 1.72, Math.sin(ang * 0.8) * 0.52, Math.sin(ang) * 1.72], 0.32);
      const p2 = proj(op);
      const r = radius * 0.16 * (cam / (cam - op[2]));
      ctx.fillStyle = orbColors[i];
      ctx.beginPath();
      ctx.arc(p2[0], p2[1], r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
  return wrapper;
}

export function createTrophyCanvas({ size = 104 } = {}) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.setAttribute('aria-hidden', 'true');

  const ctx = canvas.getContext('2d');
  const start = performance.now();

  const draw = (now) => {
    if (!canvas.isConnected) return;
    const t = (now - start) / 1000;
    const bob = Math.sin(t * 2.4) * 3;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const w = size;
    const h = size;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.9, w * 0.28, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);

    // Glow
    const glow = ctx.createRadialGradient(cx, h * 0.42, 4, cx, h * 0.42, w * 0.45);
    glow.addColorStop(0, 'rgba(255,193,7,0.36)');
    glow.addColorStop(1, 'rgba(255,193,7,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, h * 0.42, w * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Handles
    ctx.lineCap = 'round';
    ctx.lineWidth = w * 0.05;
    ctx.strokeStyle = '#B45309';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.21, h * 0.22);
    ctx.bezierCurveTo(cx - w * 0.4, h * 0.22, cx - w * 0.39, h * 0.48, cx - w * 0.14, h * 0.49);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.21, h * 0.22);
    ctx.bezierCurveTo(cx + w * 0.4, h * 0.22, cx + w * 0.39, h * 0.48, cx + w * 0.14, h * 0.49);
    ctx.stroke();

    // Pedestal
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.21, h * 0.72, w * 0.42, h * 0.13, w * 0.04);
    ctx.fill();

    // Stem
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.055, h * 0.54, w * 0.11, h * 0.2, 4);
    ctx.fill();

    // Cup
    const grad = ctx.createLinearGradient(cx - w * 0.24, 0, cx + w * 0.24, 0);
    grad.addColorStop(0, '#B45309');
    grad.addColorStop(0.3, '#FFC107');
    grad.addColorStop(0.5, '#FFF8E1');
    grad.addColorStop(0.7, '#FFC107');
    grad.addColorStop(1, '#B45309');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.24, h * 0.17);
    ctx.lineTo(cx + w * 0.24, h * 0.17);
    ctx.bezierCurveTo(cx + w * 0.24, h * 0.49, cx + w * 0.11, h * 0.56, cx, h * 0.56);
    ctx.bezierCurveTo(cx - w * 0.11, h * 0.56, cx - w * 0.24, h * 0.49, cx - w * 0.24, h * 0.17);
    ctx.closePath();
    ctx.fill();

    // Rim
    ctx.fillStyle = '#FFE082';
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.17, w * 0.24, h * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting sparkles
    const colors = ['#38BDF8', '#FF5A5F', '#0E9F6E', '#FFF59D'];
    for (let i = 0; i < 4; i++) {
      const ang = t * 1.4 + i * (Math.PI / 2);
      const ox = cx + Math.cos(ang) * (w * 0.37);
      const oy = h * 0.34 + Math.sin(ang) * (h * 0.12);
      const r = w * 0.042 * (0.75 + 0.3 * ((Math.sin(ang) + 1) * 0.5));
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
  return canvas;
}

export function createDailyGoalRingCanvas({ xp = 0, target = 150, size = 72 } = {}) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext('2d');
  const pct = Math.min(1, (xp % target || (xp > 0 ? target : 0)) / target);

  ctx.save();
  ctx.scale(dpr, dpr);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  ctx.strokeStyle = 'rgba(86, 58, 228, 0.16)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#563AE4';
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.06, pct));
  ctx.stroke();

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink') || '#171625';
  ctx.font = '800 13px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(pct * 100)}%`, cx, cy);
  ctx.restore();

  return canvas;
}

export function createSpinWheelCanvas({ slices, rotationDeg = 0, size = 272 } = {}) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const render = (deg) => {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2 + 6;
    const r = size * 0.42;
    const sweep = (Math.PI * 2) / slices.length;
    const rotRad = (deg * Math.PI) / 180;

    slices.forEach((slice, i) => {
      const start = rotRad + i * sweep - Math.PI / 2;
      const end = start + sweep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = slice.colorHex || '#563AE4';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sweep / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(slice.label, r - 12, 0);
      ctx.restore();
    });

    // Center cap
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#563AE4';
    ctx.font = '800 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', cx, cy);

    // Top Pointer Triangle
    ctx.fillStyle = '#171625';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r + 8);
    ctx.lineTo(cx - 10, cy - r - 12);
    ctx.lineTo(cx + 10, cy - r - 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  render(rotationDeg);
  canvas.updateRotation = render;
  return canvas;
}

export function triggerConfettiBurst() {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  while (layer.firstChild) layer.removeChild(layer.firstChild);

  const canvas = document.createElement('canvas');
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  layer.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const palette = ['#563AE4', '#FF5A5F', '#F59E0B', '#0E9F6E', '#38BDF8', '#A855F7'];
  const particles = Array.from({ length: 48 }, (_, i) => ({
    x: Math.random() * w,
    y: -20 - Math.random() * 60,
    vy: 220 + Math.random() * 260,
    vx: (Math.random() - 0.5) * 90,
    size: 8 + Math.random() * 8,
    phase: Math.random() * 6.28,
    color: palette[i % palette.length]
  }));

  const start = performance.now();
  const duration = 2000;

  const tick = (now) => {
    const elapsed = now - start;
    if (elapsed >= duration || !canvas.isConnected) {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      return;
    }
    const t = elapsed / 1000;
    const alpha = Math.max(0, 1 - Math.max(0, (elapsed / duration) - 0.65) / 0.35);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = alpha;
    for (const p of particles) {
      const y = p.y + p.vy * t;
      const x = p.x + p.vx * t + Math.sin(t * 6 + p.phase) * 16;
      const hScale = 0.4 + 0.6 * Math.abs(Math.cos(t * 7 + p.phase));
      ctx.fillStyle = p.color;
      ctx.fillRect(x, y, p.size, p.size * hScale);
    }
    ctx.restore();
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
