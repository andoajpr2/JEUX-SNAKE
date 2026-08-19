import type { ReactNode } from "react";
import { DIFFICULTIES, DIFF_COLORS, type Difficulty, type DifficultyId, type Status } from "../game/types";
import { AppleMark, IconCrown, IconHome, IconPause, IconPlay, IconRestart, SnakeLogo } from "./icons";

interface OverlayProps {
  status: Status;
  score: number;
  best: number;
  foods: number;
  isNewRecord: boolean;
  difficulty: Difficulty;
  onDifficulty: (id: DifficultyId) => void;
  onPlay: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

function Shell({ children, dim = true }: { children: ReactNode; dim?: boolean }) {
  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center overflow-y-auto rounded-[0.6rem] p-3 ${
        dim ? "bg-pine-950/75" : "bg-pine-950/60"
      }`}
    >
      {children}
    </div>
  );
}

function Card({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`anim-card-pop w-full ${wide ? "max-w-sm" : "max-w-xs"} rounded-xl border-[3px] border-pine-950 bg-gradient-to-b from-mint-50 to-mint-200 px-5 py-5 text-pine-900 shadow-[8px_8px_0_rgba(4,16,10,0.75)] sm:px-7 sm:py-6`}
    >
      {children}
    </div>
  );
}

function DifficultyPicker({ value, onChange }: { value: DifficultyId; onChange: (id: DifficultyId) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Difficulté">
      {DIFFICULTIES.map((d) => {
        const active = d.id === value;
        return (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(d.id)}
            className={`rounded-lg border-2 px-1 py-2 text-center transition-all duration-150 ${
              active
                ? "-translate-y-0.5 border-pine-950 bg-pine-800 text-mint-50 shadow-[0_4px_0_#071b12]"
                : "border-pine-300/70 bg-mint-100 text-pine-700 hover:border-pine-500 hover:bg-mint-50"
            }`}
          >
            <span className="flex items-center justify-center gap-1 font-arcade text-[0.5rem] sm:text-[0.55rem]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: DIFF_COLORS[d.id] }} />
              {d.label}
            </span>
            <span className={`mt-1 block text-[0.65rem] leading-tight ${active ? "text-pine-300" : "text-pine-600/70"}`}>
              {d.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Overlays(props: OverlayProps) {
  const { status } = props;
  if (status === "playing") return null;

  if (status === "menu") {
    return (
      <Shell dim={false}>
        <Card wide>
          <div className="flex items-center gap-3">
            <SnakeLogo className="anim-wiggle h-12 w-12 shrink-0" />
            <div>
              <h2 className="font-arcade text-xl leading-none text-pine-800 sm:text-2xl">SERPENT</h2>
              <p className="mt-1.5 text-xs font-semibold italic text-pine-600">
                Mangez. Grandissez. Ne vous mordez pas.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="font-arcade text-[0.58rem] uppercase tracking-[0.18em] text-pine-600">Difficulté</p>
            <div className="mt-2">
              <DifficultyPicker value={props.difficulty.id} onChange={props.onDifficulty} />
            </div>
          </div>

          <button
            type="button"
            onClick={props.onPlay}
            className="btn-retro btn-primary mt-5 w-full px-6 py-3.5 text-xs sm:text-sm"
          >
            <IconPlay className="h-4 w-4" /> Jouer
          </button>

          <div className="mt-4 space-y-1.5 text-[0.72rem] font-medium text-pine-700">
            <p className="flex items-center gap-2">
              <span className="kbd">↑↓←→</span>
              <span className="kbd">ZQSD</span>
              <span>diriger le serpent</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="kbd">Espace</span>
              <span>pause</span>
              <span className="kbd">Entrée</span>
              <span>jouer</span>
            </p>
            <p className="flex items-center gap-2 text-pine-600/80">
              <AppleMark className="h-4 w-4 shrink-0" />
              Sur mobile : glissez sur le plateau ou utilisez la croix.
            </p>
          </div>
        </Card>
      </Shell>
    );
  }

  if (status === "paused") {
    return (
      <Shell>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-pine-950 bg-amber-glow text-[#26190a]">
              <IconPause className="h-5 w-5" />
            </span>
            <h2 className="anim-breathe font-arcade text-lg text-pine-800">PAUSE</h2>
          </div>
          <p className="mt-3 text-xs font-semibold text-pine-600">
            Le serpent reprend son souffle… Score actuel : <span className="font-arcade text-[0.65rem] text-pine-800">{props.score}</span>
          </p>
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={props.onResume} className="btn-retro btn-primary px-5 py-3 text-[0.65rem]">
              <IconPlay className="h-3.5 w-3.5" /> Reprendre
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={props.onRestart} className="btn-retro btn-green px-3 py-2.5 text-[0.55rem]">
                <IconRestart className="h-3.5 w-3.5" /> Relancer
              </button>
              <button type="button" onClick={props.onMenu} className="btn-retro btn-leaf px-3 py-2.5 text-[0.55rem]">
                <IconHome className="h-3.5 w-3.5" /> Menu
              </button>
            </div>
          </div>
        </Card>
      </Shell>
    );
  }

  // game over
  return (
    <Shell>
      <Card>
        <p className="font-arcade text-[0.6rem] tracking-widest text-coral-deep">PARTIE TERMINÉE</p>
        <h2 className="mt-1 font-arcade text-3xl text-pine-800 sm:text-4xl">{props.score}</h2>
        <p className="mt-1 text-[0.7rem] font-semibold text-pine-600">
          {props.foods} pomme{props.foods > 1 ? "s" : ""} dévorée{props.foods > 1 ? "s" : ""} · {props.difficulty.label}
        </p>

        {props.isNewRecord ? (
          <div className="anim-breathe mt-3 flex items-center justify-center gap-2 rounded-lg border-2 border-amber-deep bg-gradient-to-b from-[#ffe1a0] to-amber-glow px-3 py-2 text-[#3d2a05]">
            <IconCrown className="h-5 w-5" />
            <span className="font-arcade text-[0.6rem]">NOUVEAU RECORD !</span>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border-2 border-pine-300/70 bg-mint-100 px-3 py-2 text-center text-[0.7rem] font-bold text-pine-700">
            Record ({props.difficulty.label}) : <span className="font-arcade text-[0.6rem]">{props.best}</span>
          </p>
        )}

        <div className="mt-4 grid gap-2">
          <button type="button" onClick={props.onRestart} className="btn-retro btn-primary px-5 py-3 text-[0.65rem]">
            <IconRestart className="h-3.5 w-3.5" /> Rejouer
          </button>
          <button type="button" onClick={props.onMenu} className="btn-retro btn-leaf px-5 py-2.5 text-[0.6rem]">
            <IconHome className="h-3.5 w-3.5" /> Menu
          </button>
        </div>
        <p className="mt-3 text-center text-[0.65rem] font-medium text-pine-600/80">
          <span className="kbd">Entrée</span> pour repartir aussitôt
        </p>
      </Card>
    </Shell>
  );
}
