import type { ClockChecklist, SelfCheckSession } from "../types";

export const FORBIDDEN_RESULT_WORDS = ["正常", "异常", "疑似痴呆", "高风险"];

export function getResultBand(
  recallCount: number,
  clockChecklist: ClockChecklist,
  observationFlags: string[],
  extraSignals = 0,
): SelfCheckSession["resultBand"] {
  const clockSupportNeeded =
    !clockChecklist.hasCircle ||
    !clockChecklist.hasNumbers ||
    !clockChecklist.hasHands ||
    clockChecklist.hasTimeMatch === false ||
    clockChecklist.userFeltDifficult;

  if (recallCount <= 1 || clockSupportNeeded || observationFlags.length >= 2 || extraSignals >= 3) {
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
  const challengeSignals =
    typeof session.challengeCorrect === "number" && typeof session.challengeTotal === "number"
      ? Math.max(0, session.challengeTotal - session.challengeCorrect)
      : 0;
  const falseAlarmSignals =
    (session.recallFalseAlarms ?? 0) + (session.challengeFalseAlarms ?? 0) + (session.miniTaskFalseAlarms ?? 0);
  const timeSignal = session.clockChecklist.hasTimeMatch === false ? 1 : 0;

  return (
    recallSignals +
    clockMissing +
    clockEffort +
    timeSignal +
    session.observationFlags.length +
    miniTaskSignals +
    challengeSignals +
    falseAlarmSignals
  );
}

export function getSelfCheckDetailItems(session: SelfCheckSession) {
  const recallFalseAlarms = session.recallFalseAlarms ?? 0;
  const challengeCorrect = session.challengeCorrect ?? 0;
  const challengeTotal = session.challengeTotal ?? 0;
  const challengeFalseAlarms = session.challengeFalseAlarms ?? 0;
  const miniTaskCorrect = session.miniTaskCorrect ?? 0;
  const miniTaskTotal = session.miniTaskTotal ?? 0;
  const miniTaskFalseAlarms = session.miniTaskFalseAlarms ?? 0;
  const clockItems = getClockItemCount(session.clockChecklist);
  const clockTimeMatched = session.clockChecklist.hasTimeMatch;

  return [
    {
      title: "词语回忆",
      status: `${session.recallCount} / 3，误选 ${recallFalseAlarms} 项`,
      detail:
        session.recallCount >= 2 && recallFalseAlarms === 0
          ? "这一步完成较顺。"
          : "这一步显示回忆或分辨相似词时比较吃力。",
      advice: "下次尽量在安静环境中做；如果多次都难以回忆近事，可把具体例子带给医生。",
    },
    {
      title: "时钟绘制",
      status: `${clockItems} / 3 项，指向时间${clockTimeMatched ? "大致匹配" : "未稳定匹配"}`,
      detail:
        clockItems === 3 && clockTimeMatched
          ? "表盘、数字、指针和题目时间大致能被识别。"
          : "时钟结构或指针方向有一部分没有稳定识别。",
      advice: "如果多次画钟都明显吃力，尤其是数字位置或指针时间反复困难，建议记录下来和医生讨论。",
    },
    {
      title: "信息理解",
      status: `${challengeCorrect} / ${challengeTotal}，误选 ${challengeFalseAlarms} 项`,
      detail:
        challengeTotal > 0 && challengeCorrect >= 2 && challengeFalseAlarms <= 1
          ? "能从生活信息里抓到部分关键点。"
          : "从通知、留言或安排中提取重点时可能比较费力。",
      advice: "真实生活中可把通知拆成时间、地点、要带物品三栏，减少临时记忆压力。",
    },
    {
      title: "生活判断",
      status: `${miniTaskCorrect} / ${miniTaskTotal}，误选 ${miniTaskFalseAlarms} 项`,
      detail:
        miniTaskTotal > 0 && miniTaskCorrect >= 2 && miniTaskFalseAlarms <= 1
          ? "能选到一些更稳妥的生活支持做法。"
          : "遇到安全、用药、缴费或沟通场景时，可能需要更清楚的外部支持。",
      advice: "可先从药盒、清单、固定物品位置和大额付款前核对这些小措施开始。",
    },
    {
      title: "日常观察",
      status: `勾选 ${session.observationFlags.length} 项`,
      detail:
        session.observationFlags.length === 0
          ? "这次没有勾选明显日常变化。"
          : "家人已经观察到一些生活场景中的变化。",
      advice: "把勾选项写成具体例子：何时发生、持续多久、是否影响用药出门做饭或付款。",
    },
  ];
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

  if ((session.recallFalseAlarms ?? 0) > 0) {
    suggestions.push("回忆题中若常选到相似但不是目标的词，日常可减少干扰信息，一次只给一个清楚提示。");
  }

  if (session.clockChecklist.hasTimeMatch === false) {
    suggestions.push("时钟指针若多次不容易指到题目时间，可在纸上练习先标 12、3、6、9，再画长短指针。");
  }

  if ((session.challengeFalseAlarms ?? 0) > 0 || (session.miniTaskFalseAlarms ?? 0) > 0) {
    suggestions.push("信息理解或生活判断若容易被相似选项带偏，可把重要事项写成“时间、地点、下一步”三栏。");
  }

  return suggestions;
}

export function assertSafeResultCopy(copy: string) {
  return FORBIDDEN_RESULT_WORDS.every((word) => !copy.includes(word));
}
