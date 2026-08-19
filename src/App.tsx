import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dpad from "./components/Dpad";
import Overlays from "./components/Overlays";
import {
  AppleMark,
  IconCrown,
  IconPause,
  IconPlay,
  IconRestart,
  IconSoundOff,
  IconSoundOn,
  IconTrophy,
  SnakeLogo,
} from "./components/icons";
import { createGame, queueDirection, stepGame } from "./game/engine";
import { drawFrame, pushFloat, spawnEatBurst } from "./game/render";
import { sfx } from "./game/sound";
import { bestFor, loadDifficulty, loadRecords, saveDifficulty, saveScore } from "./game/storage";
import {
  BOARD_PX,
  DIFFICULTIES,
  DIFF_COLORS,
  OPPOSITE,
  type Difficulty,
  type DifficultyId,
  type Dir,
  type GameState,
  type RecordEntry,
  type Status,
} from "./game/types";

interface UiState {
  status: Status;
  score: number;
  foods: number;
  length: number;
  level: number;
  records: RecordEntry[];
  best: number;
  isNewRecord: boolean;
  lastRecordId: string | null;
}

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
const CODE_DIRS: Record<string, Dir> = {
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};
const CHAR_DIRS: Record<string, Dir> = {
  z: "up",
  w: "up",
  s: "down",
  q: "left",
  a: "left",
  d: "right",
};

function Fireflies() {
  const flies = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          left: `${4 + r(1) * 92}%`,
          top: `${6 + r(2) * 88}%`,
          size: 2 + r(3) * 3.5,
          dur: 7 + r(4) * 9,
          delay: -r(5) * 12,
          dx: (r(6) - 0.5) * 90,
          dy: (r(7) - 0.5) * 90,
          o: 0.25 + r(8) * 0.5,
          amber: r(9) > 0.55,
        };
      }),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {flies.map((f, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            backgroundColor: f.amber ? "#f2b23c" : "#8fdcae",
            boxShadow: `0 0 ${f.size * 3.2}px ${f.amber ? "rgba(242,178,60,0.8)" : "rgba(143,220,174,0.8)"}`,
            animation: `firefly-drift ${f.dur}s ease-in-out ${f.delay}s infinite`,
            ["--ff-x" as string]: `${f.dx}px`,
            ["--ff-y" as string]: `${f.dy}px`,
            ["--ff-o" as string]: f.o,
          }}
        />
      ))}
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="panel flex flex-col items-center px-2 py-2">
      <span className="panel-title">{label}</span>
      <span className={`mt-1 font-arcade text-[0.7rem] ${accent ? "text-amber-glow" : "text-mint-50"}`}>{value}</span>
    </div>
  );
}

