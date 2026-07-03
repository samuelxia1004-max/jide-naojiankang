import { describe, expect, it } from "vitest";
import {
  assertSafeResultCopy,
  getSelfCheckSuggestions,
  getSelfCheckDetailItems,
  getSelfCheckTrendCopy,
  getResultBand,
  getResultCopy,
} from "./selfCheck";

describe("self-check result wording", () => {
  const easyClock = {
    hasCircle: true,
    hasNumbers: true,
    hasHands: true,
    userFeltDifficult: false,
  };

  it("uses only the two allowed result labels", () => {
    expect(getResultCopy("completed")).toBe("完成记录");
    expect(getResultCopy("doctor_discussion_suggested")).toBe("建议和医生讨论");
  });

  it("does not include forbidden diagnosis-like words", () => {
    expect(assertSafeResultCopy(getResultCopy("completed"))).toBe(true);
    expect(assertSafeResultCopy(getResultCopy("doctor_discussion_suggested"))).toBe(true);
  });

  it("suggests discussion without medical labeling when multiple support signals are present", () => {
    expect(getResultBand(1, easyClock, [])).toBe("doctor_discussion_suggested");
    expect(getResultBand(3, easyClock, ["a", "b"])).toBe("doctor_discussion_suggested");
    expect(getResultBand(3, easyClock, [])).toBe("completed");
  });

  it("keeps advice and trend language non-diagnostic", () => {
    const current = {
      id: "self-1",
      createdAt: "2026-07-02T00:00:00.000Z",
      recallCount: 2,
      clockChecklist: easyClock,
      observationFlags: [],
      resultBand: "completed" as const,
    };
    const previous = {
      ...current,
      id: "self-0",
      recallCount: 1,
      observationFlags: ["需要更多提醒"],
    };
    const text = [getSelfCheckTrendCopy(current, previous), ...getSelfCheckSuggestions(current)].join("");
    expect(assertSafeResultCopy(text)).toBe(true);
  });

  it("keeps detailed feedback concrete but non-diagnostic", () => {
    const current = {
      id: "self-detail",
      createdAt: "2026-07-02T00:00:00.000Z",
      recallCount: 1,
      recallFalseAlarms: 1,
      clockChecklist: {
        hasCircle: true,
        hasNumbers: true,
        hasHands: true,
        hasTimeMatch: false,
        userFeltDifficult: false,
        autoScore: 75,
        timeScore: 33,
      },
      observationFlags: ["需要更多提醒"],
      challengeCorrect: 1,
      challengeTotal: 3,
      challengeFalseAlarms: 1,
      miniTaskCorrect: 2,
      miniTaskTotal: 3,
      miniTaskFalseAlarms: 0,
      resultBand: "doctor_discussion_suggested" as const,
    };

    const text = [...getSelfCheckDetailItems(current), ...getSelfCheckSuggestions(current)]
      .map((item) => (typeof item === "string" ? item : `${item.title}${item.status}${item.detail}${item.advice}`))
      .join("");

    expect(text).toContain("指向时间");
    expect(text).toContain("信息理解");
    expect(assertSafeResultCopy(text)).toBe(true);
  });
});
