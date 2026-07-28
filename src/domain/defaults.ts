import { autoSchedule } from "./scheduling";
import {
  PLAN_VERSION,
  type CustomMetaField,
  type Pillar,
  type SeminarMetadata,
  type SeminarPlan,
  type Segment
} from "./types";

export function makeId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createDefaultMetadata(): SeminarMetadata {
  return {
    date: "",
    startTime: "13:30",
    totalDurationMin: 90,
    hasBreak: false,
    breakDurationMin: 10,
    breakAfterSegmentId: undefined,
    breakLabel: "休憩",
    location: "",
    audience: "",
    purpose: "",
    customFields: []
  };
}

export function createDefaultPillars(): Pillar[] {
  return [
    {
      id: "introduction",
      title: "導入・問題提起",
      description: "参加者の現在地と、このテーマを扱う理由をそろえる",
      color: "#2563eb",
      order: 0
    },
    {
      id: "understanding",
      title: "理解・判断軸",
      description: "知識や考え方を、判断に使える形で伝える",
      color: "#7c3aed",
      order: 1
    },
    {
      id: "practice",
      title: "事例・実践",
      description: "事例、デモ、ワークを通して自分の現場へ置き換える",
      color: "#059669",
      order: 2
    },
    {
      id: "action",
      title: "まとめ・行動",
      description: "持ち帰りと、セミナー後の最初の行動を明確にする",
      color: "#ea580c",
      order: 3
    }
  ];
}

function defaultSegments(pillars: Pillar[]): Segment[] {
  const pillarId = (index: number) => pillars[index]?.id ?? pillars[0]?.id ?? "";
  return autoSchedule([
    {
      id: makeId("segment"),
      title: "導入：今日の目的と到達点",
      startMin: 0,
      durationMin: 10,
      pillarId: pillarId(0),
      type: "opening",
      goal: "参加者と今日のゴールを共有する",
      question: "今日の終了時に、何を持ち帰ってほしいですか。",
      script: "",
      transition: "それでは、テーマの背景から見ていきます。",
      takeaway: "今日扱う問いと到達点",
      notes: "",
      attachments: []
    },
    {
      id: makeId("segment"),
      title: "背景と基本の考え方",
      startMin: 0,
      durationMin: 25,
      pillarId: pillarId(1),
      type: "lecture",
      goal: "テーマを理解するための判断軸を伝える",
      question: "なぜ今、このテーマを扱う必要がありますか。",
      script: "",
      transition: "考え方を、具体的な事例に置き換えてみます。",
      takeaway: "判断に使える基本の観点",
      notes: "",
      attachments: []
    },
    {
      id: makeId("segment"),
      title: "事例と実践",
      startMin: 0,
      durationMin: 40,
      pillarId: pillarId(2),
      type: "case",
      goal: "具体例から実践のイメージを持ってもらう",
      question: "自分の現場では、どこから試せそうですか。",
      script: "",
      transition: "最後に、今日の内容を行動へつなげます。",
      takeaway: "現場で使える具体的な進め方",
      notes: "",
      attachments: []
    },
    {
      id: makeId("segment"),
      title: "まとめ：最初の一歩",
      startMin: 0,
      durationMin: 15,
      pillarId: pillarId(3),
      type: "closing",
      goal: "セミナー後の最初の行動を決めてもらう",
      question: "明日、最初に何をしますか。",
      script: "",
      transition: "",
      takeaway: "自分で決めた最初の一歩",
      notes: "",
      attachments: []
    }
  ]);
}

export function createDefaultPlan(): SeminarPlan {
  const timestamp = nowIso();
  const pillars = createDefaultPillars();
  const segments = defaultSegments(pillars);
  return {
    version: PLAN_VERSION,
    id: makeId("plan"),
    title: "新しいセミナー",
    createdAt: timestamp,
    updatedAt: timestamp,
    instructor: "松本",
    metadata: createDefaultMetadata(),
    pillars,
    segments,
    selectedSegmentId: segments[0]?.id,
    view: "cards"
  };
}

export function createBlankSegment(plan: SeminarPlan): Segment {
  return {
    id: makeId("segment"),
    title: "新しいカード",
    startMin: 0,
    durationMin: 10,
    pillarId: plan.pillars[0]?.id ?? "",
    type: "lecture",
    goal: "",
    question: "",
    script: "",
    transition: "",
    takeaway: "",
    notes: "",
    attachments: []
  };
}

export function createBlankPillar(order: number): Pillar {
  return {
    id: makeId("pillar"),
    title: "新しい柱",
    description: "",
    color: "#64748b",
    order
  };
}

export function createBlankCustomMetaField(): CustomMetaField {
  return {
    id: makeId("meta"),
    label: "",
    value: ""
  };
}

export function normalizeImportedPlan(plan: SeminarPlan): SeminarPlan {
  const segments = autoSchedule(plan.segments ?? []);
  return {
    ...plan,
    version: PLAN_VERSION,
    updatedAt: nowIso(),
    instructor: plan.instructor || "松本",
    metadata: {
      ...createDefaultMetadata(),
      ...plan.metadata,
      customFields: Array.isArray(plan.metadata?.customFields) ? plan.metadata.customFields : []
    },
    pillars: Array.isArray(plan.pillars) ? plan.pillars : [],
    segments,
    selectedSegmentId: segments.some((segment) => segment.id === plan.selectedSegmentId)
      ? plan.selectedSegmentId
      : segments[0]?.id,
    view: plan.view ?? "cards"
  };
}
