import { describe, expect, it } from "vitest";
import { scoreClockDrawing, type ClockStroke } from "./clockScoring";

function circleStroke(cx: number, cy: number, radius: number): ClockStroke {
  return Array.from({ length: 73 }, (_, index) => {
    const angle = (index / 72) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

function lineStroke(fromX: number, fromY: number, toX: number, toY: number): ClockStroke {
  return [
    { x: fromX, y: fromY },
    { x: (fromX + toX) / 2, y: (fromY + toY) / 2 },
    { x: toX, y: toY },
  ];
}

function digitLikeStroke(cx: number, cy: number): ClockStroke {
  return [
    { x: cx - 4, y: cy - 5 },
    { x: cx + 3, y: cy - 3 },
    { x: cx - 2, y: cy + 2 },
    { x: cx + 4, y: cy + 5 },
  ];
}

describe("clock drawing auto scoring", () => {
  it("detects a complete practice clock from local strokes", () => {
    const strokes: ClockStroke[] = [
      circleStroke(320, 210, 150),
      digitLikeStroke(320, 70),
      digitLikeStroke(460, 210),
      digitLikeStroke(320, 350),
      digitLikeStroke(180, 210),
      lineStroke(320, 210, 320, 95),
      lineStroke(320, 210, 420, 260),
    ];

    const score = scoreClockDrawing(strokes, 640, 420, { hour: 4, minute: 0 });
    expect(score.hasCircle).toBe(true);
    expect(score.hasNumbers).toBe(true);
    expect(score.hasHands).toBe(true);
    expect(score.hasTimeMatch).toBe(true);
    expect(score.confidence).toBe(100);
  });

  it("checks whether hand direction matches the requested time", () => {
    const strokes: ClockStroke[] = [
      circleStroke(320, 210, 150),
      digitLikeStroke(320, 70),
      digitLikeStroke(460, 210),
      digitLikeStroke(320, 350),
      digitLikeStroke(180, 210),
      lineStroke(320, 210, 320, 95),
      lineStroke(320, 210, 420, 260),
    ];

    const score = scoreClockDrawing(strokes, 640, 420, { hour: 8, minute: 20 });
    expect(score.hasCircle).toBe(true);
    expect(score.hasHands).toBe(true);
    expect(score.hasTimeMatch).toBe(false);
    expect(score.timeScore).toBeLessThan(67);
  });

  it("does not over-score a few short marks", () => {
    const score = scoreClockDrawing(
      [
        digitLikeStroke(100, 100),
        lineStroke(320, 210, 355, 210),
      ],
      640,
      420,
    );

    expect(score.hasCircle).toBe(false);
    expect(score.hasNumbers).toBe(false);
    expect(score.hasHands).toBe(false);
  });
});
