export type NBackResponse = {
  stimulus: string;
  expectedMatch: boolean;
  userMatched: boolean;
};

export type NBackSummary = {
  trials: number;
  hits: number;
  misses: number;
  correctRejections: number;
  falseAlarms: number;
  accuracy: number;
};

const DEFAULT_STIMULI = ["花", "茶", "山", "门", "灯", "米", "云", "书"];

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function summarizeNBack(responses: NBackResponse[]): NBackSummary {
  const hits = responses.filter((item) => item.expectedMatch && item.userMatched).length;
  const misses = responses.filter((item) => item.expectedMatch && !item.userMatched).length;
  const correctRejections = responses.filter((item) => !item.expectedMatch && !item.userMatched).length;
  const falseAlarms = responses.filter((item) => !item.expectedMatch && item.userMatched).length;
  const correct = hits + correctRejections;
  const trials = responses.length;

  return {
    trials,
    hits,
    misses,
    correctRejections,
    falseAlarms,
    accuracy: trials === 0 ? 0 : Math.round((correct / trials) * 100),
  };
}

export function nextNBackLevel(level: number, accuracy: number, falseAlarms: number) {
  if (accuracy >= 80 && falseAlarms <= 2) return Math.min(level + 1, 2);
  if (accuracy < 60) return Math.max(level - 1, 1);
  return level;
}

export function buildNBackSequence(level: number, length = 12, stimuli = DEFAULT_STIMULI) {
  const pool = stimuli.length >= 4 ? stimuli : DEFAULT_STIMULI;
  const sequence: string[] = [];
  const seed =
    level * 97 +
    length * 31 +
    pool.reduce((sum, item, index) => sum + item.charCodeAt(0) * (index + 1), 0);
  const rng = createRng(seed);
  const possibleMatches = Math.max(0, length - level);
  const targetMatchCount = Math.min(Math.max(2, Math.round(possibleMatches * 0.24)), Math.max(0, possibleMatches));
  const targetPositions = new Set<number>();
  let attempts = 0;

  while (targetPositions.size < targetMatchCount && attempts < length * 8) {
    attempts += 1;
    const index = level + Math.floor(rng() * possibleMatches);
    if (targetPositions.has(index - 1) || targetPositions.has(index + 1)) continue;
    targetPositions.add(index);
  }

  for (let index = level; targetPositions.size < targetMatchCount && index < length; index += 1) {
    targetPositions.add(index);
  }

  for (let index = 0; index < length; index += 1) {
    const shouldMatch = targetPositions.has(index);
    if (shouldMatch) {
      sequence.push(sequence[index - level]);
      continue;
    }

    let candidate = pool[Math.floor(rng() * pool.length)];
    if (index >= level && candidate === sequence[index - level]) {
      const currentIndex = pool.indexOf(candidate);
      candidate = pool[(currentIndex + 1 + Math.floor(rng() * (pool.length - 1))) % pool.length];
    }
    sequence.push(candidate);
  }

  return sequence;
}

export function isExpectedMatch(sequence: string[], index: number, level: number) {
  return index >= level && sequence[index] === sequence[index - level];
}
