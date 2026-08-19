export interface Vec {
  x: number;
  y: number;
}

export type Dir = "up" | "down" | "left" | "right";

export type Status = "menu" | "playing" | "paused" | "over";

export type DifficultyId = "facile" | "normal" | "difficile";

export interface Difficulty {
  id: DifficultyId;
  label: string;
  baseInterval: number;
  minInterval: number;
  mult: number;
  desc: string;
}

export const GRID = 20;
export const CELL = 26;
export const BOARD_PX = GRID * CELL;

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "facile",
    label: "Facile",
    baseInterval: 170,
    minInterval: 110,
    mult: 1,
    desc: "Balade digestive",
  },
  {
    id: "normal",
    label: "Normal",
    baseInterval: 128,
    minInterval: 78,
    mult: 2,
    desc: "Le juste milieu",
  },
  {
    id: "difficile",
    label: "Difficile",
    baseInterval: 95,
    minInterval: 55,
    mult: 3,
    desc: "Pour les pros",
  },
];

export const DIFF_COLORS: Record<DifficultyId, string> = {
  facile: "#4fc57f",
  normal: "#f2b23c",
  difficile: "#e8503f",
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
}

export interface GameState {
  snake: Vec[];
  prevSnake: Vec[];
  dir: Dir;
  queue: Dir[];
  food: Vec;
  foodBornAt: number;
  status: Status;
  score: number;
  foods: number;
  interval: number;
  acc: number;
  particles: Particle[];
  floats: FloatText[];
  shake: number;
  flash: number;
}

export interface StepEvents {
  ate: boolean;
  died: boolean;
  points: number;
}

export interface RecordEntry {
  id: string;
  score: number;
  difficulty: DifficultyId;
  date: number;
}

export const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const DELTA: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
