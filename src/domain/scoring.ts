import { segmentTypeLabels } from "./labels";
import { sumDuration, sumTimelineDuration } from "./scheduling";
import type {
  CheckResult,
  PlanMetrics,
  ScoreSummary,
  SeminarPlan,
  SegmentType
} from "./types";

function ratio(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}

function result(
  id: string,
  label: string,
  status: CheckResult["status"],
  weight: number,
  message: string,
  suggestion: string
): CheckResult {
  const score = status === "ok" ? weight : status === "warn" ? weight / 2 : 0;
  return { id, label, status, score, maxScore: weight, message, suggestion };
}

/**
 * 固定方式への準拠度や役割配分ではなく、作成中データの基本的な抜けだけを確認します。
 */
export function evaluatePlan(plan: SeminarPlan): ScoreSummary {
  const scheduledDuration = sumTimelineDuration(plan);
  const durationDiff = scheduledDuration - plan.metadata.totalDurationMin;
  const completeGoals = plan.segments.filter((segment) => segment.goal.trim()).length;
  const completeScripts = plan.segments.filter((segment) => segment.script.trim()).length;
  const completeTakeaways = plan.segments.filter((segment) => segment.takeaway.trim()).length;
  const total = plan.segments.length;
  const completionRatio = (count: number) => ratio(count, total);
  const checks = [
    result(
      "D1",
      "全体時間",
      durationDiff === 0 ? "ok" : Math.abs(durationDiff) <= 5 ? "warn" : "bad",
      25,
      `休憩を含む構成は${scheduledDuration}分、設定した全体時間との差は${durationDiff}分です。`,
      "カードまたは休憩の時間を調整してください。"
    ),
    result(
      "D2",
      "カードの狙い",
      completionRatio(completeGoals) >= 1
        ? "ok"
        : completionRatio(completeGoals) >= 0.6
          ? "warn"
          : "bad",
      25,
      `${completeGoals}/${total}枚のカードに狙いがあります。`,
      "各カードで、参加者にどのような変化を起こすかを記入してください。"
    ),
    result(
      "D3",
      "話す内容",
      completionRatio(completeScripts) >= 0.8
        ? "ok"
        : completionRatio(completeScripts) >= 0.4
          ? "warn"
          : "bad",
      25,
      `${completeScripts}/${total}枚のカードに話す内容があります。`,
      "台本として使うカードから、話す内容を記入してください。"
    ),
    result(
      "D4",
      "持ち帰り",
      completionRatio(completeTakeaways) >= 1
        ? "ok"
        : completionRatio(completeTakeaways) >= 0.6
          ? "warn"
          : "bad",
      25,
      `${completeTakeaways}/${total}枚のカードに持ち帰りがあります。`,
      "各カードの終了時に参加者へ残したい言葉や行動を記入してください。"
    )
  ];
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
  const totalMaxScore = checks.reduce((sum, check) => sum + check.maxScore, 0);
  return {
    label: "設計の確認",
    overallScore: totalMaxScore ? Math.round((totalScore / totalMaxScore) * 100) : 0,
    totalScore,
    totalMaxScore,
    checks
  };
}

export function calculateMetrics(plan: SeminarPlan): PlanMetrics {
  const contentDuration = sumDuration(plan.segments);
  const breakDuration = plan.metadata.hasBreak ? plan.metadata.breakDurationMin : 0;
  const totalDuration = sumTimelineDuration(plan);
  const pillarMinutes = plan.pillars.map((pillar) => {
    const minutes = plan.segments
      .filter((segment) => segment.pillarId === pillar.id)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    return {
      pillarId: pillar.id,
      title: pillar.title,
      minutes,
      ratio: ratio(minutes, contentDuration),
      color: pillar.color
    };
  });
  const typeMinutes = Object.entries(segmentTypeLabels).map(([type, label]) => {
    const minutes = plan.segments
      .filter((segment) => segment.type === type)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    return {
      type: type as SegmentType,
      label,
      minutes,
      ratio: ratio(minutes, contentDuration)
    };
  });
  return {
    contentDuration,
    breakDuration,
    totalDuration,
    durationDiff: totalDuration - plan.metadata.totalDurationMin,
    pillarMinutes,
    typeMinutes
  };
}
