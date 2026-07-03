import { describe, expect, it } from "vitest";
import { dailyTaskSets, guideCards, nBackSets, selfCheckMiniTasks, selfCheckSets, spacedRecallSets } from "./contentBanks";

describe("content banks", () => {
  it("provides twenty sets for each major feature", () => {
    expect(selfCheckSets.length).toBeGreaterThanOrEqual(20);
    expect(nBackSets.length).toBeGreaterThanOrEqual(20);
    expect(spacedRecallSets.length).toBeGreaterThanOrEqual(20);
    expect(dailyTaskSets.length).toBeGreaterThanOrEqual(20);
    expect(selfCheckMiniTasks.length).toBeGreaterThanOrEqual(20);
    expect(guideCards.length).toBeGreaterThanOrEqual(20);
  });

  it("keeps self-check sets complete", () => {
    for (const set of selfCheckSets) {
      expect(set.words).toHaveLength(3);
      expect(set.clockPrompt.length).toBeGreaterThan(0);
      expect(set.observations.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("keeps training sets usable", () => {
    for (const set of nBackSets) {
      expect(set.stimuli.length).toBeGreaterThanOrEqual(6);
      expect(set.length).toBeGreaterThanOrEqual(12);
    }

    for (const set of spacedRecallSets) {
      expect(set.targets).toHaveLength(4);
      expect(new Set(set.choices).size).toBe(set.choices.length);
      for (const target of set.targets) {
        expect(set.choices).toContain(target);
      }
    }

    for (const set of dailyTaskSets) {
      expect(set.targets).toHaveLength(3);
      expect(new Set(set.choices).size).toBe(set.choices.length);
      for (const target of set.targets) {
        expect(set.choices).toContain(target);
      }
    }
  });

  it("keeps mini tasks complete", () => {
    for (const task of selfCheckMiniTasks) {
      expect(task.choices.length).toBeGreaterThanOrEqual(5);
      expect(task.helpfulChoices).toHaveLength(3);
      for (const helpfulChoice of task.helpfulChoices) {
        expect(task.choices).toContain(helpfulChoice);
      }
    }
  });
});
