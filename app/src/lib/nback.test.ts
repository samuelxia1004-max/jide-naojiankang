import { describe, expect, it } from "vitest";
import { buildNBackSequence, isExpectedMatch, nextNBackLevel, summarizeNBack } from "./nback";

describe("n-back logic", () => {
  it("raises, lowers, or keeps level using the agreed thresholds", () => {
    expect(nextNBackLevel(1, 86, 1)).toBe(2);
    expect(nextNBackLevel(2, 55, 0)).toBe(1);
    expect(nextNBackLevel(2, 72, 1)).toBe(2);
    expect(nextNBackLevel(2, 91, 0)).toBe(2);
  });

  it("summarizes response accuracy and false alarms", () => {
    const summary = summarizeNBack([
      { stimulus: "花", expectedMatch: false, userMatched: false },
      { stimulus: "桥", expectedMatch: true, userMatched: true },
      { stimulus: "茶", expectedMatch: false, userMatched: true },
      { stimulus: "山", expectedMatch: true, userMatched: false },
    ]);
    expect(summary.accuracy).toBe(50);
    expect(summary.falseAlarms).toBe(1);
    expect(summary.misses).toBe(1);
  });

  it("builds deterministic but less predictable match positions", () => {
    const sequence = buildNBackSequence(1, 16);
    const repeated = buildNBackSequence(1, 16);
    const matchCount = sequence.filter((_, index) => isExpectedMatch(sequence, index, 1)).length;

    expect(sequence).toEqual(repeated);
    expect(matchCount).toBeGreaterThanOrEqual(3);
    expect(matchCount).toBeLessThanOrEqual(5);
  });
});
