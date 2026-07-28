import { describe, expect, it } from "vitest";
import { createDefaultPlan } from "../domain/defaults";
import { calculateMetrics, evaluatePlan } from "../domain/scoring";

describe("時間配分", () => {
  it("休憩を全体時間に含め、柱別配分をplan.pillarsから計算する", () => {
    const plan = createDefaultPlan();
    plan.metadata.hasBreak = true;
    plan.metadata.breakDurationMin = 10;
    plan.metadata.totalDurationMin = 100;
    const metrics = calculateMetrics(plan);
    expect(metrics.contentDuration).toBe(90);
    expect(metrics.breakDuration).toBe(10);
    expect(metrics.totalDuration).toBe(100);
    expect(metrics.durationDiff).toBe(0);
    expect(metrics.pillarMinutes.map((item) => item.title)).toEqual(
      plan.pillars.map((pillar) => pillar.title)
    );
  });
});

describe("設計の確認", () => {
  it("TKC準拠度と役割バランスを含めず、基本的な抜けだけを確認する", () => {
    const plan = createDefaultPlan();
    const score = evaluatePlan(plan);
    expect(score.label).toBe("設計の確認");
    expect(score.checks.some((check) => /TKC|役割/.test(check.label))).toBe(false);
    expect(score.checks.map((check) => check.id)).toEqual(["D1", "D2", "D3", "D4"]);
  });
});
