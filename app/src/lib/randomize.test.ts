import { describe, expect, it } from "vitest";
import { shuffleItems } from "./randomize";

describe("shuffleItems", () => {
  it("keeps the original array unchanged", () => {
    const original = ["早", "中", "晚", "夜"];
    const shuffled = shuffleItems(original, () => 0);

    expect(original).toEqual(["早", "中", "晚", "夜"]);
    expect(shuffled).toEqual(["中", "晚", "夜", "早"]);
  });

  it("uses the supplied random source for deterministic tests", () => {
    const values = [0.1, 0.7, 0.2];
    let index = 0;
    const shuffled = shuffleItems(["A", "B", "C", "D"], () => values[index++] ?? 0);

    expect(shuffled).toEqual(["B", "D", "C", "A"]);
  });
});
