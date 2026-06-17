import { describe, expect, it } from "vitest";
import { tkcContextPack } from "../contextPacks/tkc";
import { createPlanFromTemplate } from "../domain/defaults";
import { parsePlanJson, serializePlan } from "../domain/validation";

describe("JSON import/export", () => {
  it("exportしたJSONをimportして同じplanになる", () => {
    const plan = createPlanFromTemplate(tkcContextPack, tkcContextPack.templates[0]);
    const parsed = parsePlanJson(serializePlan(plan));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.plan).toEqual(plan);
  });

  it("version未設定JSONを読み込んでも落ちない", () => {
    const plan = createPlanFromTemplate(tkcContextPack, tkcContextPack.templates[0]);
    const legacy = JSON.parse(serializePlan(plan));
    delete legacy.version;
    const parsed = parsePlanJson(JSON.stringify(legacy));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.plan.version).toBe("1.0.0");
  });

  it("seminarの入れ子構造が欠けたJSONを検出する", () => {
    const plan = createPlanFromTemplate(tkcContextPack, tkcContextPack.templates[0]);
    const broken = JSON.parse(serializePlan(plan));
    delete broken.seminar.venue;
    const parsed = parsePlanJson(JSON.stringify(broken));
    expect(parsed.ok).toBe(false);
  });
});
