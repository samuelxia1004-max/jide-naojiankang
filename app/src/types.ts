export type FontScale = "normal" | "large";

export type AppSettings = {
  fontScale: FontScale;
  facilitatorMode: boolean;
};

export type ConsentRecord = {
  version: string;
  scope: "local-only" | "anonymous-export";
  acceptedAt: string;
};

export type ClockChecklist = {
  hasCircle: boolean;
  hasNumbers: boolean;
  hasHands: boolean;
  userFeltDifficult: boolean;
};

export type SelfCheckSession = {
  id: string;
  createdAt: string;
  setId?: string;
  setTitle?: string;
  miniTaskId?: string;
  miniTaskTitle?: string;
  participantAlias?: string;
  recallCount: number;
  clockChecklist: ClockChecklist;
  observationFlags: string[];
  miniTaskCorrect?: number;
  miniTaskTotal?: number;
  resultBand: "completed" | "doctor_discussion_suggested";
};

export type TrainingSession = {
  id: string;
  kind: "nback" | "spacedRecall" | "dailyTask";
  setId?: string;
  setTitle?: string;
  level: number;
  trials: number;
  accuracy: number;
  falseAlarms: number;
  durationMs: number;
  createdAt: string;
};

export type PilotParticipant = {
  alias: string;
  createdAt: string;
};
