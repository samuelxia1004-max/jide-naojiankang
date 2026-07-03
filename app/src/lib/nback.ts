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

  for (let index = 0; index < length; index += 1) {
    const shouldMatch = index >= level && index % 4 === 0;
    if (shouldMatch) {
      sequence.push(sequence[index - level]);
      continue;
    }

    let candidate = pool[(index * 3 + level) % pool.length];
    if (index >= level && candidate === sequence[index - level]) {
      candidate = pool[(index * 3 + level + 1) % pool.length];
    }
    sequence.push(candidate);
  }

  return sequence;
}

export function isExpectedMatch(sequence: string[], index: number, level: number) {
  return index >= level && sequence[index] === sequence[index - level];
}
