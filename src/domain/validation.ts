import type { SeminarPlan } from "./types";

export interface ParseResult {
  ok: true;
  plan: SeminarPlan;
}

export interface ParseError {
  ok: false;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function parsePlanJson(text: string): ParseResult | ParseError {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: "JSONを読み込めませんでした。ファイル形式を確認してください。" };
  }
  if (!isRecord(raw)) {
    return { ok: false, message: "JSONの内容がセミナー設計データではありません。" };
  }
  const candidate = raw as Partial<SeminarPlan> & Record<string, unknown>;
  if (!Array.isArray(candidate.segments)) {
    return { ok: false, message: "segments が配列ではありません。" };
  }
  if (!isRecord(candidate.seminar) || typeof candidate.seminar.durationMin !== "number") {
    return { ok: false, message: "seminar.durationMin が数値ではありません。" };
  }
  if (!isRecord(candidate.seminar.venue)) {
    return { ok: false, message: "seminar.venue が未設定です。" };
  }
  if (!isRecord(candidate.seminar.audience)) {
    return { ok: false, message: "seminar.audience が未設定です。" };
  }
  if (!isRecord(candidate.seminar.discussion)) {
    return { ok: false, message: "seminar.discussion が未設定です。" };
  }
  for (const segment of candidate.segments) {
    const maybeSegment = segment as { durationMin?: unknown };
    if (typeof maybeSegment.durationMin !== "number" || maybeSegment.durationMin < 0) {
      return { ok: false, message: "各区間の所要分は0以上の数値にしてください。" };
    }
  }
  return {
    ok: true,
    plan: {
      ...(candidate as SeminarPlan),
      version: "1.0.0"
    }
  };
}

export function serializePlan(plan: SeminarPlan): string {
  return JSON.stringify(plan, null, 2);
}

export function getPlanFileName(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `seminar-design-plan-${year}${month}${day}-${hour}${minute}.json`;
}
