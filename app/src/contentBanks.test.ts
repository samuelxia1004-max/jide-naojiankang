import { describe, expect, it } from "vitest";
import {
  dailyTaskSets,
  guideCards,
  nBackSets,
  selfCheckChallengeSets,
  selfCheckMiniTasks,
  selfCheckSets,
  spacedRecallSets,
} from "./contentBanks";
import { choiceTrainingModules, choiceTrainingSetCount } from "./expandedTraining";

describe("content banks", () => {
  it("provides twenty sets for each major feature", () => {
    expect(selfCheckSets.length).toBeGreaterThanOrEqual(20);
    expect(nBackSets.length).toBeGreaterThanOrEqual(20);
    expect(spacedRecallSets.length).toBeGreaterThanOrEqual(20);
    expect(dailyTaskSets.length).toBeGreaterThanOrEqual(20);
    expect(selfCheckMiniTasks.length).toBeGreaterThanOrEqual(20);
    expect(selfCheckChallengeSets.length).toBeGreaterThanOrEqual(20);
    expect(guideCards.length).toBeGreaterThanOrEqual(20);
    expect(choiceTrainingModules.length).toBeGreaterThanOrEqual(8);
    expect(choiceTrainingSetCount).toBeGreaterThanOrEqual(160);
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
      expect(set.choices.length).toBeGreaterThanOrEqual(8);
      expect(new Set(set.choices).size).toBe(set.choices.length);
      expect(set.choices.every((choice) => choice.trim().length > 0)).toBe(true);
      for (const target of set.targets) {
        expect(set.choices).toContain(target);
      }
    }

    for (const set of dailyTaskSets) {
      expect(set.targets).toHaveLength(3);
      expect(set.choices.length).toBeGreaterThanOrEqual(8);
      expect(new Set(set.choices).size).toBe(set.choices.length);
      expect(set.choices.every((choice) => choice.trim().length > 0)).toBe(true);
      for (const target of set.targets) {
        expect(set.choices).toContain(target);
      }
    }
  });

  it("keeps mini tasks complete", () => {
    for (const task of selfCheckMiniTasks) {
      expect(task.choices.length).toBeGreaterThanOrEqual(8);
      expect(new Set(task.choices).size).toBe(task.choices.length);
      expect(task.choices.every((choice) => choice.trim().length > 0)).toBe(true);
      expect(task.helpfulChoices).toHaveLength(3);
      for (const helpfulChoice of task.helpfulChoices) {
        expect(task.choices).toContain(helpfulChoice);
      }
    }
  });

  it("keeps self-check challenge sets difficult enough", () => {
    for (const set of selfCheckChallengeSets) {
      expect(set.targets).toHaveLength(3);
      expect(set.choices.length).toBeGreaterThanOrEqual(8);
      expect(new Set(set.choices).size).toBe(set.choices.length);
      expect(set.choices.every((choice) => choice.trim().length > 0)).toBe(true);
      for (const target of set.targets) {
        expect(set.choices).toContain(target);
      }
    }
  });

  it("keeps expanded choice training modules rich and scorable", () => {
    const moduleIds = new Set<string>();
    for (const module of choiceTrainingModules) {
      expect(moduleIds.has(module.id)).toBe(false);
      moduleIds.add(module.id);
      expect(module.sets.length).toBeGreaterThanOrEqual(20);

      for (const set of module.sets) {
        expect(set.targets).toHaveLength(3);
        expect(set.choices.length).toBeGreaterThanOrEqual(8);
        expect(new Set(set.choices).size).toBe(set.choices.length);
        expect(set.choices.every((choice) => choice.trim().length > 0)).toBe(true);
        for (const target of set.targets) {
          expect(set.choices).toContain(target);
        }
      }
    }
  });
});
