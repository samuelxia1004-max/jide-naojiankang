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
  hasTimeMatch?: boolean;
  userFeltDifficult: boolean;
  autoScore?: number;
  numberSectors?: number;
  handLines?: number;
  timeScore?: number;
  targetTime?: string;
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
  recallFalseAlarms?: number;
  clockChecklist: ClockChecklist;
  observationFlags: string[];
  challengeId?: string;
  challengeTitle?: string;
  challengeCorrect?: number;
  challengeTotal?: number;
  challengeFalseAlarms?: number;
  miniTaskCorrect?: number;
  miniTaskTotal?: number;
  miniTaskFalseAlarms?: number;
  resultBand: "completed" | "doctor_discussion_suggested";
};

export type TrainingSession = {
  id: string;
  kind: string;
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