export default function App() {
  const diffDefault = loadDifficulty() ?? "normal";
  const [difficulty, setDifficulty] = useState<Difficulty>(() => DIFFICULTIES.find((d) => d.id === diffDefault)!);
  const [muted, setMuted] = useState(sfx.isMuted());
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [coarse, setCoarse] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [ui, setUi] = useState<UiState>(() => {
    const records = loadRecords();
    return {
      status: "menu",
      score: 0,
      foods: 0,
      length: 3,
      level: 1,
      records,
      best: bestFor(records, diffDefault),
      isNewRecord: false,
      lastRecordId: null,
    };
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState>(createGame(difficulty));
  const diffRef = useRef(difficulty);
  const bestRef = useRef(ui.best);
  const recordToastedRef = useRef(false);
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);

  diffRef.current = difficulty;
  bestRef.current = ui.best;

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const syncUi = useCallback((g: GameState, extra?: Partial<UiState>) => {
    setUi((prev) => ({
      ...prev,
      status: g.status,
      score: g.score,
      foods: g.foods,
      length: g.snake.length,
      level: 1 + Math.floor(g.foods / 5),
      ...extra,
    }));
  }, []);

  const showToast = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
  }, []);

  // ---------- actions ----------
  const startGame = useCallback(() => {
    const g = createGame(diffRef.current, "playing");
    gameRef.current = g;
    recordToastedRef.current = false;
    sfx.start();
    syncUi(g, { isNewRecord: false });
  }, [syncUi]);

  const gotoMenu = useCallback(() => {
    const g = createGame(diffRef.current, "menu");
    gameRef.current = g;
    sfx.click();
    syncUi(g, { isNewRecord: false });
  }, [syncUi]);

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (g.status === "playing") {
      g.status = "paused";
      sfx.pause();
      syncUi(g);
    } else if (g.status === "paused") {
      g.status = "playing";
      sfx.resume();
      syncUi(g);
    } else if (g.status === "menu") {
      startGame();
    } else if (g.status === "over") {
      startGame();
    }
  }, [syncUi, startGame]);

  const steer = useCallback((dir: Dir) => {
    const g = gameRef.current;
    if (g.status !== "playing") return;
    if (queueDirection(g, dir)) sfx.turn();
  }, []);

  const handleDpadPause = useCallback(() => {
    const s = gameRef.current.status;
    if (s === "menu" || s === "over") startGame();
    else togglePause();
  }, [startGame, togglePause]);

  const changeDifficulty = useCallback(
    (id: DifficultyId) => {
      const d = DIFFICULTIES.find((x) => x.id === id)!;
      setDifficulty(d);
      saveDifficulty(id);
      sfx.click();
      const g = createGame(d, "menu");
      gameRef.current = g;
      setUi((prev) => ({
        ...prev,
        status: g.status,
        score: 0,
        foods: 0,
        length: 3,
        level: 1,
        best: bestFor(prev.records, id),
        isNewRecord: false,
      }));
    },
    [],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      sfx.setMuted(!m);
      if (m) sfx.click();
      return !m;
    });
  }, []);

  // keep actions reachable from stable listeners
  const actionsRef = useRef({ startGame, togglePause, steer, gotoMenu, toggleMute, changeDifficulty });
  actionsRef.current = { startGame, togglePause, steer, gotoMenu, toggleMute, changeDifficulty };

  // ---------- game loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = BOARD_PX * dpr;
    canvas.height = BOARD_PX * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const g = gameRef.current;
      const diff = diffRef.current;

      if (g.status === "playing") {
        g.acc += dt;
        let guard = 0;
        while (g.acc >= g.interval && g.status === "playing" && guard < 4) {
          g.acc -= g.interval;
          guard++;
          const ev = stepGame(g, diff, now);

          if (ev.ate) {
            spawnEatBurst(g, g.snake[0].x, g.snake[0].y);
            pushFloat(g, `+${ev.points}`);
            if (g.foods % 5 === 0) sfx.bigEat();
            else sfx.eat();

            if (!recordToastedRef.current && g.score > bestRef.current && bestRef.current > 0) {
              recordToastedRef.current = true;
              showToast("Record battu !");
              sfx.record();
            } else if (bestRef.current === 0 && !recordToastedRef.current && g.score > 0) {
              recordToastedRef.current = true;
              showToast("Premier record en vue…");
            }
            syncUi(g);
          }

          if (ev.died) {
            sfx.die();
            if (g.score > 0) {
              const { records, entry } = saveScore(g.score, diff.id);
              const best = bestFor(records, diff.id);
              const isNew = entry.score >= best;
              syncUi(g, { records, best, isNewRecord: isNew, lastRecordId: entry.id });
              if (isNew) setTimeout(() => sfx.record(), 350);
            } else {
              syncUi(g, { isNewRecord: false, lastRecordId: null });
            }
          }
        }
      }

      drawFrame(ctx, g, dt, now);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [syncUi, showToast]);

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = actionsRef.current;
      const k = e.key;

      const dir =
        KEY_DIRS[k] ??
        CODE_DIRS[e.code] ??
        CHAR_DIRS[k.length === 1 ? k.toLowerCase() : ""] ??
        null;

      if (dir) {
        e.preventDefault();
        a.steer(dir);
        return;
      }
      if (k === " " || k === "Spacebar") {
        e.preventDefault();
        const s = gameRef.current.status;
        if (s === "menu" || s === "over") a.startGame();
        else a.togglePause();
        return;
      }
      if (k === "Enter") {
        e.preventDefault();
        const s = gameRef.current.status;
        if (s === "menu" || s === "over" || s === "paused") a.startGame();
        return;
      }
      if (k === "r" || k === "R") {
        if (gameRef.current.status !== "menu") a.startGame();
        return;
      }
      if (k === "Escape") {
        const s = gameRef.current.status;
        if (s === "over") a.gotoMenu();
        else if (s === "playing" || s === "paused") a.togglePause();
        return;
      }
      if (k === "m" || k === "M") {
        a.toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // auto-pause when the window loses focus
  useEffect(() => {
    const onBlur = () => {
      const g = gameRef.current;
      if (g.status === "playing") {
        g.status = "paused";
        syncUi(g);
      }
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [syncUi]);

  // ---------- swipe on the board ----------
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    swipeRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, []);
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const s = swipeRef.current;
      swipeRef.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (Math.max(adx, ady) < 22) return;
      const g = gameRef.current;
      const dir: Dir = adx > ady ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      if (g.status === "playing") {
        // reject instant 180° against current travel direction
        if (dir !== OPPOSITE[g.dir] || g.snake.length > 1) {
          actionsRef.current.steer(dir);
        }
      }
    },
    [],
  );

  const level = ui.level;
  const diffColor = DIFF_COLORS[difficulty.id];

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="relative min-h-screen font-body">
      <Fireflies />

      {/* ---------- header ---------- */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pb-4 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <SnakeLogo className="anim-wiggle h-11 w-11 sm:h-12 sm:w-12" />
          <div>
            <h1 className="font-arcade text-base leading-none text-mint-50 sm:text-xl">
              SERPENT<span className="anim-blink text-amber-glow">_</span>
            </h1>
            <p className="mt-1.5 hidden text-xs font-semibold italic text-pine-300 sm:block">
              Le classique de 1976, remis au goût du jour
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-lg border border-pine-600/60 bg-pine-800/60 px-3 py-2 font-arcade text-[0.55rem] text-mint-100 sm:flex">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: diffColor }} />
            {difficulty.label}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Activer le son" : "Couper le son"}
            title={muted ? "Activer le son (M)" : "Couper le son (M)"}
            className="btn-retro btn-ghost h-10 w-10"
          >
            {muted ? <IconSoundOff className="h-4.5 w-4.5" /> : <IconSoundOn className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      {/* ---------- main ---------- */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* left column */}
        <section className="min-w-0">
          {/* mobile HUD strip */}
          <div className="mb-3 grid grid-cols-3 gap-2 lg:hidden">
            <StatChip label="Score" value={ui.score} accent />
            <StatChip label="Record" value={ui.best} />
            <StatChip label="Longueur" value={ui.length} />
          </div>

          {/* board */}
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="board-frame">
              <div className="relative touch-none select-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
                <canvas ref={canvasRef} className="block aspect-square w-full" aria-label="Plateau de jeu du serpent" />
                <Overlays
                  status={ui.status}
                  score={ui.score}
                  best={ui.best}
                  foods={ui.foods}
                  isNewRecord={ui.isNewRecord}
                  difficulty={difficulty}
                  onDifficulty={changeDifficulty}
                  onPlay={startGame}
                  onResume={togglePause}
                  onRestart={startGame}
                  onMenu={gotoMenu}
                />
              </div>
            </div>

            {toast && (
              <div
                key={toast.id}
                className="anim-toast absolute left-1/2 top-4 z-30 flex items-center gap-2 rounded-lg border-2 border-[#8a5c12] bg-gradient-to-b from-[#ffd166] to-amber-glow px-4 py-2 font-arcade text-[0.6rem] text-[#3d2a05] shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
              >
                <IconCrown className="h-4 w-4" />
                {toast.text}
              </div>
            )}
          </div>

          {/* control bar */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-pine-600/60 bg-pine-800/60 p-1" role="radiogroup" aria-label="Difficulté">
              {DIFFICULTIES.map((d) => {
                const active = d.id === difficulty.id;
                const locked = ui.status === "playing";
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={locked}
                    title={locked ? "Disponible hors partie" : d.desc}
                    onClick={() => changeDifficulty(d.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-arcade text-[0.5rem] transition-all duration-150 sm:px-3 sm:text-[0.55rem] ${
                      active
                        ? "bg-gradient-to-b from-pine-500 to-pine-600 text-mint-50 shadow-[0_3px_0_#071b12]"
                        : "text-pine-300 hover:bg-pine-700/70 hover:text-mint-100"
                    } ${locked ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DIFF_COLORS[d.id] }} />
                    {d.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={togglePause}
              disabled={ui.status === "menu" || ui.status === "over"}
              className={`btn-retro px-4 py-2.5 text-[0.55rem] sm:text-[0.6rem] ${
                ui.status === "paused" ? "btn-primary" : "btn-green"
              } disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50`}
            >
              {ui.status === "paused" ? <IconPlay className="h-3.5 w-3.5" /> : <IconPause className="h-3.5 w-3.5" />}
              {ui.status === "paused" ? "Reprendre" : "Pause"}
            </button>

            <button
              type="button"
              onClick={startGame}
              disabled={ui.status === "menu"}
              className="btn-retro btn-ghost px-4 py-2.5 text-[0.55rem] disabled:cursor-not-allowed disabled:opacity-40 sm:text-[0.6rem]"
            >
              <IconRestart className="h-3.5 w-3.5" />
              Relancer
            </button>

            <span className="flex items-center gap-2 rounded-xl border border-pine-600/60 bg-pine-800/60 px-3 py-2.5">
              <AppleMark className="h-4 w-4" />
              <span className="font-arcade text-[0.55rem] text-mint-100">
                VIT. <span className="text-amber-glow">{level}</span>
              </span>
            </span>
          </div>

          {/* touch D-pad */}
          {coarse && (
            <div className="anim-rise mt-5">
              <Dpad onDir={steer} onPause={handleDpadPause} paused={ui.status !== "playing"} />
            </div>
          )}
        </section>

        {/* ---------- sidebar ---------- */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-5">
          <div className="panel px-5 py-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="panel-title">Score</p>
                <p key={ui.score} className="anim-score mt-2 font-arcade text-3xl leading-none text-amber-glow">
                  {ui.score}
                </p>
              </div>
              <AppleMark className="anim-breathe h-9 w-9" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-pine-600/40 pt-4">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-pine-300">Record</p>
                <p className="mt-1 font-arcade text-[0.7rem] text-mint-50">{ui.best}</p>
              </div>
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-pine-300">Longueur</p>
                <p className="mt-1 font-arcade text-[0.7rem] text-mint-50">{ui.length}</p>
              </div>
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider text-pine-300">Vitesse</p>
                <p className="mt-1 font-arcade text-[0.7rem] text-mint-50">Nv. {level}</p>
              </div>
            </div>
          </div>

          <div className="panel px-5 py-4">
            <p className="panel-title flex items-center gap-2">
              <IconTrophy className="h-4 w-4 text-amber-glow" /> Meilleurs scores
            </p>
            {ui.records.length === 0 ? (
              <p className="mt-3 text-xs font-medium italic text-pine-300">
                Aucun record pour l'instant — la piste est vierge, à vous de la mordre.
              </p>
            ) : (
              <ol className="mt-3 space-y-1.5">
                {ui.records.map((r, i) => (
                  <li
                    key={r.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                      r.id === ui.lastRecordId
                        ? "border-amber-glow/70 bg-amber-glow/10"
                        : "border-pine-600/40 bg-pine-800/40"
                    }`}
                  >
                    <span className={`font-arcade text-[0.6rem] ${i === 0 ? "text-amber-glow" : "text-pine-300"}`}>
                      {i + 1}
                    </span>
                    <span className="font-arcade text-[0.7rem] text-mint-50">{r.score}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-[0.65rem] font-bold" style={{ color: DIFF_COLORS[r.difficulty] }}>
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DIFF_COLORS[r.difficulty] }} />
                      {DIFFICULTIES.find((d) => d.id === r.difficulty)?.label}
                    </span>
                    <span className="hidden text-[0.62rem] font-medium text-pine-300 sm:block">{fmtDate(r.date)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="panel hidden px-5 py-4 lg:block">
            <p className="panel-title">Commandes</p>
            <ul className="mt-3 space-y-2 text-[0.72rem] font-medium text-mint-100">
              <li className="flex items-center gap-2">
                <span className="kbd">↑↓←→</span>
                <span className="kbd">ZQSD</span>
                <span className="text-pine-300">diriger</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="kbd">Espace</span>
                <span className="text-pine-300">pause / jouer</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="kbd">R</span>
                <span className="text-pine-300">relancer</span>
                <span className="kbd">M</span>
                <span className="text-pine-300">son</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="kbd">Échap</span>
                <span className="text-pine-300">pause / menu</span>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
        <p className="border-t border-pine-600/30 pt-4 text-center text-[0.68rem] font-medium text-pine-300/80">
          Un serpent, des pommes, un record à battre — vos scores sont conservés sur cet appareil.
        </p>
      </footer>
    </div>
  );
}
