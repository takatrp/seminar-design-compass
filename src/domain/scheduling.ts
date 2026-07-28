import type { SeminarPlan, Segment, TimelineItem } from "./types";

export function normalizeDuration(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

/**
 * カード自体の開始分を、休憩を含まない連続した構成時間として再計算します。
 * ガントや実時刻では buildTimeline を使い、休憩を差し込んだ開始分を参照します。
 */
export function autoSchedule(segments: Segment[]): Segment[] {
  let cursor = 0;
  return segments.map((segment) => {
    const durationMin = normalizeDuration(segment.durationMin);
    const scheduled = { ...segment, durationMin, startMin: cursor };
    cursor += durationMin;
    return scheduled;
  });
}

export function sumDuration(segments: Segment[]): number {
  return segments.reduce((total, segment) => total + normalizeDuration(segment.durationMin), 0);
}

export function buildTimeline(plan: SeminarPlan): TimelineItem[] {
  const segments = autoSchedule(plan.segments);
  const shouldInsertBreak = plan.metadata.hasBreak;
  const breakDuration = normalizeDuration(plan.metadata.breakDurationMin);
  const requestedBreakAfterId = plan.metadata.breakAfterSegmentId;
  const breakAfterId = segments.some((segment) => segment.id === requestedBreakAfterId)
    ? requestedBreakAfterId
    : undefined;
  const timeline: TimelineItem[] = [];
  let cursor = 0;
  let breakInserted = false;

  const appendBreak = () => {
    timeline.push({
      kind: "break",
      id: "seminar-break",
      title: plan.metadata.breakLabel.trim() || "休憩",
      startMin: cursor,
      durationMin: breakDuration
    });
    cursor += breakDuration;
    breakInserted = true;
  };

  segments.forEach((segment) => {
    timeline.push({
      kind: "segment",
      id: segment.id,
      title: segment.title,
      startMin: cursor,
      durationMin: segment.durationMin,
      pillarId: segment.pillarId,
      segment
    });
    cursor += segment.durationMin;
    if (shouldInsertBreak && segment.id === breakAfterId) appendBreak();
  });

  if (shouldInsertBreak && !breakInserted) appendBreak();
  return timeline;
}

export function sumTimelineDuration(plan: SeminarPlan): number {
  const timeline = buildTimeline(plan);
  const last = timeline[timeline.length - 1];
  return last ? last.startMin + last.durationMin : 0;
}

export function moveSegment(
  segments: Segment[],
  segmentId: string,
  direction: "up" | "down"
): Segment[] {
  const index = segments.findIndex((segment) => segment.id === segmentId);
  if (index < 0) return segments;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= segments.length) return segments;
  const next = [...segments];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return autoSchedule(next);
}

export function removeSegment(segments: Segment[], segmentId: string): Segment[] {
  return autoSchedule(segments.filter((segment) => segment.id !== segmentId));
}

export const deleteSegment = removeSegment;

export function duplicateSegment(
  segments: Segment[],
  segmentId: string,
  createId: () => string
): Segment[] {
  const index = segments.findIndex((segment) => segment.id === segmentId);
  if (index < 0) return segments;
  const original = segments[index];
  const duplicate: Segment = {
    ...structuredClone(original),
    id: createId(),
    title: `${original.title}（複製）`
  };
  const next = [...segments];
  next.splice(index + 1, 0, duplicate);
  return autoSchedule(next);
}
