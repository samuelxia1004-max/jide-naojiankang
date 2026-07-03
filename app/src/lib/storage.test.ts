import { describe, expect, it } from "vitest";
import { readSettings, saveSettings, STORAGE_KEYS, writeJson, readJson } from "./storage";

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe("local storage helpers", () => {
  it("round-trips settings without a browser", () => {
    const store = createMemoryStorage();
    saveSettings({ fontScale: "large", facilitatorMode: true }, store);
    expect(readSettings(store)).toEqual({ fontScale: "large", facilitatorMode: true });
  });

  it("falls back when JSON is unreadable", () => {
    const store = createMemoryStorage();
    store.setItem(STORAGE_KEYS.settings, "{broken");
    expect(readSettings(store)).toEqual({ fontScale: "normal", facilitatorMode: false });
  });

  it("reads and writes generic JSON values", () => {
    const store = createMemoryStorage();
    writeJson("sample", { ok: true }, store);
    expect(readJson("sample", { ok: false }, store)).toEqual({ ok: true });
  });
});
