import type { ClockChecklist, SelfCheckSession } from "../types";

export const FORBIDDEN_RESULT_WORDS = ["正常", "异常", "疑似痴呆", "高风险"];

export function getResultBand(
  recallCount: number,
  clockChecklist: ClockChecklist,
  observationFlags: string[],
): SelfCheckSession["resultBand"] {
  const clockSupportNeeded =
    !clockChecklist.hasCircle ||
    !clockChecklist.hasNumbers ||
    !clockChecklist.hasHands ||
    clockChecklist.userFeltDifficult;

  if (recallCount <= 1 || clockSupportNeeded || observationFlags.length >= 2) {
    return "doctor_discussion_suggested";
  }

  return "completed";
}

export function getResultCopy(resultBand: SelfCheckSession["resultBand"]) {
  if (resultBand === "doctor_discussion_suggested") {
    return "建议和医生讨论";
  }

  return "完成记录";
}

export function getClockItemCount(clockChecklist: ClockChecklist) {
  return [
    clockChecklist.hasCircle,
    clockChecklist.hasNumbers,
    clockChecklist.hasHands,
  ].filter(Boolean).length;
}

export function getSelfCheckSupportSignals(session: SelfCheckSession) {
  const clockMissing = 3 - getClockItemCount(session.clockChecklist);
  const clockEffort = session.clockChecklist.userFeltDifficult ? 1 : 0;
  const recallSignals = Math.max(0, 3 - session.recallCount);
  const miniTaskSignals =
    typeof session.miniTaskCorrect === "number" && typeof session.miniTaskTotal === "number"
      ? Math.max(0, session.miniTaskTotal - session.miniTaskCorrect)
      : 0;

  return recallSignals + clockMissing + clockEffort + session.observationFlags.length + miniTaskSignals;
}

export function getSelfCheckTrendCopy(current: SelfCheckSession, previous?: SelfCheckSession | null) {
  if (!previous) {
    return "这是第一次留下记录。先不用急着比较，把它当作以后沟通和观察的起点。";
  }

  const currentSignals = getSelfCheckSupportSignals(current);
  const previousSignals = getSelfCheckSupportSignals(previous);

  if (currentSignals <= previousSignals - 2) {
    return "和上次相比，这次完成得更顺一些。能继续尝试和记录，已经很值得肯定。";
  }

  if (currentSignals >= previousSignals + 2) {
    return "这次比上次吃力一点也没关系。睡眠、情绪、身体不舒服、环境太吵都可能影响表现，建议隔一段时间在安静状态下再记录一次。";
  }

  return "这次和上次大致接近。稳定记录比单次表现更有用，可以继续观察日常生活中的真实变化。";
}

export function getSelfCheckSuggestions(session: SelfCheckSession) {
  const suggestions = [
    "把本次记录保存下来，下次尽量在相似时间、安静环境中再做一次，方便比较。",
    "留意睡眠、情绪、疼痛、听力、视力和最近用药变化，这些都可能影响记忆和注意力。",
  ];

  if (session.resultBand === "doctor_discussion_suggested") {
    suggestions.unshift("如果这些变化持续出现，或已经影响用药、出门、做饭、付费等生活安排，建议带着记录和医生讨论。");
  } else {
    suggestions.unshift("本次只是完成了一次教育型记录。若家人仍持续担心，也可以把记录带给医生看看。");
  }

  if (session.observationFlags.length > 0) {
    suggestions.push("把勾选到的日常变化写成具体例子，例如发生时间、地点、持续多久、是否需要家人帮助。");
  }

  return suggestions;
}

export function assertSafeResultCopy(copy: string) {
  return FORBIDDEN_RESULT_WORDS.every((word) => !copy.includes(word));
}
