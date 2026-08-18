import { BOARD_PX, CELL, DELTA, GRID, type GameState } from "./types";

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const HEAD_RGB: [number, number, number] = [16, 110, 58];
const TAIL_RGB: [number, number, number] = [148, 214, 164];

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  dt: number,
  now: number,
) {
  ctx.clearRect(0, 0, BOARD_PX, BOARD_PX);
  ctx.save();

  // screen shake
  if (s.shake > 0.3) {
    const m = s.shake;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    s.shake *= Math.pow(0.88, dt / 16.7);
  } else {
    s.shake = 0;
  }

  // ---- light checkerboard ----
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#eef6e6" : "#e0eed4";
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  // soft inner vignette so the board feels lit from the center
  const vg = ctx.createRadialGradient(
    BOARD_PX / 2, BOARD_PX / 2, BOARD_PX * 0.25,
    BOARD_PX / 2, BOARD_PX / 2, BOARD_PX * 0.78,
  );
  vg.addColorStop(0, "rgba(255,255,255,0)");
  vg.addColorStop(1, "rgba(84,120,80,0.14)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

  const t = s.status === "playing" ? Math.min(1, s.acc / s.interval) : 1;

  // ---- apple ----
  if (s.food.x >= 0) {
    const fx = s.food.x * CELL + CELL / 2;
    const fy = s.food.y * CELL + CELL / 2;
    const age = Math.min(1, (now - s.foodBornAt) / 260);
    const pop = s.foodBornAt === 0 ? 1 : easeOutBack(age);
    const pulse = 1 + Math.sin(now / 210) * 0.05;
    const r = CELL * 0.32 * pop * pulse;

    // shadow
    ctx.fillStyle = "rgba(60,90,55,0.22)";
    ctx.beginPath();
    ctx.ellipse(fx, fy + CELL * 0.30, r * 0.85, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // body
    const g = ctx.createRadialGradient(fx - r * 0.4, fy - r * 0.45, r * 0.15, fx, fy, r * 1.15);
    g.addColorStop(0, "#ff9a7e");
    g.addColorStop(0.45, "#e8503f");
    g.addColorStop(1, "#b93325");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();

    // stem + leaf
    ctx.strokeStyle = "#6b4a26";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy - r * 0.85);
    ctx.quadraticCurveTo(fx + 1, fy - r * 1.25, fx + 3, fy - r * 1.35);
    ctx.stroke();
    ctx.fillStyle = "#3e9d4e";
    ctx.save();
    ctx.translate(fx + r * 0.42, fy - r * 1.12);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // shine
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(fx - r * 0.35, fy - r * 0.38, r * 0.22, r * 0.14, -0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- snake (tail first so the head overlaps) ----
  const n = s.snake.length;
  for (let i = n - 1; i >= 0; i--) {
    const curr = s.snake[i];
    const prev = s.prevSnake[i] ?? curr;
    const px = (prev.x + (curr.x - prev.x) * t) * CELL;
    const py = (prev.y + (curr.y - prev.y) * t) * CELL;
    const isHead = i === 0;
    const pad = isHead ? CELL * 0.06 : CELL * 0.13 + (i / n) * CELL * 0.06;
    const color = isHead ? "#0e6e3a" : lerpColor(HEAD_RGB, TAIL_RGB, i / Math.max(1, n - 1));

    ctx.fillStyle = color;
    rr(ctx, px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, isHead ? CELL * 0.34 : CELL * 0.28);
    ctx.fill();

    // subtle outline for definition on the light board
    ctx.strokeStyle = "rgba(10,50,28,0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (isHead) {
      // belly highlight
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      rr(ctx, px + CELL * 0.22, py + CELL * 0.16, CELL * 0.56, CELL * 0.3, CELL * 0.15);
      ctx.fill();

      // eyes oriented along the direction
      const d = DELTA[s.dir];
      const cx = px + CELL / 2;
      const cy = py + CELL / 2;
      const fx = d.x;
      const fy = d.y;
      const sx = -fy;
      const sy = fx;
      const eyeOff = CELL * 0.17;
      const fwd = CELL * 0.13;
      const blink = now % 3400 < 110 ? 0.18 : 1;

      for (const side of [-1, 1]) {
        const ex = cx + fx * fwd + sx * eyeOff * side;
        const ey = cy + fy * fwd + sy * eyeOff * side;
        ctx.fillStyle = "#f6fbf2";
        ctx.beginPath();
        ctx.ellipse(ex, ey, CELL * 0.105, CELL * 0.105 * blink, 0, 0, Math.PI * 2);
        ctx.fill();
        if (blink === 1) {
          ctx.fillStyle = "#12291a";
          ctx.beginPath();
          ctx.arc(ex + fx * CELL * 0.04, ey + fy * CELL * 0.04, CELL * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // tongue flick
      if (s.status === "playing" && now % 1500 < 160) {
        ctx.strokeStyle = "#e8503f";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        const tx = cx + fx * CELL * 0.46;
        const ty = cy + fy * CELL * 0.46;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + fx * CELL * 0.22, ty + fy * CELL * 0.22);
        ctx.stroke();
      }
    }
  }

  // ---- particles ----
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const p = s.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      s.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.0011 * dt;
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // ---- floating score texts ----
  ctx.textAlign = "center";
  ctx.font = `13px "Press Start 2P", monospace`;
  for (let i = s.floats.length - 1; i >= 0; i--) {
    const f = s.floats[i];
    f.life -= dt;
    if (f.life <= 0) {
      s.floats.splice(i, 1);
      continue;
    }
    f.y -= dt * 0.045;
    const a = Math.max(0, Math.min(1, f.life / (f.maxLife * 0.6)));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#7a4d08";
    ctx.fillText(f.text, f.x + 1.5, f.y + 1.5);
    ctx.fillStyle = "#f2b23c";
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  // ---- eat flash ----
  if (s.flash > 0.01) {
    ctx.fillStyle = `rgba(120,220,140,${s.flash * 0.14})`;
    ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);
    s.flash *= Math.pow(0.86, dt / 16.7);
  }

  // ---- death tint ----
  if (s.status === "over") {
    const dg = ctx.createRadialGradient(
      BOARD_PX / 2, BOARD_PX / 2, BOARD_PX * 0.2,
      BOARD_PX / 2, BOARD_PX / 2, BOARD_PX * 0.85,
    );
    dg.addColorStop(0, "rgba(185,51,37,0)");
    dg.addColorStop(1, "rgba(150,32,20,0.28)");
    ctx.fillStyle = dg;
    ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);
  }

  ctx.restore();
}

export function spawnEatBurst(s: GameState, cellX: number, cellY: number) {
  const cx = cellX * CELL + CELL / 2;
  const cy = cellY * CELL + CELL / 2;
  const colors = ["#f2b23c", "#e8503f", "#4fc57f", "#fff6dd", "#ff8a70"];
  for (let i = 0; i < 16; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 0.05 + Math.random() * 0.14;
    s.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 0.06,
      life: 420 + Math.random() * 380,
      maxLife: 800,
      size: 3 + Math.random() * 3.5,
      color: colors[i % colors.length],
    });
  }
}

export function pushFloat(s: GameState, text: string) {
  const head = s.snake[0];
  s.floats.push({
    x: head.x * CELL + CELL / 2,
    y: head.y * CELL - 4,
    text,
    life: 950,
    maxLife: 950,
  });
}
