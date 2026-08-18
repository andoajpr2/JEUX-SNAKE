let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem("serpent.muted") === "1";
} catch {
  muted = false;
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  delay = 0,
  slideTo?: number,
) {
  if (muted) return;
  const ac = ensure();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  isMuted: () => muted,
  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem("serpent.muted", m ? "1" : "0");
    } catch {
      /* ignore */
    }
  },
  eat() {
    tone(520, 0.09, "square", 0.055);
    tone(780, 0.1, "square", 0.05, 0.055);
  },
  bigEat() {
    tone(520, 0.08, "square", 0.055);
    tone(690, 0.08, "square", 0.05, 0.06);
    tone(920, 0.12, "square", 0.05, 0.12);
  },
  turn() {
    tone(240, 0.03, "triangle", 0.025);
  },
  die() {
    tone(300, 0.32, "sawtooth", 0.06, 0, 70);
    tone(180, 0.4, "square", 0.045, 0.08, 50);
  },
  start() {
    tone(440, 0.09, "square", 0.05);
    tone(660, 0.1, "square", 0.05, 0.09);
    tone(880, 0.14, "square", 0.05, 0.18);
  },
  pause() {
    tone(500, 0.07, "triangle", 0.045);
    tone(360, 0.09, "triangle", 0.045, 0.07);
  },
  resume() {
    tone(360, 0.07, "triangle", 0.045);
    tone(520, 0.09, "triangle", 0.045, 0.07);
  },
  record() {
    tone(587, 0.1, "square", 0.05);
    tone(740, 0.1, "square", 0.05, 0.1);
    tone(880, 0.12, "square", 0.05, 0.2);
    tone(1175, 0.2, "square", 0.055, 0.3);
  },
  click() {
    tone(300, 0.04, "triangle", 0.035);
  },
};
