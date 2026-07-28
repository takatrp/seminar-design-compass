import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "../domain/defaults";
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  loadStoredState,
  saveStoredState
} from "../domain/storage";
import { serializePlan } from "../domain/validation";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

class QuotaStorage extends MemoryStorage {
  failV2Writes = false;

  setItem(key: string, value: string) {
    if (this.failV2Writes && key === STORAGE_KEY) {
      throw new DOMException("容量不足", "QuotaExceededError");
    }
    super.setItem(key, value);
  }
}

function legacyJson() {
  return JSON.stringify({
    version: "1.0.0",
    id: "legacy",
    title: "旧保存",
    seminar: {
      durationMin: 10,
      startTime: "13:00",
      host: "松本",
      venue: {},
      audience: {},
      discussion: {}
    },
    segments: [
      {
        id: "a",
        title: "導入",
        durationMin: 10,
        pillarId: "purpose",
        type: "opening"
      }
    ]
  });
}

describe("localStorage保存", () => {
  it("v2を保存して読み込む", () => {
    const storage = new MemoryStorage();
    const plan = createDefaultPlan();
    saveStoredState(plan, storage);
    expect(storage.getItem(STORAGE_KEY)).toBe(serializePlan(plan));
    expect(loadStoredState(storage)?.plan).toEqual(plan);
  });

  it("壊れたv2があってもv1から移行し、v1を残したままv2へ保存する", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{broken");
    storage.setItem(LEGACY_STORAGE_KEY, legacyJson());
    const loaded = loadStoredState(storage);
    expect(loaded?.plan.version).toBe("2.0.0");
    expect(loaded?.plan.id).toBe("legacy");
    expect(storage.getItem(STORAGE_KEY)).toContain('"version": "2.0.0"');
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBe(legacyJson());
  });

  it("v2が有効ならv1より優先する", () => {
    const storage = new MemoryStorage();
    const current = createDefaultPlan();
    current.id = "current";
    storage.setItem(STORAGE_KEY, serializePlan(current));
    storage.setItem(LEGACY_STORAGE_KEY, legacyJson());
    expect(loadStoredState(storage)?.plan.id).toBe("current");
  });

  it("v1移行後のv2保存が容量超過でも移行済みplanを返す", () => {
    const storage = new QuotaStorage();
    storage.setItem(LEGACY_STORAGE_KEY, legacyJson());
    storage.failV2Writes = true;
    expect(loadStoredState(storage)?.plan.id).toBe("legacy");
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
