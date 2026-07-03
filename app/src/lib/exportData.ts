import type { PilotParticipant, SelfCheckSession, TrainingSession } from "../types";

export type ExportBundle = {
  exportedAt: string;
  participants: Pick<PilotParticipant, "alias" | "createdAt">[];
  selfChecks: Array<{
    id: string;
    createdAt: string;
    setId: string;
    setTitle: string;
    participantAlias: string;
    recallCount: number;
    recallFalseAlarms: number;
    clockItems: number;
    clockAutoScore: number;
    clockTimeScore: number;
    observationCount: number;
    challengeCorrect: number;
    challengeTotal: number;
    challengeFalseAlarms: number;
    miniTaskCorrect: number;
    miniTaskTotal: number;
    miniTaskFalseAlarms: number;
    resultBand: SelfCheckSession["resultBand"];
  }>;
  training: Array<{
    id: string;
    createdAt: string;
    kind: TrainingSession["kind"];
    setId: string;
    setTitle: string;
    level: number;
    trials: number;
    accuracy: number;
    falseAlarms: number;
    durationMs: number;
  }>;
};

export function buildExportBundle(
  participants: PilotParticipant[],
  selfChecks: SelfCheckSession[],
  training: TrainingSession[],
): ExportBundle {
  return {
    exportedAt: new Date().toISOString(),
    participants: participants.map(({ alias, createdAt }) => ({ alias, createdAt })),
    selfChecks: selfChecks.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      setId: session.setId ?? "",
      setTitle: session.setTitle ?? "",
      participantAlias: session.participantAlias ?? "single-user",
      recallCount: session.recallCount,
      recallFalseAlarms: session.recallFalseAlarms ?? 0,
      clockItems: [
        session.clockChecklist.hasCircle,
        session.clockChecklist.hasNumbers,
        session.clockChecklist.hasHands,
      ].filter(Boolean).length,
      clockAutoScore: session.clockChecklist.autoScore ?? 0,
      clockTimeScore: session.clockChecklist.timeScore ?? 0,
      observationCount: session.observationFlags.length,
      challengeCorrect: session.challengeCorrect ?? 0,
      challengeTotal: session.challengeTotal ?? 0,
      challengeFalseAlarms: session.challengeFalseAlarms ?? 0,
      miniTaskCorrect: session.miniTaskCorrect ?? 0,
      miniTaskTotal: session.miniTaskTotal ?? 0,
      miniTaskFalseAlarms: session.miniTaskFalseAlarms ?? 0,
      resultBand: session.resultBand,
    })),
    training: training.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      kind: session.kind,
      setId: session.setId ?? "",
      setTitle: session.setTitle ?? "",
      level: session.level,
      trials: session.trials,
      accuracy: session.accuracy,
      falseAlarms: session.falseAlarms,
      durationMs: session.durationMs,
    })),
  };
}

export function toCsv(bundle: ExportBundle) {
  const rows = [
    [
      "type",
      "id",
      "createdAt",
      "participantAlias",
      "setId",
      "setTitle",
      "metricA",
      "metricB",
      "metricC",
      "metricD",
      "metricE",
      "metricF",
      "metricG",
      "metricH",
      "metricI",
      "metricJ",
      "metricK",
    ],
    ...bundle.selfChecks.map((item) => [
      "self-check",
      item.id,
      item.createdAt,
      item.participantAlias,
      item.setId,
      item.setTitle,
      `recall:${item.recallCount}`,
      `recallFalse:${item.recallFalseAlarms}`,
      `clock:${item.clockItems}`,
      `clockAuto:${item.clockAutoScore}`,
      `clockTime:${item.clockTimeScore}`,
      `challenge:${item.challengeCorrect}/${item.challengeTotal}`,
      `challengeFalse:${item.challengeFalseAlarms}`,
      `miniTask:${item.miniTaskCorrect}/${item.miniTaskTotal}`,
      `miniTaskFalse:${item.miniTaskFalseAlarms}`,
      `observations:${item.observationCount}`,
      item.resultBand,
    ]),
    ...bundle.training.map((item) => [
      "training",
      item.id,
      item.createdAt,
      "single-user",
      item.setId,
      item.setTitle,
      item.kind,
      `level:${item.level}`,
      `accuracy:${item.accuracy}`,
      `falseAlarms:${item.falseAlarms}`,
      `trials:${item.trials}`,
      `durationMs:${item.durationMs}`,
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((value) => String(value).replaceAll('"', '""'))
        .map((value) => `"${value}"`)
        .join(","),
    )
    .join("\n");
}

export function hasNoPersonalFields(text: string) {
  return !["姓名", "身份证", "手机号", "电话", "住址", "邮箱"].some((word) => text.includes(word));
}
