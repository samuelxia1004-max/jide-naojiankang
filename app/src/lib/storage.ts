import type {
  AppSettings,
  ConsentRecord,
  PilotParticipant,
  SelfCheckSession,
  TrainingSession,
} from "../types";

export const STORAGE_KEYS = {
  settings: "remember.v1.settings",
  consent: "remember.v1.consent",
  selfCheckSessions: "remember.v1.selfCheckSessions",
  trainingSessions: "remember.v1.trainingSessions",
  pilotParticipants: "remember.v1.pilotParticipants",
} as const;

export const defaultSettings: AppSettings = {
  fontScale: "normal",
  facilitatorMode: false,
};

export type MemoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const getStore = (store?: MemoryStorage): MemoryStorage | undefined => {
  if (store) return store;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
};

export function readJson<T>(key: string, fallback: T, store?: MemoryStorage): T {
  const activeStore = getStore(store);
  if (!activeStore) return fallback;
  const raw = activeStore.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T, store?: MemoryStorage) {
  const activeStore = getStore(store);
  if (!activeStore) return;
  activeStore.setItem(key, JSON.stringify(value));
}

export function readSettings(store?: MemoryStorage): AppSettings {
  return { ...defaultSettings, ...readJson(STORAGE_KEYS.settings, defaultSettings, store) };
}

export function saveSettings(settings: AppSettings, store?: MemoryStorage) {
  writeJson(STORAGE_KEYS.settings, settings, store);
}

export function readConsent(store?: MemoryStorage): ConsentRecord | null {
  return readJson<ConsentRecord | null>(STORAGE_KEYS.consent, null, store);
}

export function saveConsent(consent: ConsentRecord, store?: MemoryStorage) {
  writeJson(STORAGE_KEYS.consent, consent, store);
}

export function readSelfChecks(store?: MemoryStorage): SelfCheckSession[] {
  return readJson<SelfCheckSession[]>(STORAGE_KEYS.selfCheckSessions, [], store);
}

export function saveSelfChecks(sessions: SelfCheckSession[], store?: MemoryStorage) {
  writeJson(STORAGE_KEYS.selfCheckSessions, sessions, store);
}

export function appendSelfCheck(session: SelfCheckSession, store?: MemoryStorage) {
  saveSelfChecks([session, ...readSelfChecks(store)], store);
}

export function readTrainingSessions(store?: MemoryStorage): TrainingSession[] {
  return readJson<TrainingSession[]>(STORAGE_KEYS.trainingSessions, [], store);
}

export function saveTrainingSessions(sessions: TrainingSession[], store?: MemoryStorage) {
  writeJson(STORAGE_KEYS.trainingSessions, sessions, store);
}

export function appendTrainingSession(session: TrainingSession, store?: MemoryStorage) {
  saveTrainingSessions([session, ...readTrainingSessions(store)], store);
}

export function readPilotParticipants(store?: MemoryStorage): PilotParticipant[] {
  return readJson<PilotParticipant[]>(STORAGE_KEYS.pilotParticipants, [], store);
}

export function savePilotParticipants(participants: PilotParticipant[], store?: MemoryStorage) {
  writeJson(STORAGE_KEYS.pilotParticipants, participants, store);
}
