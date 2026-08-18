import type { Dir } from "../game/types";
import { IconChevron, IconPause, IconPlay } from "./icons";

interface DpadProps {
  onDir: (d: Dir) => void;
  onPause: () => void;
  paused: boolean;
}

function padBtn(dir: Dir, onDir: (d: Dir) => void, label: string) {
  return (
    <button
      type="button"
      aria-label={label}
      className="dpad-btn flex h-16 items-center justify-center rounded-xl border-2 border-pine-950/80 bg-gradient-to-b from-pine-600 to-pine-700 text-mint-100 shadow-[0_5px_0_#071b12] active:shadow-none sm:h-[70px]"
      onPointerDown={(e) => {
        e.preventDefault();
        onDir(dir);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <IconChevron dir={dir} className="h-7 w-7" />
    </button>
  );
}

export default function Dpad({ onDir, onPause, paused }: DpadProps) {
  return (
    <div className="no-select mx-auto grid w-full max-w-[280px] grid-cols-3 gap-2" aria-label="Contrôles tactiles">
      <div />
      {padBtn("up", onDir, "Haut")}
      <div />
      {padBtn("left", onDir, "Gauche")}
      <button
        type="button"
        aria-label={paused ? "Reprendre" : "Pause"}
        className="dpad-btn flex h-16 items-center justify-center rounded-xl border-2 border-pine-950/80 bg-gradient-to-b from-amber-glow to-amber-deep text-[#26190a] shadow-[0_5px_0_#6e4a0d] active:shadow-none sm:h-[70px]"
        onPointerDown={(e) => {
          e.preventDefault();
          onPause();
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {paused ? <IconPlay className="h-6 w-6" /> : <IconPause className="h-6 w-6" />}
      </button>
      {padBtn("right", onDir, "Droite")}
      <div />
      {padBtn("down", onDir, "Bas")}
      <div />
    </div>
  );
}
