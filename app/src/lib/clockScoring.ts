export type ClockPoint = {
  x: number;
  y: number;
  t?: number;
};

export type ClockStroke = ClockPoint[];

export type ClockAutoScore = {
  hasCircle: boolean;
  hasNumbers: boolean;
  hasHands: boolean;
  hasTimeMatch: boolean;
  confidence: number;
  numberSectors: number;
  handLines: number;
  timeScore: number;
  notes: string[];
};

export type ClockTargetTime = {
  hour: number;
  minute: number;
};

type HandLine = {
  angle: number;
  length: number;
};

const distance = (a: ClockPoint, b: ClockPoint) => Math.hypot(a.x - b.x, a.y - b.y);

function strokeLength(stroke: ClockStroke) {
  return stroke.reduce((sum, point, index) => (index === 0 ? 0 : sum + distance(stroke[index - 1], point)), 0);
}

function boundsOf(points: ClockPoint[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function strokeStraightness(stroke: ClockStroke) {
  if (stroke.length < 2) return 0;
  const direct = distance(stroke[0], stroke[stroke.length - 1]);
  const length = strokeLength(stroke);
  return length === 0 ? 0 : direct / length;
}

function isCircleStroke(stroke: ClockStroke, width: number, height: number) {
  if (stroke.length < 12) return false;
  const length = strokeLength(stroke);
  const box = boundsOf(stroke);
  const boxWidth = box.maxX - box.minX;
  const boxHeight = box.maxY - box.minY;
  const minSize = Math.min(width, height) * 0.28;
  const aspect = boxWidth / Math.max(1, boxHeight);
  const closed = distance(stroke[0], stroke[stroke.length - 1]) < Math.max(boxWidth, boxHeight) * 0.25;
  const largeEnough = boxWidth > minSize && boxHeight > minSize;
  const notTooFlat = aspect > 0.65 && aspect < 1.55;
  const enoughTravel = length > Math.PI * Math.min(boxWidth, boxHeight) * 0.75;
  return closed && largeEnough && notTooFlat && enoughTravel;
}

function getClockCenter(strokes: ClockStroke[], width: number, height: number) {
  const circle = strokes.find((stroke) => isCircleStroke(stroke, width, height));
  if (!circle) return { x: width / 2, y: height / 2 };
  const box = boundsOf(circle);
  return {
    x: (box.minX + box.maxX) / 2,
    y: (box.minY + box.maxY) / 2,
  };
}

function countNumberSectors(strokes: ClockStroke[], width: number, height: number, center: ClockPoint) {
  const radius = Math.min(width, height) * 0.43;
  const sectors = new Set<number>();

  for (const stroke of strokes) {
    if (isCircleStroke(stroke, width, height)) continue;
    if (stroke.length < 2 || strokeStraightness(stroke) > 0.88) continue;

    for (const point of stroke) {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const radial = Math.hypot(dx, dy) / radius;
      if (radial < 0.42 || radial > 1.18) continue;
      const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
      sectors.add(Math.floor((angle / (Math.PI * 2)) * 12));
    }
  }

  return sectors.size;
}

function angleDiff(a: number, b: number) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function clockAngleFromMinutes(minutes: number) {
  return (minutes / 60) * Math.PI * 2 - Math.PI / 2;
}

function getHandLines(strokes: ClockStroke[], width: number, height: number, center: ClockPoint): HandLine[] {
  const centerTolerance = Math.min(width, height) * 0.16;
  const minHandLength = Math.min(width, height) * 0.15;
  const hands: HandLine[] = [];

  for (const stroke of strokes) {
    if (stroke.length < 2 || isCircleStroke(stroke, width, height)) continue;
    if (strokeStraightness(stroke) < 0.72) continue;

    const first = stroke[0];
    const last = stroke[stroke.length - 1];
    const firstNearCenter = distance(first, center) < centerTolerance;
    const lastNearCenter = distance(last, center) < centerTolerance;
    if (!firstNearCenter && !lastNearCenter) continue;

    const outer = firstNearCenter ? last : first;
    const length = distance(outer, center);
    if (length < minHandLength) continue;
    hands.push({
      angle: Math.atan2(outer.y - center.y, outer.x - center.x),
      length,
    });
  }

  const distinctHands: HandLine[] = [];
  for (const hand of hands.sort((a, b) => b.length - a.length)) {
    const duplicate = distinctHands.some((existing) => angleDiff(hand.angle, existing.angle) < 0.35);
    if (!duplicate) distinctHands.push(hand);
  }

  return distinctHands;
}

function scoreHandTime(hands: HandLine[], targetTime?: ClockTargetTime) {
  if (!targetTime || hands.length < 2) return { hasTimeMatch: false, timeScore: 0 };

  const targetMinuteAngle = clockAngleFromMinutes(targetTime.minute);
  const targetHourAngle = clockAngleFromMinutes(((targetTime.hour % 12) * 5) + targetTime.minute / 12);
  const candidates = hands.slice(0, 3);
  let best = Number.POSITIVE_INFINITY;

  for (let minuteIndex = 0; minuteIndex < candidates.length; minuteIndex += 1) {
    for (let hourIndex = 0; hourIndex < candidates.length; hourIndex += 1) {
      if (minuteIndex === hourIndex) continue;
      const minutePenalty = angleDiff(candidates[minuteIndex].angle, targetMinuteAngle);
      const hourPenalty = angleDiff(candidates[hourIndex].angle, targetHourAngle);
      const lengthPenalty = candidates[minuteIndex].length >= candidates[hourIndex].length ? 0 : 0.18;
      best = Math.min(best, minutePenalty + hourPenalty + lengthPenalty);
    }
  }

  if (best <= 0.7) return { hasTimeMatch: true, timeScore: 100 };
  if (best <= 1.05) return { hasTimeMatch: true, timeScore: 67 };
  if (best <= 1.45) return { hasTimeMatch: false, timeScore: 33 };
  return { hasTimeMatch: false, timeScore: 0 };
}

export function scoreClockDrawing(
  strokes: ClockStroke[],
  width: number,
  height: number,
  targetTime?: ClockTargetTime,
): ClockAutoScore {
  const drawnStrokes = strokes.filter((stroke) => stroke.length >= 2);
  const hasCircle = drawnStrokes.some((stroke) => isCircleStroke(stroke, width, height));
  const center = getClockCenter(drawnStrokes, width, height);
  const numberSectors = countNumberSectors(drawnStrokes, width, height, center);
  const hands = getHandLines(drawnStrokes, width, height, center);
  const handLines = hands.length;
  const hasNumbers = numberSectors >= 4;
  const hasHands = handLines >= 2;
  const { hasTimeMatch, timeScore } = scoreHandTime(hands, targetTime);
  const components = targetTime
    ? [Number(hasCircle), Number(hasNumbers), Number(hasHands), Number(hasTimeMatch)]
    : [Number(hasCircle), Number(hasNumbers), Number(hasHands)];
  const confidence = Math.round((components.reduce((sum, item) => sum + item, 0) / components.length) * 100);
  const notes = [
    hasCircle ? "识别到表盘轮廓" : "还没有稳定识别到表盘轮廓",
    hasNumbers ? "识别到多个数字区域" : "数字区域偏少或不够清楚",
    hasHands ? "识别到两根指针" : "指针数量或方向还不够清楚",
    targetTime
      ? hasTimeMatch
        ? "指针方向与题目时间大致匹配"
        : "指针方向和题目时间还不够匹配"
      : "未提供目标时间",
  ];

  return {
    hasCircle,
    hasNumbers,
    hasHands,
    hasTimeMatch,
    confidence,
    numberSectors,
    handLines,
    timeScore,
    notes,
  };
}
