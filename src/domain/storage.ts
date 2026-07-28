import { parsePlanJson, serializePlan } from "./validation";
import type { SeminarPlan } from "./types";

export const STORAGE_KEY = "seminar-design-compass:v2";
export const LEGACY_STORAGE_KEY = "seminar-design-compass:v1";

export interface StoredState {
  plan: SeminarPlan;
  selectedSegmentId?: string;
  view?: SeminarPlan["view"];
}

function browserStorage(): Storage | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

function parseStoredValue(raw: string) {
  const direct = parsePlanJson(raw);
  if (direct.ok) return direct;
  try {
    const wrapper = JSON.parse(raw) as { plan?: unknown };
    if (wrapper && typeof wrapper === "object" && wrapper.plan) {
      return parsePlanJson(JSON.stringify(wrapper.plan));
    }
  } catch {
    // parsePlanJson のエラーをそのまま無効データとして扱います。
  }
  return direct;
}

export function loadStoredState(storage: Storage | null = browserStorage()): StoredState | null {
  if (!storage) return null;
  const currentRaw = storage.getItem(STORAGE_KEY);
  if (currentRaw) {
    const parsed = parseStoredValue(currentRaw);
    if (parsed.ok) {
      return {
        plan: parsed.plan,
        selectedSegmentId: parsed.plan.selectedSegmentId,
        view: parsed.plan.view
      };
    }
  }

  const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyRaw) return null;
  const migrated = parseStoredValue(legacyRaw);
  if (!migrated.ok) return null;
  try {
    storage.setItem(STORAGE_KEY, serializePlan(migrated.plan));
  } catch {
    // 容量超過でも移行済みデータは画面へ返し、アプリを起動可能に保ちます。
  }
  return {
    plan: migrated.plan,
    selectedSegmentId: migrated.plan.selectedSegmentId,
    view: migrated.plan.view
  };
}

export function saveStoredState(
  plan: SeminarPlan,
  storage: Storage | null = browserStorage()
): void {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, serializePlan(plan));
}

export function clearStoredState(storage: Storage | null = browserStorage()): void {
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
}
