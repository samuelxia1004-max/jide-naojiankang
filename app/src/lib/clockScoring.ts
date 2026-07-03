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
  confidence: number;
  numberSectors: number;
  handLines: number;
  notes: string[];
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

function countHandLines(strokes: ClockStroke[], width: number, height: number, center: ClockPoint) {
  const centerTolerance = Math.min(width, height) * 0.16;
  const minHandLength = Math.min(width, height) * 0.15;
  const angles: number[] = [];

  for (const stroke of strokes) {
    if (stroke.length < 2 || isCircleStroke(stroke, width, height)) continue;
    if (strokeStraightness(stroke) < 0.72) continue;

    const first = stroke[0];
    const last = stroke[stroke.length - 1];
    const firstNearCenter = distance(first, center) < centerTolerance;
    const lastNearCenter = distance(last, center) < centerTolerance;
    if (!firstNearCenter && !lastNearCenter) continue;

    const outer = firstNearCenter ? last : first;
    if (distance(outer, center) < minHandLength) continue;
    angles.push(Math.atan2(outer.y - center.y, outer.x - center.x));
  }

  const distinctAngles: number[] = [];
  for (const angle of angles) {
    const duplicate = distinctAngles.some((existing) => Math.abs(Math.atan2(Math.sin(angle - existing), Math.cos(angle - existing))) < 0.35);
    if (!duplicate) distinctAngles.push(angle);
  }

  return distinctAngles.length;
}

export function scoreClockDrawing(strokes: ClockStroke[], width: number, height: number): ClockAutoScore {
  const drawnStrokes = strokes.filter((stroke) => stroke.length >= 2);
  const hasCircle = drawnStrokes.some((stroke) => isCircleStroke(stroke, width, height));
  const center = getClockCenter(drawnStrokes, width, height);
  const numberSectors = countNumberSectors(drawnStrokes, width, height, center);
  const handLines = countHandLines(drawnStrokes, width, height, center);
  const hasNumbers = numberSectors >= 4;
  const hasHands = handLines >= 2;
  const confidence = Math.round(((Number(hasCircle) + Number(hasNumbers) + Number(hasHands)) / 3) * 100);
  const notes = [
    hasCircle ? "识别到表盘轮廓" : "还没有稳定识别到表盘轮廓",
    hasNumbers ? "识别到多个数字区域" : "数字区域偏少或不够清楚",
    hasHands ? "识别到两根指针" : "指针数量或方向还不够清楚",
  ];

  return {
    hasCircle,
    hasNumbers,
    hasHands,
    confidence,
    numberSectors,
    handLines,
    notes,
  };
}
