import type { Segment } from "./types";

export function normalizeDuration(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

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

export function moveSegment(segments: Segment[], segmentId: string, direction: "up" | "down"): Segment[] {
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

export function duplicateSegment(segments: Segment[], segmentId: string, createId: () => string): Segment[] {
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
