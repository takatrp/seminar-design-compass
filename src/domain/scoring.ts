import { audienceMaturityLabels, segmentTypeLabels } from "./labels";
import { sumDuration } from "./scheduling";
import type { CheckResult, ContextPack, PlanMetrics, ScoreSummary, SeminarPlan } from "./types";

type CheckStatus = CheckResult["status"];

function result(
  id: string,
  label: string,
  status: CheckStatus,
  weight: number,
  message: string,
  suggestion: string
): CheckResult {
  const score = status === "ok" ? weight : status === "warn" ? weight / 2 : 0;
  return { id, label, status, score, maxScore: weight, message, suggestion };
}

function ratio(part: number, total: number): number {
  if (total <= 0) return 0;
  return part / total;
}

function hasContent(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function containsAny(text: string, words: string[]): boolean {
  return words.some((word) => word.trim() && text.includes(word.trim()));
}

function mainMessageTerms(plan: SeminarPlan, pack: ContextPack): string[] {
  const seed = [plan.seminar.mainMessage, ...plan.seminar.subMessages, ...pack.recommendedWords].join(" ");
  const words = seed
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
  return Array.from(new Set([...words, ...pack.recommendedWords.filter((word) => word.length >= 2)]));
}

function commonChecks(plan: SeminarPlan, pack: ContextPack): CheckResult[] {
  const total = sumDuration(plan.segments);
  const target = plan.seminar.durationMin;
  const diff = Math.abs(total - target);
  const interactiveTypes = new Set(["discussion", "dialogue", "case", "work", "qa"]);
  const interactiveDuration = plan.segments
    .filter((segment) => interactiveTypes.has(segment.type))
    .reduce((sum, segment) => sum + segment.durationMin, 0);
  const lectureDuration = plan.segments
    .filter((segment) => segment.type === "lecture")
    .reduce((sum, segment) => sum + segment.durationMin, 0);
  const closing = plan.segments.find((segment) => segment.type === "closing" || segment.type === "summary");
  const openingExists = plan.segments.some((segment) => segment.type === "opening");
  const actionableClosing = Boolean(closing && hasContent(closing.participantAction));
  const terms = mainMessageTerms(plan, pack);
  const connected = plan.segments.filter((segment) =>
    containsAny(`${segment.goal} ${segment.takeaway}`, terms)
  ).length;
  const connectedRatio = ratio(connected, plan.segments.length);
  const takeawayRatio = ratio(plan.segments.filter((segment) => hasContent(segment.takeaway)).length, plan.segments.length);
  const interactionRatio = ratio(interactiveDuration, total);
  const lectureRatio = ratio(lectureDuration, total);
  const withEvidenceRatio = ratio(
    plan.segments.filter((segment) => {
      const notes = Object.values(segment.speakerNotes ?? {}).some(hasContent);
      return segment.assetIds.length > 0 || notes;
    }).length,
    plan.segments.length
  );
  const speakerRoles = plan.roles.filter((role) => role.type === "speaker" || role.type === "facilitator");
  const roleMinutes = speakerRoles.map((role) => ({
    role,
    minutes: plan.segments
      .filter((segment) => segment.leadRoleId === role.id)
      .reduce((sum, segment) => sum + segment.durationMin, 0)
  }));
  const maxRoleRatio = ratio(Math.max(0, ...roleMinutes.map((role) => role.minutes)), total);
  const interactionOk = plan.seminar.discussion.enabled ? 0.25 : 0.15;
  const interactionWarn = plan.seminar.discussion.enabled ? 0.15 : 0.1;

  return [
    result(
      "C1",
      "合計時間",
      diff === 0 ? "ok" : diff <= 5 ? "warn" : "bad",
      15,
      `合計${total}分、目標${target}分、差分${total - target}分です。`,
      "区間の所要分を調整するか、目標時間を見直してください。"
    ),
    result(
      "C2",
      "メインメッセージとの接続",
      connectedRatio >= 0.5 ? "ok" : connectedRatio >= 0.3 ? "warn" : "bad",
      10,
      `${Math.round(connectedRatio * 100)}%の区間がメッセージ語彙と接続しています。`,
      "各区間の狙い・持ち帰りに、メインメッセージやサブメッセージの語彙を入れてください。"
    ),
    result(
      "C3",
      "終了後行動の明確さ",
      hasContent(plan.seminar.desiredAction) && actionableClosing ? "ok" : hasContent(plan.seminar.desiredAction) ? "warn" : "bad",
      15,
      hasContent(plan.seminar.desiredAction)
        ? "終了後に取ってほしい行動は設定されています。"
        : "終了後に取ってほしい行動が未設定です。",
      "終了後行動を明文化し、まとめ区間の参加者アクションにも落としてください。"
    ),
    result(
      "C4",
      "持ち帰りの設定率",
      takeawayRatio >= 0.7 ? "ok" : takeawayRatio >= 0.5 ? "warn" : "bad",
      10,
      `${Math.round(takeawayRatio * 100)}%の区間に持ち帰りがあります。`,
      "各区間に参加者が持ち帰る言葉・判断軸・行動を1つずつ置いてください。"
    ),
    result(
      "C5",
      "対話・事例・ワーク時間",
      interactionRatio >= interactionOk ? "ok" : interactionRatio >= interactionWarn ? "warn" : "bad",
      10,
      `対話・事例・ワーク等は${Math.round(interactionRatio * 100)}%です。`,
      "講義の一部を事例、問い、ワークに置き換え、参加者が自分の現場に変換する時間を増やしてください。"
    ),
    result(
      "C6",
      "講義一方通行リスク",
      lectureRatio <= 0.6 ? "ok" : lectureRatio <= 0.7 ? "warn" : "bad",
      10,
      `講義時間は全体の${Math.round(lectureRatio * 100)}%です。`,
      "講義区間を短く分け、途中に問い・事例・ワークを差し込んでください。"
    ),
    result(
      "C7",
      "開始と終了の設計",
      openingExists && Boolean(closing) ? "ok" : openingExists || Boolean(closing) ? "warn" : "bad",
      10,
      openingExists && Boolean(closing) ? "導入とまとめが両方あります。" : "導入またはまとめが不足しています。",
      "最初に目的をそろえ、最後に行動宣言を残す区間を置いてください。"
    ),
    result(
      "C8",
      "役割バランス",
      speakerRoles.length <= 1 ? "ok" : maxRoleRatio <= 0.75 ? "ok" : maxRoleRatio <= 0.85 ? "warn" : "bad",
      10,
      speakerRoles.length <= 1
        ? "担当者が1名のため自動的に問題なしとします。"
        : `最も長い担当は全体の${Math.round(maxRoleRatio * 100)}%です。`,
      "複数の講師・進行役がいる場合は、問いかけや事例共有の担当を分散してください。"
    ),
    result(
      "C9",
      "素材・根拠の紐づけ",
      withEvidenceRatio >= 0.5 ? "ok" : withEvidenceRatio >= 0.3 ? "warn" : "bad",
      10,
      `${Math.round(withEvidenceRatio * 100)}%の区間に素材または講師メモがあります。`,
      "根拠資料、候補スライド、講師メモを区間ごとに紐づけてください。"
    )
  ];
}

export function evaluatePlan(plan: SeminarPlan, pack: ContextPack): ScoreSummary {
  const checks = [...commonChecks(plan, pack), ...(pack.evaluateChecks?.(plan, pack) ?? [])];
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
  const totalMaxScore = checks.reduce((sum, check) => sum + check.maxScore, 0);
  const overallScore = totalMaxScore === 0 ? 0 : Math.round((totalScore / totalMaxScore) * 100);
  return {
    label: "設計整合度",
    contextLabel: pack.contextScoreLabel,
    overallScore,
    totalScore,
    totalMaxScore,
    checks
  };
}

export function calculateMetrics(plan: SeminarPlan, pack: ContextPack): PlanMetrics {
  const totalDuration = sumDuration(plan.segments);
  const interactiveTypes = new Set(["discussion", "dialogue", "case", "work", "qa"]);
  const interactiveDuration = plan.segments
    .filter((segment) => interactiveTypes.has(segment.type))
    .reduce((sum, segment) => sum + segment.durationMin, 0);
  const lectureDuration = plan.segments
    .filter((segment) => segment.type === "lecture")
    .reduce((sum, segment) => sum + segment.durationMin, 0);
  const roleMinutes = plan.roles.map((role) => {
    const minutes = plan.segments
      .filter((segment) => segment.leadRoleId === role.id)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    return { roleId: role.id, label: role.label, minutes, ratio: ratio(minutes, totalDuration) };
  });
  const pillarMinutes = pack.pillars.map((pillar) => {
    const minutes = plan.segments
      .filter((segment) => segment.pillarId === pillar.id)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    return {
      pillarId: pillar.id,
      label: pillar.label,
      minutes,
      ratio: ratio(minutes, totalDuration),
      colorToken: pillar.colorToken
    };
  });
  const typeMinutes = Object.entries(segmentTypeLabels).map(([type, label]) => {
    const minutes = plan.segments
      .filter((segment) => segment.type === type)
      .reduce((sum, segment) => sum + segment.durationMin, 0);
    return { type: type as keyof typeof segmentTypeLabels, label, minutes, ratio: ratio(minutes, totalDuration) };
  });
  return {
    totalDuration,
    durationDiff: totalDuration - plan.seminar.durationMin,
    interactiveDuration,
    lectureDuration,
    roleMinutes,
    pillarMinutes,
    typeMinutes
  };
}

export function maturityLabel(value: keyof typeof audienceMaturityLabels): string {
  return audienceMaturityLabels[value];
}
