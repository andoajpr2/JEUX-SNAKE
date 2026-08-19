import {
  DELTA,
  GRID,
  OPPOSITE,
  type Difficulty,
  type Dir,
  type GameState,
  type StepEvents,
  type Vec,
} from "./types";

function randomFreeCell(snake: Vec[]): Vec {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free: Vec[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: -1, y: -1 };
  return free[Math.floor(Math.random() * free.length)];
}

export function createGame(diff: Difficulty, status: GameState["status"] = "menu"): GameState {
  const cy = Math.floor(GRID / 2);
  const snake: Vec[] = [
    { x: 8, y: cy },
    { x: 7, y: cy },
    { x: 6, y: cy },
  ];
  return {
    snake,
    prevSnake: snake.map((c) => ({ ...c })),
    dir: "right",
    queue: [],
    food: randomFreeCell(snake),
    foodBornAt: 0,
    status,
    score: 0,
    foods: 0,
    interval: diff.baseInterval,
    acc: 0,
    particles: [],
    floats: [],
    shake: 0,
    flash: 0,
  };
}

export function queueDirection(state: GameState, dir: Dir): boolean {
  const last = state.queue.length > 0 ? state.queue[state.queue.length - 1] : state.dir;
  if (dir === last || dir === OPPOSITE[last]) return false;
  if (state.queue.length >= 2) return false;
  state.queue.push(dir);
  return true;
}

export function stepGame(state: GameState, diff: Difficulty, now: number): StepEvents {
  const events: StepEvents = { ate: false, died: false, points: 0 };

  if (state.queue.length > 0) state.dir = state.queue.shift() as Dir;

  const d = DELTA[state.dir];
  const head = state.snake[0];
  const next: Vec = { x: head.x + d.x, y: head.y + d.y };

  // wall collision
  if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID) {
    state.status = "over";
    state.shake = 14;
    events.died = true;
    return events;
  }

  const eating = next.x === state.food.x && next.y === state.food.y;

  // self collision — the tail cell frees up unless we are growing
  const limit = eating ? state.snake.length : state.snake.length - 1;
  for (let i = 0; i < limit; i++) {
    if (state.snake[i].x === next.x && state.snake[i].y === next.y) {
      state.status = "over";
      state.shake = 14;
      events.died = true;
      return events;
    }
  }

  // keep previous positions for interpolation
  state.prevSnake = state.snake.map((c) => ({ ...c }));

  state.snake.unshift(next);
  if (!eating) {
    state.snake.pop();
  } else {
    // pad prevSnake so the new tail segment interpolates from the old tail
    const tail = state.prevSnake[state.prevSnake.length - 1];
    state.prevSnake.push({ ...tail });

    events.ate = true;
    events.points = 10 * diff.mult;
    state.score += events.points;
    state.foods += 1;
    state.interval = Math.max(diff.minInterval, diff.baseInterval - state.foods * 3.2);
    state.flash = 1;
    state.food = randomFreeCell(state.snake);
    state.foodBornAt = now;

    // victory: board full
    if (state.snake.length >= GRID * GRID) {
      state.status = "over";
      events.died = true;
    }
  }

  return events;
}
