import { describe, expect, it } from "vitest";
import { buildExportBundle, hasNoPersonalFields, toCsv } from "./exportData";

describe("anonymous export", () => {
  it("keeps export data to anonymous metrics", () => {
    const bundle = buildExportBundle(
      [{ alias: "P001", createdAt: "2026-07-01T00:00:00.000Z" }],
      [
        {
          id: "self-1",
          createdAt: "2026-07-01T00:01:00.000Z",
          participantAlias: "P001",
          recallCount: 2,
          clockChecklist: {
            hasCircle: true,
            hasNumbers: true,
            hasHands: false,
            userFeltDifficult: false,
          },
          observationFlags: ["recent-support-needed"],
          resultBand: "completed",
        },
      ],
      [
        {
          id: "train-1",
          kind: "nback",
          level: 1,
          trials: 12,
          accuracy: 75,
          falseAlarms: 1,
          durationMs: 20000,
          createdAt: "2026-07-01T00:02:00.000Z",
        },
      ],
    );
    const text = JSON.stringify(bundle) + toCsv(bundle);
    expect(hasNoPersonalFields(text)).toBe(true);
    expect(text).toContain("P001");
    expect(text).not.toContain("phone");
    expect(text).not.toContain("address");
  });
});
