import { describe, expect, it } from "vitest";
import { tkcContextPack } from "../contextPacks/tkc";
import { createPlanFromTemplate, makeId } from "../domain/defaults";
import { evaluatePlan } from "../domain/scoring";
import { autoSchedule } from "../domain/scheduling";
import type { SeminarPlan, Segment } from "../domain/types";

function basePlan(): SeminarPlan {
  return createPlanFromTemplate(tkcContextPack, tkcContextPack.templates[0]);
}

function check(plan: SeminarPlan, id: string) {
  const found = evaluatePlan(plan, tkcContextPack).checks.find((item) => item.id === id);
  if (!found) throw new Error(`missing check ${id}`);
  return found;
}

describe("evaluatePlan", () => {
  it("合計時間一致でC1がok", () => {
    expect(check(basePlan(), "C1").status).toBe("ok");
  });

  it("5分以内差分でC1がwarn", () => {
    const plan = basePlan();
    plan.seminar.durationMin += 5;
    expect(check(plan, "C1").status).toBe("warn");
  });

  it("5分超差分でC1がbad", () => {
    const plan = basePlan();
    plan.seminar.durationMin += 10;
    expect(check(plan, "C1").status).toBe("bad");
  });

  it("discussion有効時に対話時間不足で警告する", () => {
    const plan = basePlan();
    plan.segments = autoSchedule(
      plan.segments.map((segment) => ({
        ...segment,
        type: "lecture",
        discussion: undefined
      }))
    );
    expect(check(plan, "C5").status).not.toBe("ok");
  });

  it("TKC packで自計化が継続MASより後にある場合、T3がbad", () => {
    const plan = basePlan();
    const self = plan.segments.find((segment) => segment.pillarId === "tkc-self-accounting");
    const others = plan.segments.filter((segment) => segment.id !== self?.id);
    if (!self) throw new Error("self-accounting segment missing");
    plan.segments = autoSchedule([...others, self]);
    expect(check(plan, "T3").status).toBe("bad");
  });

  it("demo区間にtakeawayがない場合、T7がwarnまたはbad", () => {
    const plan = basePlan();
    const demo: Segment = {
      ...plan.segments[0],
      id: makeId("segment"),
      title: "機能デモ",
      type: "demo",
      pillarId: "tkc-advisory-mas",
      durationMin: 10,
      participantAction: "",
      takeaway: "",
      speakerNotes: {}
    };
    plan.segments = autoSchedule([...plan.segments, demo]);
    expect(["warn", "bad"]).toContain(check(plan, "T7").status);
  });
});
