import { parsePlanJson, serializePlan } from "./validation";
import type { SeminarPlan } from "./types";

export const STORAGE_KEY = "seminar-design-compass:v1";

export interface StoredState {
  plan: SeminarPlan;
  selectedSegmentId?: string;
  view?: SeminarPlan["view"];
}

export function loadStoredState(): StoredState | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = parsePlanJson(raw);
  if (!parsed.ok) return null;
  return {
    plan: parsed.plan,
    selectedSegmentId: parsed.plan.selectedSegmentId,
    view: parsed.plan.view
  };
}

export function saveStoredState(plan: SeminarPlan): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, serializePlan(plan));
}
