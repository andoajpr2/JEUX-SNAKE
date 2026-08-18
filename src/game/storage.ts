import type { DifficultyId, RecordEntry } from "./types";

const RECORDS_KEY = "serpent.records.v1";
const DIFF_KEY = "serpent.difficulty.v1";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — play on without persistence */
  }
}

export function loadRecords(): RecordEntry[] {
  const raw = safeGet(RECORDS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as RecordEntry[])
      .filter(
        (e) =>
          e &&
          typeof e.score === "number" &&
          typeof e.date === "number" &&
          typeof e.id === "string" &&
          (e.difficulty === "facile" || e.difficulty === "normal" || e.difficulty === "difficile"),
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function saveScore(score: number, difficulty: DifficultyId): { records: RecordEntry[]; entry: RecordEntry; rank: number } {
  const entry: RecordEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    score,
    difficulty,
    date: Date.now(),
  };
  const records = [...loadRecords(), entry].sort((a, b) => b.score - a.score).slice(0, 5);
  safeSet(RECORDS_KEY, JSON.stringify(records));
  return { records, entry, rank: records.findIndex((r) => r.id === entry.id) + 1 };
}

export function bestFor(records: RecordEntry[], difficulty: DifficultyId): number {
  return records.reduce((max, r) => (r.difficulty === difficulty && r.score > max ? r.score : max), 0);
}

export function loadDifficulty(): DifficultyId | null {
  const v = safeGet(DIFF_KEY);
  return v === "facile" || v === "normal" || v === "difficile" ? v : null;
}

export function saveDifficulty(d: DifficultyId) {
  safeSet(DIFF_KEY, d);
}
